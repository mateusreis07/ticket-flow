import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  debug: process.env.NODE_ENV !== 'production',

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  beforeSend(event, hint) {
    const error = hint.originalException
    
    if (error instanceof Error) {
      if (error.message.includes('NEXT_NOT_FOUND')) return null
      if (error.message.includes('NEXT_REDIRECT')) return null
    }
    
    return event
  },

  initialScope: {
    tags: {
      runtime: 'nodejs',
      framework: 'nextjs',
    },
  },
})
