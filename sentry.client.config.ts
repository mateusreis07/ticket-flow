import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,

  debug: false,

  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_FORCE_ENABLE === 'true',

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event, hint) {
    const error = hint.originalException
    
    if (typeof error === 'string') {
      if (error.includes('ResizeObserver loop')) return null
      if (error.includes('Non-Error promise rejection')) return null
    }
    
    if (error instanceof Error) {
      if (error.message.includes('ChunkLoadError')) return null
      if (error.message.includes('Loading chunk')) return null
    }
    
    return event
  },

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed',
    'Non-Error promise rejection captured',
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'ChunkLoadError',
    /^No error$/,
  ],
})
