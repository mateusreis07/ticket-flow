import * as Sentry from '@sentry/nextjs'

export function trackPaymentAttempt(
  method: 'pix' | 'card',
  orderId: string,
  amount: number
) {
  Sentry.addBreadcrumb({
    category: 'payment',
    message: 'Payment attempt started',
    level: 'info',
    data: {
      method,
      orderId,
      amount,
    },
  })
}

export function trackPaymentSuccess(
  method: 'pix' | 'card',
  orderId: string,
  amount: number
) {
  Sentry.addBreadcrumb({
    category: 'payment',
    message: 'Payment succeeded',
    level: 'info',
    data: { method, orderId, amount },
  })
}

export function trackPaymentFailure(
  method: 'pix' | 'card',
  orderId: string,
  reason: string
) {
  Sentry.addBreadcrumb({
    category: 'payment',
    message: 'Payment failed: ' + reason,
    level: 'warning',
    data: { method, orderId, reason },
  })
}

export function trackCheckinAction(
  eventId: string,
  result: 'success' | 'already_used' | 'not_found'
) {
  Sentry.addBreadcrumb({
    category: 'business',
    message: 'Check-in Action',
    level: 'info',
    data: { eventId, result },
  })
}

export function captureWebhookError(
  provider: string,
  error: unknown,
  context: Record<string, unknown>
) {
  Sentry.captureException(error, {
    tags: {
      type: 'webhook_error',
      provider,
      critical: 'true',
    },
    extra: context,
  })
}
