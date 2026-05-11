import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { Toaster } from '@/components/ui/sonner'
import TestModeBanner from '@/components/layout/TestModeBanner'
import { config } from '@/lib/config'
import PWARegistration from '@/components/notifications/PWARegistration'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'TicketFlow — Bilheteria digital moderna',
    template: '%s — TicketFlow',
  },
  description: 'Compre e venda ingressos online com segurança. Ingressos digitais com QR Code, dashboard completo para organizadores.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TicketFlow',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <PWARegistration />
        <Header />
        <TestModeBanner isTestMode={config.app.isTestMode} />
        <main>{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
