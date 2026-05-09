import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { Toaster } from '@/components/ui/sonner'
import TestModeBanner from '@/components/layout/TestModeBanner'
import { config } from '@/lib/config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'TicketFlow — Bilheteria digital moderna',
    template: '%s — TicketFlow',
  },
  description: 'Compre e venda ingressos online com segurança. Ingressos digitais com QR Code, dashboard completo para organizadores.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <Header />
        <TestModeBanner isTestMode={config.app.isTestMode} />
        <main>{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
