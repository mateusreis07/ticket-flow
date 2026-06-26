import { notFound } from 'next/navigation'

export default function SentryTestPage() {
  if (process.env.NODE_ENV === 'production') {
    return notFound()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Teste do Sentry</h1>
      <p className="mb-8 text-gray-600">Esta página só existe em desenvolvimento</p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            throw new Error('Teste de erro do cliente — ' + new Date())
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Testar erro de cliente
        </button>

        <button
          onClick={() => {
            import('@sentry/nextjs').then((Sentry) => {
              Sentry.captureMessage(
                'Teste manual do TicketFlow — ' + new Date(),
                'info'
              )
              alert('Mensagem enviada ao Sentry!')
            })
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Testar captura manual
        </button>

        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/sentry-test')
              if (!res.ok) throw new Error('API request failed')
              alert('Erro de API acionado! Verifique o console e o Sentry.')
            } catch (e) {
              console.error(e)
            }
          }}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Testar erro de API
        </button>
      </div>
    </div>
  )
}
