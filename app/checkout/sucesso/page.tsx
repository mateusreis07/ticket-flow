import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { CheckCircle2, Ticket, Mail, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import AutoRefresh from '@/components/checkout/AutoRefresh'

interface SucessoPageProps {
  searchParams: {
    session_id?: string
    order?: string
  }
}

export default async function SucessoPage({ searchParams }: SucessoPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let orderData: any = null
  let tickets: any[] = []

  if (user) {
    // Preferir busca por session_id (vindo diretamente do Stripe)
    if (searchParams.session_id) {
      const { data } = await supabaseAdmin
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
        .eq('stripe_session_id', searchParams.session_id)
        .eq('buyer_id', user.id)
        .single()

      orderData = data

    } else if (searchParams.order) {
      // Fallback: buscar por order id diretamente
      const { data } = await supabaseAdmin
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
        .eq('id', searchParams.order)
        .eq('buyer_id', user.id)
        .single()

      orderData = data
    }

    // Buscar tickets gerados se o pedido estiver pago
    if (orderData?.id && orderData.status === 'paid') {
      const { data: ticketData } = await supabaseAdmin
        .from('tickets')
        .select(`
          id,
          qr_code,
          ticket_types ( name )
        `)
        .eq('order_id', orderData.id)

      tickets = ticketData || []
    }
  }

  const event = orderData?.events
    ? (Array.isArray(orderData.events) ? orderData.events[0] : orderData.events)
    : null

  // Se o pedido ainda não está pago (webhook ainda não chegou)
  const isPending = orderData && orderData.status !== 'paid'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 max-w-md w-full text-center">

        {isPending ? (
          // Estado: processando pagamento
          <>
            <AutoRefresh isPending={isPending} />
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processando pagamento...</h1>
            <p className="text-gray-500">
              Aguarde alguns instantes enquanto confirmamos seu pagamento. Esta página atualizará automaticamente.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Se isso demorar mais de 1 minuto, verifique seu e-mail ou entre em contato com o suporte.
            </p>
          </>
        ) : (
          // Estado: pagamento confirmado
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento confirmado!</h1>
            <p className="text-gray-500">
              Seus ingressos foram enviados para{' '}
              <span className="font-medium text-gray-700">{user?.email}</span>.
            </p>

            {/* Detalhes do evento */}
            {event && (
              <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {formatDate(event.event_date, "dd 'de' MMMM 'de' yyyy")} &bull;{' '}
                  {event.location}, {event.city}
                </p>
              </div>
            )}

            {/* Valor pago */}
            {orderData && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Valor pago:</p>
                <p className="font-bold text-primary text-xl mt-0.5">
                  {formatCurrency(orderData.total_amount)}
                </p>
              </div>
            )}

            {/* Lista de ingressos */}
            {tickets.length > 0 && (
              <div className="mt-6 text-left space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Seus ingressos</h3>
                {tickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-gray-900 text-sm">
                        {ticket.ticket_types?.name || 'Ingresso'}
                      </span>
                    </div>
                    <span className="bg-primary-light text-primary text-[10px] font-semibold rounded-full px-2 py-1 whitespace-nowrap">
                      QR em Meus Ingressos
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Aviso de e-mail */}
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start text-left">
              <Mail className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 leading-relaxed">
                Você também receberá um e-mail com seus ingressos em breve. Verifique sua caixa de entrada.
              </p>
            </div>

            {/* Botões de ação */}
            <div className="mt-8 space-y-3">
              <Link
                href="/meus-ingressos"
                className="block bg-primary text-white w-full rounded-xl py-3 font-medium hover:bg-primary-hover transition-colors"
              >
                Ver meus ingressos
              </Link>
              <Link
                href="/"
                className="block border border-gray-200 text-gray-600 w-full rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
              >
                Voltar para eventos
              </Link>
            </div>

            {/* Número do pedido */}
            {orderData && (
              <p className="text-xs text-gray-400 mt-6">
                Pedido #{orderData.id.split('-')[0].toUpperCase()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
