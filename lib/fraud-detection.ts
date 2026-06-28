import { Redis } from '@upstash/redis'
import { reportSuspiciousActivity } from './sentry'

let redis: Redis | null = null

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch (e) {
  console.error('[FraudDetection] Redis init failed:', e)
}

export async function trackRejectedPayment(
  orderId: string,
  ip: string,
  cardLastFour: string
): Promise<{ shouldBlock: boolean }> {
  if (redis) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const key = `fraud:cards:${ip}:${today}`
      
      await redis.sadd(key, cardLastFour)
      const count = await redis.scard(key)
      
      // Expire the key in 24 hours to clean up storage
      await redis.expire(key, 86400)
      
      if (count > 3) {
        reportSuspiciousActivity('multiple_cards', {
          ip,
          attempts: count,
          orderId
        })
        return { shouldBlock: true }
      }
    } catch (e) {
      console.error('[FraudDetection] Error tracking card:', e)
    }
  }
  
  return { shouldBlock: false }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
