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
                {initialCoupon && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Desconto ({initialCoupon.code})</span>
                    <span>- {formatCurrency(initialCoupon.discount_amount)}</span>
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
                  <span className="font-bold text-primary text-xl">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Dados do comprador */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Seus dados</h2>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold text-sm uppercase">
                    {profile?.name?.substring(0, 2) || user.email?.substring(0, 2) || 'US'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile?.name || 'Comprador'}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-3 items-start">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 leading-relaxed">
                  Os ingressos serão enviados para este e-mail após a confirmação do pagamento.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar — componente client com cupom + pagamento */}
          <div className="md:col-span-2">
            <CheckoutClient
              orderId={order.id}
              eventId={event.id}
              subtotal={subtotal}
              expiresAt={order.expires_at}
              initialCoupon={initialCoupon}
              cancelOrderAction={handleCancelOrder}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
