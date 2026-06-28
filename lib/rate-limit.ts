import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type RateLimitRoute = 'payment' | 'order' | 'auth' | 'api' | 'scanner'

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
  blocked?: boolean
  reason?: 'rate_limited' | 'redis_unavailable'
}

const CRITICAL_ROUTES: RateLimitRoute[] = ['payment', 'order', 'auth']

let redis: Redis | null = null
let isRedisConfigured = false

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    isRedisConfigured = true
  }
} catch (e) {
  console.error('[RateLimit] Redis init failed:', e)
}

const LIMITS: Record<RateLimitRoute, { requests: number, window: any }> = {
  payment: { requests: 10, window: '1 h' },
  order:   { requests: 20, window: '1 h' },
  auth:    { requests: 5,  window: '15 m' },
  api:     { requests: 100, window: '1 m' },
  scanner: { requests: 30, window: '1 m' },
}

const limiters: Partial<Record<RateLimitRoute, Ratelimit>> = {}

if (isRedisConfigured) {
  for (const r of Object.keys(LIMITS) as RateLimitRoute[]) {
    limiters[r] = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(
        LIMITS[r].requests,
        LIMITS[r].window
      ),
      prefix: 'ticketflow:rl:' + r,
    })
  }
}

const memoryStore = new Map<string, {
  count: number
  resetAt: number
}>()

function parseWindow(window: string): number {
  const [valueStr, unit] = window.split(' ')
  const value = parseInt(valueStr, 10)
  switch (unit) {
    case 'h': return value * 3600000
    case 'm': return value * 60000
    case 's': return value * 1000
    default: return 60000
  }
}

function checkMemoryLimit(route: RateLimitRoute, identifier: string): RateLimitResult {
  const config = LIMITS[route]
  const windowMs = parseWindow(config.window)
  const key = route + ':' + identifier
  const now = Date.now()

  let entry = memoryStore.get(key)
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    memoryStore.set(key, entry)
  }

  entry.count++
  const success = entry.count <= config.requests

  return {
    success,
    limit: config.requests,
    remaining: Math.max(0, config.requests - entry.count),
    reset: entry.resetAt,
    retryAfter: success ? undefined : Math.ceil((entry.resetAt - now) / 1000),
  }
}

export async function checkRateLimit(
  route: RateLimitRoute,
  identifier: string
): Promise<RateLimitResult> {
  if (!isRedisConfigured || !limiters[route]) {
    if (CRITICAL_ROUTES.includes(route)) {
      console.error('[RateLimit] Redis unavailable for critical route:', route)
      return {
        success: false,
        blocked: true,
        reason: 'redis_unavailable',
        limit: 0,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfter: 60,
      }
    } else {
      return checkMemoryLimit(route, identifier)
    }
  }

  try {
    const result = await limiters[route]!.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      reason: result.success ? undefined : 'rate_limited',
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (redisError) {
    console.error('[RateLimit] Redis error:', redisError)
    if (CRITICAL_ROUTES.includes(route)) {
      return {
        success: false,
        blocked: true,
        reason: 'redis_unavailable',
        limit: 0,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfter: 60,
      }
    } else {
      return checkMemoryLimit(route, identifier)
    }
  }
}

export function getIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp
  return '127.0.0.1'
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const isRedisDown = result.reason === 'redis_unavailable'

  return Response.json(
    {
      error: isRedisDown
        ? 'Serviço temporariamente indisponível. Tente novamente em instantes.'
        : 'Muitas tentativas. Aguarde antes de tentar novamente.',
      retryAfter: result.retryAfter ?? 60,
      reason: result.reason,
    },
    {
      status: isRedisDown ? 503 : 429,
      headers: {
        'Retry-After': String(result.retryAfter ?? 60),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  )
}
