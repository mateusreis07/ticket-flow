import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Necessário para que o Stripe possa verificar a assinatura do webhook
// O body precisa ser lido como texto raw, não parseado pelo Next.js
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Webhook: Stripe-Signature header ausente')
    return new Response('Webhook Error: Signature ausente', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleSessionExpired(event.data.object as Stripe.Checkout.Session)
        break

      default:
        // Ignorar silenciosamente outros eventos
        break
    }
  } catch (error: any) {
    console.error(`Erro ao processar webhook ${event.type}:`, error)
    // Retornar 500 faz o Stripe retentar — retornamos 200 para eventos que não conseguimos processar
    // para evitar loops de retry em casos irrecuperáveis
    return new Response('Internal Server Error', { status: 500 })
  }

  return new Response(null, { status: 200 })
}

// ─── Handler: Pagamento confirmado ───────────────────────────────────────────

async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId
  const userId = session.metadata?.userId

  if (!orderId) {
    console.warn('Webhook checkout.session.completed: orderId ausente nos metadados')
    return
  }

  // 1. Idempotência Avançada: verificar se o pedido já foi processado
  const { data: order, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    throw new Error(`Pedido ${orderId} não encontrado no banco`)
  }

  // Se já estiver pago, vamos verificar se os ingressos já existem
  if (order.status === 'paid') {
    const { count } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)

    if (count && count > 0) {
      console.log(`[Webhook] Pedido ${orderId} já processado com ingressos — ignorando`)
      return
    }
    console.log(`[Webhook] Pedido ${orderId} está 'paid' mas não tem ingressos. Gerando agora...`)
  } else {
    // 2. Atualizar o status do pedido para 'paid' de forma atômica
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string ?? null,
      })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select()
      .single()

    if (updateError || !updatedOrder) {
      // Se falhou o update, pode ser que outra requisição acabou de atualizar. 
      // Vamos deixar a próxima execução (ou o retry do Stripe) cuidar disso.
      throw new Error(`Erro ao atualizar status do pedido ${orderId} para 'paid'`)
    }
  }

  // 3. Buscar os itens do pedido
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select(`
      *,
      ticket_types ( event_id )
    `)
    .eq('order_id', orderId)

  if (itemsError || !items || items.length === 0) {
    throw new Error(`Itens do pedido ${orderId} não encontrados`)
  }

  // 4. Gerar um ticket por unidade comprada
  const ticketsToInsert: any[] = []

  for (const item of items) {
    const eventId = (item.ticket_types as any)?.event_id

    for (let i = 0; i < item.quantity; i++) {
      ticketsToInsert.push({
        order_id: orderId,
        ticket_type_id: item.ticket_type_id,
        event_id: eventId,
        buyer_id: userId,
        qr_code: crypto.randomUUID(),
        is_used: false,
      })
    }
  }

  const { error: ticketsError } = await supabaseAdmin
    .from('tickets')
    .insert(ticketsToInsert)

  if (ticketsError) throw ticketsError

  console.log(
    `✅ Pedido ${orderId} processado | ${ticketsToInsert.length} ingresso(s) gerado(s)`
  )

  // 4. Enviar e-mails de confirmação e ingressos
  try {
    const { sendOrderAndTicketsEmails } = await import('@/lib/email')
    await sendOrderAndTicketsEmails(orderId)
    console.log(`✉️ E-mails enviados para pedido: ${orderId}`)
  } catch (emailError: unknown) {
    const err = emailError as Error
    console.error(`❌ Erro ao enviar e-mails para o pedido ${orderId}:`, err.message)
  }

  // 5. Enviar push notification de confirmação (não bloqueia o webhook)
  if (userId) {
    try {
      const { sendOrderConfirmedPush } = await import('@/lib/push-notifications')
      // Buscar título do evento via primeiro item do pedido
      const { data: firstItem } = await supabaseAdmin
        .from('order_items')
        .select('ticket_types(events(title))')
        .eq('order_id', orderId)
        .limit(1)
        .single()

      const eventTitle = (firstItem?.ticket_types as unknown as { events?: { title: string } })?.events?.title ?? 'seu evento'
      await sendOrderConfirmedPush(userId, eventTitle, orderId)
      console.log(`🔔 Push notification enviada para pedido: ${orderId}`)
    } catch (pushError: unknown) {
      const err = pushError as Error
      console.error(`❌ Erro ao enviar push para o pedido ${orderId}:`, err.message)
      // Nunca bloquear o webhook por causa do push
    }
  }
}

// ─── Handler: Sessão expirada no Stripe ──────────────────────────────────────

async function handleSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId

  if (!orderId) {
    console.warn('Webhook checkout.session.expired: orderId ausente nos metadados')
    return
  }

  // Idempotência: verificar se o pedido ainda está pendente
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status, coupon_id')
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'pending') {
    console.log(`Pedido ${orderId} não está mais pendente — ignorando`)
    return
  }

  // Se tinha cupom aplicado, reverter o used_count
  if (order.coupon_id) {
    const { removeCouponFromOrder } = await import('@/lib/coupons')
    await removeCouponFromOrder(orderId)
  }

  // Buscar itens para devolver ingressos ao estoque
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (items) {
    for (const item of items) {
      const { data: tt } = await supabaseAdmin
        .from('ticket_types')
        .select('quantity_sold')
        .eq('id', item.ticket_type_id)
        .single()

      if (tt) {
        await supabaseAdmin
          .from('ticket_types')
          .update({ quantity_sold: Math.max(0, tt.quantity_sold - item.quantity) })
          .eq('id', item.ticket_type_id)
      }
    }
  }

  // Cancelar o pedido
  await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  console.log(`🕐 Pedido ${orderId} expirado e cancelado pelo Stripe`)
}

