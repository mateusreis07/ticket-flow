'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { AppliedCoupon, PaymentMethod, PixPaymentData } from '@/types'
import CouponInput from '@/components/checkout/CouponInput'
import { CardForm } from '@/components/checkout/CardForm'
import CheckoutTimer from '@/components/checkout/CheckoutTimer'
import { AlertCircle, CalendarDays, Info, MapPin, Music } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector'
import { PixPaymentDisplay } from '@/components/checkout/PixPaymentDisplay'
import { PixButton } from '@/components/checkout/PixButton'
import Image from 'next/image'

interface CheckoutClientProps {
  orderId: string
  eventId: string
  subtotal: number
  originalTotal: number
  expiresAt: string | null
  initialCoupon: AppliedCoupon | null
  initialPaymentMethod?: PaymentMethod
  initialPixData?: PixPaymentData | null
  event: {
    id: string
    title: string
    event_date: string
    location: string
    city: string
    state: string
    cover_image_url: string | null
  }
  orderItems: any[]
  buyerName: string
  buyerEmail: string
  cancelOrderAction: () => Promise<void>
}

export default function CheckoutClient({
  orderId,
  eventId,
  subtotal,
  originalTotal,
  expiresAt,
  initialCoupon,
  initialPaymentMethod = 'pix',
  initialPixData = null,
  event,
  orderItems,
  buyerName,
  buyerEmail,
  cancelOrderAction,
}: CheckoutClientProps) {
  const router = useRouter()
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(initialCoupon)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialPaymentMethod)
  const [pixData, setPixData] = useState<PixPaymentData | null>(initialPixData)
  const [showPixDisplay, setShowPixDisplay] = useState(!!initialPixData)
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  const currentTotal = appliedCoupon ? appliedCoupon.new_total : originalTotal

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
      <div className="grid md:grid-cols-5 gap-8 mt-8">
        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <PixPaymentDisplay
              pixData={pixData}
              orderId={orderId}
              totalAmount={currentTotal}
              onPaymentConfirmed={handlePaymentConfirmed}
              onCancel={() => setShowPixDisplay(false)}
            />
          </div>
        </div>
        <div className="md:col-span-2">
           {/* Sidebar with timer/summary while paying with pix could go here if needed, but the original code isolated this. */}
        </div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-5 gap-8 mt-8">
      {/* Coluna principal */}
      <div className="md:col-span-3 space-y-4">
        {/* Resumo do pedido */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex gap-4 pb-5 border-b border-gray-100">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative bg-primary-light flex items-center justify-center">
              {event.cover_image_url ? (
                <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" />
              ) : (
                <Music className="h-8 w-8 text-primary opacity-50" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <CalendarDays className="h-4 w-4" />
                <span className="capitalize">{formatDate(event.event_date, "EEEE, dd 'de' MMMM 'de' yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{event.location} • {event.city}/{event.state}</span>
              </div>
            </div>
          </div>

          {/* Itens do pedido */}
          <div className="mt-5 space-y-4">
            {orderItems?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{item.ticket_types.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} ingresso(s) &times; {formatCurrency(item.unit_price)}</p>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(item.quantity * item.unit_price)}</p>
              </div>
            ))}
          </div>

          {/* Linha de subtotal + desconto + total (lado esquerdo) */}
          <div className="border-t border-gray-200 mt-5 pt-5 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Desconto ({appliedCoupon.code})</span>
                <span>- {formatCurrency(appliedCoupon.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Taxa de serviço</span>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-700 text-xs rounded-full px-2 font-medium">Grátis</span>
                <span>{formatCurrency(0)}</span>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-bold text-gray-900 text-lg">Total</span>
              <span className="font-bold text-primary text-xl">{formatCurrency(currentTotal)}</span>
            </div>
          </div>
        </div>

        {/* Dados do comprador */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Seus dados</h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
              <span className="text-primary font-semibold text-sm uppercase">
                {buyerName?.substring(0, 2) || buyerEmail?.substring(0, 2) || 'US'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{buyerName}</p>
              <p className="text-sm text-gray-500">{buyerEmail}</p>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-3 items-start">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 leading-relaxed">
              Os ingressos serão enviados para este e-mail após a confirmação do pagamento.
            </p>
          </div>
        </div>

        {/* Forma de Pagamento - Movido para a coluna principal */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-5">Forma de pagamento</h2>

          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onMethodChange={(method) => {
              setPaymentMethod(method)
              setCardError(null)
            }}
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
            <CardForm 
              orderId={orderId}
              totalAmount={currentTotal}
              onSuccess={(id) => router.push('/checkout/sucesso?order=' + id)}
              onError={(msg) => setCardError(msg)}
            />
          )}

          {cardError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3 flex items-start gap-2">
              <AlertCircle className="text-red-500 w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{cardError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — componente client com cupom + resumo final */}
      <div className="md:col-span-2">
        <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-5">Finalizar compra</h2>

          {expiresAt && <CheckoutTimer expiresAt={expiresAt} />}

          {/* Input de cupom */}
          <div className="mb-5 mt-4">
            <CouponInput
              orderId={orderId}
              eventId={eventId}
              subtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
            />
          </div>

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

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <form action={cancelOrderAction}>
              <button type="submit" className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                Cancelar pedido
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
