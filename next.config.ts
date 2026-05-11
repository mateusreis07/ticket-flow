import type { NextConfig } from 'next'
import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'public',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/api\.qrserver\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'qr-code-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
  fallbacks: {
    document: '/offline',
  },
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=self' },
        ],
      },
    ]
  },
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

export default withPWA(nextConfig)
