'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/format'
import type { AppliedCoupon, PaymentMethod, PixPaymentData } from '@/types'
import CouponInput from '@/components/checkout/CouponInput'
import PaymentButton from '@/components/checkout/PaymentButton'
import CheckoutTimer from '@/components/checkout/CheckoutTimer'
import { ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector'
import { PixPaymentDisplay } from '@/components/checkout/PixPaymentDisplay'
import { PixButton } from '@/components/checkout/PixButton'

interface CheckoutClientProps {
  orderId: string
  eventId: string
  subtotal: number
  expiresAt: string | null
  initialCoupon: AppliedCoupon | null
  initialPaymentMethod?: PaymentMethod
  initialPixData?: PixPaymentData | null
  cancelOrderAction: () => Promise<void>
}

export default function CheckoutClient({
  orderId,
  eventId,
  subtotal,
  expiresAt,
  initialCoupon,
  initialPaymentMethod = 'pix',
  initialPixData = null,
  cancelOrderAction,
}: CheckoutClientProps) {
  const router = useRouter()
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(initialCoupon)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialPaymentMethod)
  const [pixData, setPixData] = useState<PixPaymentData | null>(initialPixData)
  const [showPixDisplay, setShowPixDisplay] = useState(!!initialPixData)
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)

  const currentTotal = appliedCoupon ? appliedCoupon.new_total : subtotal

  const handleCouponApplied = (result: AppliedCoupon) => {
    setAppliedCoupon(result)
  }

  const handleCouponRemoved = () => {
    setAppliedCoupon(null)
  }

  const handlePixPayment = async () => {
    setIsGeneratingPix(true)
    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      
      const data = await response.json()
      
      if (data.free) {
        router.push('/checkout/sucesso?order=' + orderId)
        return
      }
      
      if (data.success) {
        setPixData(data.pixData)
        setShowPixDisplay(true)
      } else {
        alert(data.error ?? 'Erro ao gerar Pix. Tente novamente ou use o cartão.')
      }
    } catch (error) {
      alert('Erro de conexão ao gerar o Pix.')
    } finally {
      setIsGeneratingPix(false)
    }
  }

  const handlePaymentConfirmed = () => {
    router.push('/checkout/sucesso?order=' + orderId)
  }

  if (showPixDisplay && pixData) {
    return (
      <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <PixPaymentDisplay
          pixData={pixData}
          orderId={orderId}
          totalAmount={currentTotal}
          onPaymentConfirmed={handlePaymentConfirmed}
          onCancel={() => setShowPixDisplay(false)}
        />
      </div>
    )
  }

  return (
    <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-bold text-gray-900 text-lg mb-5">Finalizar compra</h2>

      {expiresAt && <CheckoutTimer expiresAt={expiresAt} />}

      {/* Resumo de valores */}
      <div className="mt-5 space-y-2 pb-4 border-b border-gray-100">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>Desconto ({appliedCoupon.code})</span>
            <span>- {formatCurrency(appliedCoupon.discount_amount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-gray-600">
          <span>Taxa de serviço</span>
          <div className="flex items-center gap-2">
            <span className="bg-green-100 text-green-700 text-xs rounded-full px-2 font-medium">Grátis</span>
            <span>{formatCurrency(0)}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center py-4">
        <span className="font-bold text-gray-900 text-base">Total a pagar</span>
        <span className="text-3xl font-bold text-gray-900">{formatCurrency(currentTotal)}</span>
      </div>

      {/* Input de cupom */}
      <div className="mb-5">
        <CouponInput
          orderId={orderId}
          eventId={eventId}
          subtotal={subtotal}
          appliedCoupon={appliedCoupon}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
        />
      </div>

      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
        totalAmount={currentTotal}
      />

      {paymentMethod === 'pix' ? (
        <PixButton
          orderId={orderId}
          totalAmount={currentTotal}
          isLoading={isGeneratingPix}
          onClick={handlePixPayment}
        />
      ) : (
        <PaymentButton orderId={orderId} totalAmount={currentTotal} />
      )}

      {paymentMethod === 'card' && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          <span>Pagamento seguro via Stripe</span>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
        <form action={cancelOrderAction}>
          <button type="submit" className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Cancelar pedido
          </button>
        </form>
      </div>
    </div>
  )
}
