// Type declaration for next-pwa (no official @types package)
declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  interface RuntimeCachingRule {
    urlPattern: RegExp | string
    handler: 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate'
    options?: {
      cacheName?: string
      expiration?: {
        maxEntries?: number
        maxAgeSeconds?: number
      }
      networkTimeoutSeconds?: number
    }
  }

  interface PWAConfig {
    dest: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    customWorkerDir?: string
    runtimeCaching?: RuntimeCachingRule[]
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
