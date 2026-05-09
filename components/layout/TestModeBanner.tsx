'use client'

import { FlaskConical } from 'lucide-react'

interface TestModeBannerProps {
  isTestMode?: boolean
}

export default function TestModeBanner({ isTestMode }: TestModeBannerProps) {
  if (!isTestMode) return null

  return (
    <div className="sticky top-0 bg-amber-400 text-amber-900 text-center py-2 px-4 text-sm font-medium w-full z-50 shadow-sm">
      <FlaskConical className="h-4 w-4 inline-block mr-2 -mt-0.5" />
      Ambiente de teste — pagamentos não são reais. Use o cartão <code className="bg-amber-300 px-1 py-0.5 rounded text-amber-950 font-bold tracking-widest ml-1">4242 4242 4242 4242</code> para testar.
    </div>
  )
}
