'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'

export default function CheckoutTimer({ expiresAt }: { expiresAt: string }) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const expires = new Date(expiresAt).getTime()
    const now = Date.now()
    return Math.max(0, Math.floor((expires - now) / 1000))
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const expires = new Date(expiresAt).getTime()
      const now = Date.now()
      const diff = Math.max(0, Math.floor((expires - now) / 1000))
      
      setTimeLeft(diff)
      
      if (diff <= 0) {
        clearInterval(timer)
        router.push('/checkout/expirado')
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, router])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  const isUrgent = timeLeft < 300 // less than 5 minutes

  return (
    <div className={`flex items-center gap-3 border rounded-xl p-3 ${
      isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
      <span className={`font-medium text-sm ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
        Pedido expira em {formattedTime}
      </span>
    </div>
  )
}
