'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/format'
import type { AppliedCoupon } from '@/types'
import CouponInput from '@/components/checkout/CouponInput'
import PaymentButton from '@/components/checkout/PaymentButton'
import CheckoutTimer from '@/components/checkout/CheckoutTimer'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface CheckoutClientProps {
  orderId: string
  eventId: string
  subtotal: number
  expiresAt: string | null
  initialCoupon: AppliedCoupon | null
  cancelOrderAction: () => Promise<void>
}

export default function CheckoutClient({
  orderId,
  eventId,
  subtotal,
  expiresAt,
  initialCoupon,
  cancelOrderAction,
}: CheckoutClientProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(initialCoupon)

  const currentTotal = appliedCoupon ? appliedCoupon.new_total : subtotal

  const handleCouponApplied = (result: AppliedCoupon) => {
    setAppliedCoupon(result)
  }

  const handleCouponRemoved = () => {
    setAppliedCoupon(null)
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

      <PaymentButton orderId={orderId} totalAmount={currentTotal} />

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
        <span>Pagamento seguro via Stripe</span>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <span className="bg-gray-100 text-gray-500 text-[10px] rounded px-2 py-1 font-medium uppercase tracking-wider">Visa</span>
        <span className="bg-gray-100 text-gray-500 text-[10px] rounded px-2 py-1 font-medium uppercase tracking-wider">Mastercard</span>
        <span className="bg-gray-100 text-gray-500 text-[10px] rounded px-2 py-1 font-medium uppercase tracking-wider">Pix</span>
      </div>

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
