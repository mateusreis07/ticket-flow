'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'

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

export default function PushManager({ userId }: PushManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => setIsSubscribed(false))
  }, [userId])

  const subscribe = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada')
      return
    }

    setIsLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'denied') {
        setIsLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ) as unknown as BufferSource,
      })

      const p256dh = sub.getKey('p256dh')
      const auth = sub.getKey('auth')

      if (!p256dh || !auth) throw new Error('Keys not available')

      await fetch('/api/push/subscribe', {
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

      setIsSubscribed(true)
    } catch (err) {
      console.error('[PushManager] Erro ao ativar notificações:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
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
    } catch (err) {
      console.error('[PushManager] Erro ao desativar notificações:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Browser não suporta PWA push
  if (permission === 'unsupported') return null

  // Notificações explicitamente bloqueadas pelo usuário
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

  // Já está inscrito
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

  // Não inscrito — mostrar convite
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-5 w-5 text-primary" />
        <p className="font-semibold text-gray-900">Ativar notificações</p>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Receba lembretes dos seus eventos e confirmações de compra direto no celular.
      </p>
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
            Ativar notificações
          </>
        )}
      </button>
    </div>
  )
}
