import * as Sentry from '@sentry/nextjs'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  Sentry.captureException(
    new Error('Teste de erro de API — ' + new Date()),
    { tags: { test: 'true' } }
  )

  return Response.json({
    message: 'Erro de teste enviado ao Sentry',
    timestamp: new Date().toISOString(),
  })
}
