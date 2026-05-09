'use client'

import { useState } from 'react'
import { CreditCard, Loader2, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface PaymentButtonProps {
  orderId: string
  totalAmount: number
}

type ErrorType = 'expired' | 'unavailable' | 'generic' | null

function ErrorMessage({ type, message }: { type: ErrorType; message: string }) {
  if (!type) return null

  if (type === 'expired') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">Pedido expirado</p>
          <p className="text-sm text-amber-700 mt-0.5">{message}</p>
          <a href="/" className="text-sm font-semibold text-amber-800 underline mt-2 inline-block">
            Selecionar novos ingressos →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-800 text-sm">
          {type === 'unavailable' ? 'Serviço indisponível' : 'Erro no pagamento'}
        </p>
        <p className="text-sm text-red-700 mt-0.5">{message}</p>
      </div>
    </div>
  )
}

export default function PaymentButton({ orderId, totalAmount }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handlePayment = async () => {
    setIsLoading(true)
    setErrorType(null)
    setErrorMessage('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Classificar o tipo de erro para exibir mensagem contextual
        const msg = data.error || 'Erro desconhecido'

        if (msg.toLowerCase().includes('expirou') || msg.toLowerCase().includes('expirado')) {
          setErrorType('expired')
        } else if (response.status >= 500) {
          setErrorType('unavailable')
        } else {
          setErrorType('generic')
        }

        setErrorMessage(msg)
        setIsLoading(false)
        return
      }

      // Redirecionar para o Stripe Checkout — manter loading ativo até o redirect
      window.location.href = data.url

    } catch {
      setErrorType('unavailable')
      setErrorMessage('Não foi possível conectar ao servidor de pagamento. Verifique sua internet e tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <ErrorMessage type={errorType} message={errorMessage} />

      <button
        onClick={handlePayment}
        disabled={isLoading || errorType === 'expired'}
        className="w-full bg-primary text-white rounded-xl py-4 font-semibold text-base hover:bg-primary-hover transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirecionando para pagamento...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pagar {formatCurrency(totalAmount)} com cartão
          </>
        )}
      </button>
    </div>
  )
}
