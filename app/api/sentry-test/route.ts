import * as Sentry from '@sentry/nextjs'

export async function GET() {
  const eventId = Sentry.captureException(
    new Error('🧪 Teste de erro de API (server-side) — ' + new Date().toISOString()),
    { tags: { test: 'true', route: 'api/sentry-test' } }
  )

  return Response.json(
    {
      message: 'Erro capturado e enviado ao Sentry!',
      eventId,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  )
}
