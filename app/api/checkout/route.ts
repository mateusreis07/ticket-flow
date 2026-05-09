import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { formatDate } from '@/lib/utils/format'

const schema = z.object({
  orderId: z.string().uuid(),
})

export async function POST(req: Request) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Parsear e validar o body
    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { orderId } = result.data

    // 3. Buscar o pedido e verificar ownership
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        events (
          id,
          title,
          event_date,
          location,
          city,
          cover_image_url
        )
      `)
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Este pedido não pode ser pago' }, { status: 400 })
    }

    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Este pedido expirou. Por favor, selecione os ingressos novamente.' },
        { status: 400 }
      )
    }

    const event = Array.isArray(order.events) ? order.events[0] : order.events

    // 4. Buscar itens do pedido com detalhes dos tickets
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        ticket_type_id,
        ticket_types ( name )
      `)
      .eq('order_id', orderId)

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json({ error: 'Itens do pedido não encontrados' }, { status: 404 })
    }

    // 5. Montar os line_items para o Stripe
    const lineItems = items.map((item: any) => {
      const ticketName = item.ticket_types?.name || 'Ingresso'
      const eventTitle = event?.title || 'Evento'
      const eventDate = event?.event_date ? formatDate(event.event_date, "dd 'de' MMMM 'de' yyyy") : ''
      const eventLocation = event ? `${event.location}, ${event.city}` : ''

      return {
        price_data: {
          currency: 'brl',
          unit_amount: formatAmountForStripe(item.unit_price),
          product_data: {
            name: `${ticketName} — ${eventTitle}`,
            description: `Evento: ${eventTitle} | ${eventDate} | ${eventLocation}`,
            ...(event?.cover_image_url ? { images: [event.cover_image_url] } : {}),
          },
        },
        quantity: item.quantity,
      }
    })

    // 6. Criar a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancelado?order=${orderId}`,
      customer_email: user.email,
      metadata: {
        orderId: orderId,
        userId: user.id,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutos
      locale: 'pt-BR',
      payment_intent_data: {
        metadata: {
          orderId: orderId,
        },
      },
    })

    // 7. Salvar o stripe_session_id no pedido
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId)

    // 8. Retornar a URL de redirect para o Stripe Checkout
    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Erro ao criar Stripe Checkout Session:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento. Tente novamente.' },
      { status: 500 }
    )
  }
}
