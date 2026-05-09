'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh({ isPending }: { isPending: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (isPending) {
      const interval = setInterval(() => {
        router.refresh() // Recarrega a rota silenciosamente em background
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isPending, router])

  return null
}
