'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Loader2, AlertCircle } from 'lucide-react'

interface PushManagerProps {
  userId: string
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Timeout de segurança para evitar loading infinito
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms)
    ),
  ])
}

export default function PushManager({ userId }: PushManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    // Verificar subscription existente com timeout
    withTimeout(navigator.serviceWorker.ready, 5000, 'serviceWorker.ready')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch((err) => {
        console.warn('[PushManager] SW não pronto na inicialização:', err.message)
        setIsSubscribed(false)
      })
  }, [userId])

  const subscribe = async () => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      // 1. Verificar variável VAPID
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada no ambiente.')
      }

      // 2. Solicitar permissão
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'denied') {
        setIsLoading(false)
        return
      }

      // 3. Aguardar SW com timeout de 8 segundos
      console.log('[PushManager] Aguardando Service Worker...')
      const reg = await withTimeout(
        navigator.serviceWorker.ready,
        8000,
        'serviceWorker.ready na subscrição'
      )
      console.log('[PushManager] SW pronto:', reg.scope)

      // 4. Criar subscription com timeout de 10 segundos
      console.log('[PushManager] Criando subscription push...')
      const sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        }),
        10000,
        'pushManager.subscribe'
      )
      console.log('[PushManager] Subscription criada:', sub.endpoint.substring(0, 50) + '...')

      const p256dh = sub.getKey('p256dh')
      const auth = sub.getKey('auth')
      if (!p256dh || !auth) throw new Error('Chaves de criptografia não disponíveis.')

      // 5. Salvar no servidor
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dh)))),
            auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(auth)))),
          },
          userAgent: navigator.userAgent,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(`Erro na API: ${data.error ?? response.status}`)
      }

      console.log('[PushManager] ✅ Subscription salva com sucesso')
      setIsSubscribed(true)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      console.error('[PushManager] ❌ Erro ao ativar notificações:', error.message)
      setErrorMsg(diagnosticMessage(error.message))
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const reg = await withTimeout(navigator.serviceWorker.ready, 5000, 'SW ready on unsub')
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
    } catch (err: unknown) {
      console.error('[PushManager] Erro ao desativar:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Mensagem amigável por categoria de erro
  function diagnosticMessage(msg: string): string {
    if (msg.includes('NEXT_PUBLIC_VAPID')) return 'Configuração incompleta no servidor. Contate o suporte.'
    if (msg.includes('Timeout') && msg.includes('serviceWorker')) return 'Service Worker não carregou. Tente recarregar a página.'
    if (msg.includes('Timeout') && msg.includes('subscribe')) return 'O navegador demorou para responder. Verifique sua conexão e tente novamente.'
    if (msg.includes('API')) return `Erro ao salvar configuração: ${msg}`
    return 'Não foi possível ativar. Recarregue a página e tente novamente.'
  }

  // Browser não suporta
  if (permission === 'unsupported') return null

  // Bloqueado pelo usuário
  if (permission === 'denied') {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <BellOff className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 text-sm">Notificações bloqueadas</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Acesse as configurações do navegador para reativar as notificações do TicketFlow.
          </p>
        </div>
      </div>
    )
  }

  // Já inscrito
  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <BellRing className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800 text-sm">Notificações ativas</p>
            <p className="text-xs text-green-700 mt-0.5">
              Você receberá lembretes dos seus eventos
            </p>
          </div>
        </div>
        <button
          onClick={unsubscribe}
          disabled={isLoading}
          className="text-xs text-green-700 border border-green-300 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          Desativar
        </button>
      </div>
    )
  }

  // Não inscrito
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-5 w-5 text-primary" />
        <p className="font-semibold text-gray-900">Ativar notificações</p>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Receba lembretes dos seus eventos e confirmações de compra direto no celular.
      </p>

      {/* Mensagem de erro visível */}
      {errorMsg && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{errorMsg}</p>
        </div>
      )}

      <button
        onClick={subscribe}
        disabled={isLoading}
        className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Ativando...
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            {errorMsg ? 'Tentar novamente' : 'Ativar notificações'}
          </>
        )}
      </button>
    </div>
  )
}
