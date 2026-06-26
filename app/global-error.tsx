'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { location: 'global_error_boundary' },
    })
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 40, fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#111827' }}>Algo deu errado</h1>
        <p style={{ color: '#6B7280' }}>Por favor, recarregue a página.</p>
        <button
          onClick={reset}
          style={{
            background: '#7C3AED',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '16px',
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
