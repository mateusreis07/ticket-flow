import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mpPayment, isValidMPWebhook } from '@/lib/mercadopago'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    let body: any = {}
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      console.error('Erro ao fazer parse do body:', e)
      return NextResponse.json({ received: true })
    }

    let paymentId: string | undefined

    if (body.type === 'payment') {
      paymentId = body.data?.id
      
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
      if (secret) {
        const xSig = request.headers.get('x-signature')
        const xReqId = request.headers.get('x-request-id')
        
        if (xSig && xReqId) {
          if (!isValidMPWebhook(xSig, xReqId, body.data?.id, secret)) {
            console.error('Assinatura do webhook inválida')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }
        }
      }
    } else if (body.topic === 'payment') {
      paymentId = body.id
    }

    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    const paymentDetails = await mpPayment.get({ id: Number(paymentId) })
    const orderId = paymentDetails.external_reference

    if (!orderId) {
      console.log('Pedido sem external_reference no MP')
      return NextResponse.json({ received: true })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.log('Pedido não encontrado para o pagamento', paymentId)
      return NextResponse.json({ received: true })
    }

    // Tratar rejeição
    if (paymentDetails.status === 'rejected') {
      console.log('Pagamento rejeitado:', paymentDetails.status_detail)
      if (order.status === 'pending') {
        await supabaseAdmin
          .from('orders')
          .update({ mp_status_detail: paymentDetails.status_detail })
          .eq('id', orderId)
      }
      return NextResponse.json({ received: true })
    }

    // Tratar cancelamento
    if (paymentDetails.status === 'cancelled') {
      console.log('Pagamento cancelado:', paymentId)
      // Podemos chamar alguma função cancelExpiredOrder ou apenas atualizar o status
      if (order.status === 'pending') {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId)
      }
      return NextResponse.json({ received: true })
    }

    if (paymentDetails.status !== 'approved') {
      console.log('Pagamento MP não aprovado. Status:', paymentDetails.status)
      return NextResponse.json({ received: true })
    }

    if (order.status === 'paid') {
      console.log('Pedido já estava pago', orderId)
      return NextResponse.json({ received: true })
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        mp_payment_id: paymentId.toString(),
        mp_card_last_four: paymentDetails.card?.last_four_digits,
        mp_card_brand: paymentDetails.payment_method_id,
        mp_installments: paymentDetails.installments,
        mp_installment_amount: paymentDetails.transaction_details?.installment_amount,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError)
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    // Checar se tickets já foram gerados pela rota do cartão para evitar duplicatas
    const { count: existingTickets } = await supabaseAdmin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', orderId)

    if (items && (!existingTickets || existingTickets === 0)) {
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          await supabaseAdmin.from('tickets').insert({
            order_id: orderId,
            ticket_type_id: item.ticket_type_id,
            event_id: order.event_id,
            buyer_id: order.buyer_id,
            qr_code: randomUUID(),
            is_used: false,
          })
        }
      }
    }

    try {
      const { sendOrderAndTicketsEmails } = await import('@/lib/email')
      await sendOrderAndTicketsEmails(orderId)
      console.log(`✉️ E-mails enviados para pedido: ${orderId}`)
    } catch (e: any) {
      console.error('❌ Erro ao enviar emails:', e.message)
    }

    if (order.buyer_id) {
      try {
        const { sendOrderConfirmedPush } = await import('@/lib/push-notifications')
        const { data: firstItem } = await supabaseAdmin
          .from('order_items')
          .select('ticket_types(events(title))')
          .eq('order_id', orderId)
          .limit(1)
          .single()

        const eventTitle = (firstItem?.ticket_types as unknown as { events?: { title: string } })?.events?.title ?? 'seu evento'
        await sendOrderConfirmedPush(order.buyer_id, eventTitle, orderId)
        console.log(`🔔 Push notification enviada para pedido: ${orderId}`)
      } catch (pushError: any) {
        console.error(`❌ Erro ao enviar push para o pedido ${orderId}:`, pushError.message)
      }
    }

    console.log('Pagamento MP aprovado processado:', { orderId, paymentId })
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Erro no webhook MP:', error)
    return NextResponse.json({ received: true })
  }
}

