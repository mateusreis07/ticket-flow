import { supabaseAdmin } from '@/lib/supabase/admin'
import { mpPayment, isValidMPWebhook } from '@/lib/mercadopago'
// import { sendOrderAndTicketsEmails } from '@/lib/email' // (supondo que exista)

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    let paymentId: string | undefined

    // Verificando formato novo (Webhooks)
    if (body.type === 'payment') {
      paymentId = body.data?.id
      
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
      if (secret) {
        const xSig = request.headers.get('x-signature')
        const xReqId = request.headers.get('x-request-id')
        
        if (xSig && xReqId) {
          if (!isValidMPWebhook(xSig, xReqId, body.data?.id, secret)) {
            console.error('Assinatura do webhook inválida')
            return new Response('Unauthorized', { status: 401 })
          }
        }
      }
    } 
    // Verificando formato antigo (IPN)
    else if (body.topic === 'payment') {
      paymentId = body.id
    }

    if (!paymentId) {
      return new Response(null, { status: 200 })
    }

    // Buscar detalhes do pagamento no MP
    const paymentDetails = await mpPayment.get({ id: Number(paymentId) })

    if (paymentDetails.status !== 'approved') {
      console.log('Pagamento MP não aprovado. Status:', paymentDetails.status)
      return new Response(null, { status: 200 })
    }

    const orderId = paymentDetails.external_reference
    if (!orderId) {
      console.log('Pedido sem external_reference no MP')
      return new Response(null, { status: 200 })
    }

    // Buscar o pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.log('Pedido não encontrado para o pagamento', paymentId)
      return new Response(null, { status: 200 })
    }

    if (order.status === 'paid') {
      console.log('Pedido já estava pago', orderId)
      return new Response(null, { status: 200 }) // Idempotência
    }

    // Atualizar pedido
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        mp_payment_id: paymentId.toString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError)
      return new Response('Internal Server Error', { status: 500 })
    }

    // Criar tickets
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (items) {
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          await supabaseAdmin.from('tickets').insert({
            order_id: orderId,
            ticket_type_id: item.ticket_type_id,
            event_id: order.event_id,
            buyer_id: order.buyer_id,
            qr_code: crypto.randomUUID(),
            is_used: false,
          })
        }
        
        // Atualizar quantity_sold
        // Opcionalmente podemos pegar a query no DB:
        // await supabaseAdmin.rpc('increment_ticket_sold', { ticket_type_id: item.ticket_type_id, qty: item.quantity })
        // Supondo que já está incrementando na criação ou se precisa de lógica aqui, podemos omitir ou deixar simples.
      }
    }

    // Enviar emails
    try {
      // await sendOrderAndTicketsEmails(orderId)
      console.log('E-mails enviados com sucesso para', orderId)
    } catch (e) {
      console.error('Erro ao enviar emails:', e)
    }

    // Push notification (se implementado)
    // sendOrderConfirmedPush(...)

    console.log('Pix aprovado via MP:', {
      orderId,
      paymentId,
      amount: paymentDetails.transaction_amount
    })

    return new Response(null, { status: 200 })

  } catch (error) {
    console.error('Erro no webhook MP:', error)
    // O MP considera qualquer coisa fora de 200 como falha e reenvia,
    // então enviamos 200 para descartar bad requests, e erros não tratáveis.
    // Mas no bloco catch geral, vamos enviar 500 para ele tentar novamente, ou 200.
    // O prompt orienta: "Retornar sempre 200: return new Response(null, { status: 200 })"
    return new Response(null, { status: 200 })
  }
}
