'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

export default function SentryTestPage() {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  async function sendCaptureMessage() {
    setLoading(true)
    setStatus(null)
    try {
      const id = Sentry.captureMessage('🧪 Teste manual do TicketFlow — ' + new Date().toISOString(), 'info')
      setStatus(`✅ Evento enviado! ID: ${id}\n\nAguarde até 30s e verifique o Sentry em:\nhttps://sentry.io/issues/`)
    } catch (e: any) {
      setStatus('❌ Erro ao enviar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function testApiRoute() {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/sentry-test')
      const data = await res.json()
      setStatus(`✅ API chamada! Resposta: ${JSON.stringify(data)}\n\nSe retornou status 500, o erro foi capturado no Sentry.`)
    } catch (e: any) {
      setStatus('❌ Erro na chamada da API: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🔍 Diagnóstico do Sentry</h1>
      <p className="text-gray-500 mb-6 text-sm">Página de validação da integração com o Sentry</p>

      {/* Status da configuração */}
      <div className={`rounded-xl p-4 mb-6 border ${dsn ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className="font-semibold text-sm mb-1">
          {dsn ? '✅ DSN configurado' : '❌ DSN não configurado'}
        </p>
        {dsn ? (
          <p className="text-xs text-green-700 break-all font-mono">{dsn.slice(0, 50)}...</p>
        ) : (
          <p className="text-xs text-red-700">
            Adicione <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SENTRY_DSN</code> no seu <code>.env.local</code>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Ambiente: <span className="font-mono font-bold">{process.env.NODE_ENV}</span>
        </p>
      </div>

      {/* Botões de teste */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            throw new Error('💥 Teste de erro não tratado no Client — ' + new Date().toISOString())
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-medium transition-colors text-left"
        >
          🔴 Disparar erro não tratado (simula crash real)
        </button>

        <button
          onClick={sendCaptureMessage}
          disabled={loading || !dsn}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-medium transition-colors text-left"
        >
          {loading ? '⏳ Enviando...' : '🟣 Captura manual (captureMessage)'}
        </button>

        <button
          onClick={testApiRoute}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-medium transition-colors text-left"
        >
          {loading ? '⏳ Chamando API...' : '🟠 Testar erro de API (server-side)'}
        </button>
      </div>

      {/* Resultado */}
      {status && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <pre className="text-sm whitespace-pre-wrap text-gray-800">{status}</pre>
        </div>
      )}

      <div className="mt-8 text-xs text-gray-400 border-t pt-4">
        <p>💡 Após clicar nos botões, verifique a aba <strong>Issues</strong> no painel do Sentry.</p>
        <p className="mt-1">O modo <code>debug: true</code> está ativo em desenvolvimento — veja os logs do console para detalhes.</p>
      </div>
    </div>
  )
}
