import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, Music, Info } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cancelExpiredOrder, cancelOrder } from '@/lib/actions/orders'
import CheckoutClient from '@/components/checkout/CheckoutClient'
import type { AppliedCoupon } from '@/types'

export default async function CheckoutPage({ params }: { params: { orderId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/checkout/' + params.orderId)
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      events (
        id,
        title,
        event_date,
        event_time,
        location,
        city,
        state,
        cover_image_url
      )
    `)
    .eq('id', params.orderId)
    .eq('buyer_id', user.id)
    .single()

  if (orderError || !order) notFound()

  if (order.status === 'paid') redirect('/checkout/sucesso?order=' + params.orderId)
  if (order.status === 'cancelled') redirect('/checkout/cancelado')

  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    await cancelExpiredOrder(order.id)
    redirect('/checkout/expirado')
  }

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      *,
      ticket_types (
        name,
        description
      )
    `)
    .eq('order_id', params.orderId)

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const event = Array.isArray(order.events) ? order.events[0] : order.events

  // Subtotal: usar subtotal_amount se existir, senão total_amount
  const subtotal = order.subtotal_amount ?? order.total_amount

  // Cupom já aplicado (se existir)
  const initialCoupon: AppliedCoupon | null = order.coupon_code
    ? {
        code: order.coupon_code,
        discount_amount: order.discount_amount ?? 0,
        new_total: order.total_amount,
      }
    : null

  const initialPixData = order.payment_method === 'pix' && order.pix_qr_code ? {
    mpPaymentId: order.mp_payment_id || '',
    qrCode: order.pix_qr_code,
    qrCodeBase64: order.pix_qr_code_base64 || '',
    copyPaste: order.pix_copy_paste || '',
    expiresAt: order.pix_expires_at || '',
  } : null

  // Server action para cancelar pedido
  async function handleCancelOrder() {
    'use server'
    await cancelOrder(params.orderId)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header — breadcrumb de progresso */}
        <div className="mb-8">
          <Link href={`/events/${event.id}`} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors inline-block mb-6">
            &larr; Voltar
          </Link>

          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 text-primary">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
              <span>Revisão</span>
            </div>
            <div className="h-px bg-gray-200 w-12" />
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">2</span>
              <span>Pagamento</span>
            </div>
            <div className="h-px bg-gray-200 w-12" />
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">3</span>
              <span>Confirmação</span>
            </div>
          </div>
        </div>

        <CheckoutClient
          orderId={order.id}
          eventId={event.id}
          subtotal={subtotal}
          originalTotal={order.total_amount}
          expiresAt={order.expires_at}
          initialCoupon={initialCoupon}
          initialPaymentMethod={order.payment_method}
          initialPixData={initialPixData}
          event={event}
          orderItems={orderItems}
          buyerName={profile?.name || 'Comprador'}
          buyerEmail={user.email || ''}
          cancelOrderAction={handleCancelOrder}
        />
      </div>
    </div>
  )
}
