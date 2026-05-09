import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, Music, Info, ShieldCheck } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import CheckoutTimer from '@/components/checkout/CheckoutTimer'
import PaymentButton from '@/components/checkout/PaymentButton'
import { cancelExpiredOrder } from '@/lib/actions/orders'

export default async function CheckoutPage({ params }: { params: { orderId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/checkout/' + params.orderId)
  }

  // 1. Fetch order and event details
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

  // Check expiration
  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    await cancelExpiredOrder(order.id)
    redirect('/checkout/expirado')
  }

  // 2. Fetch order items and ticket details
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

  // 3. Fetch buyer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const event = Array.isArray(order.events) ? order.events[0] : order.events

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-10">
        
        {/* Header */}
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
          {/* Main Column */}
          <div className="md:col-span-3 space-y-4">
            
            {/* Order Summary Card */}
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

              <div className="border-t border-gray-200 mt-5 pt-5 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
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

            {/* Buyer Info Card */}
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

          {/* Sidebar */}
          <div className="md:col-span-2">
            <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-5">Finalizar compra</h2>
              
              {order.expires_at && (
                <CheckoutTimer expiresAt={order.expires_at} />
              )}

              <div className="mt-5">
                <p className="text-gray-500 text-sm">Total a pagar</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(order.total_amount)}</p>
              </div>

              <PaymentButton orderId={order.id} totalAmount={order.total_amount} />

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
                <form action={async () => {
                  'use server'
                  const { cancelOrder } = await import('@/lib/actions/orders')
                  await cancelOrder(order.id)
                }}>
                  <button type="submit" className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                    Cancelar pedido
                  </button>
                </form>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
