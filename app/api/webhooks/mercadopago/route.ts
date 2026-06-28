import { mpPayment } from '@/lib/mercadopago'
import { createClient } from '@supabase/supabase-js'
import { isValidMPWebhook } from '@/lib/mercadopago'
import { sendOrderAndTicketsEmails } from '@/lib/email'
import { sendOrderConfirmedPush } from '@/lib/push-notifications'
import * as Sentry from '@sentry/nextjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const rawBody = await request.text()
  let body: Record<string, unknown>
  
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  let paymentId: string | null = null
  
  if (body.type === 'payment') {
    paymentId = String((body.data as any)?.id ?? '')
    
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (secret) {
      const xSig = request.headers.get('x-signature')
      const xReqId = request.headers.get('x-request-id')
      if (xSig && xReqId && paymentId) {
        const isValid = isValidMPWebhook(xSig, xReqId, paymentId, secret)
        if (!isValid) {
          Sentry.captureEvent({
            level: 'warning',
            message: '[Security] invalid_webhook',
            tags: { security: 'true', type: 'invalid_webhook' },
            extra: { paymentId, body }
          })
          return new Response('Unauthorized', { status: 401 })
        }
      }
    }
  } else if (body.topic === 'payment') {
    paymentId = String(body.id ?? '')
  }
  
  if (!paymentId) {
    return new Response(null, { status: 200 })
  }

  let paymentDetails: any
  
  try {
    paymentDetails = await mpPayment.get({
      id: Number(paymentId)
    })
  } catch (mpError) {
    Sentry.captureException(mpError, {
      tags: { webhook: 'mp', step: 'fetch_payment' },
      extra: { paymentId }
    })
    return new Response(null, { status: 200 })
  }

  const status = paymentDetails.status
  const orderId = paymentDetails.external_reference
  
  if (!orderId) {
    console.warn('[MP Webhook] No external_reference', { paymentId })
    return new Response(null, { status: 200 })
  }
  
  console.log('[MP Webhook]', {
    paymentId,
    orderId,
    status,
    statusDetail: paymentDetails.status_detail,
  })

  if (status === 'approved') {
    const { data: confirmResult, error: confirmError } = 
      await supabase.rpc('confirm_order_payment', {
        p_order_id: orderId,
        p_payment_method: 
          paymentDetails.payment_type_id === 'bank_transfer'
          ? 'pix' : 'card',
        p_mp_payment_id: paymentId,
        p_mp_installments: 
          paymentDetails.installments ?? 1,
        p_mp_installment_amount:
          paymentDetails.transaction_details?.installment_amount ?? null,
        p_mp_card_last_four:
          paymentDetails.card?.last_four_digits ?? null,
        p_mp_card_brand:
          paymentDetails.payment_method_id ?? null,
      })
    
    if (confirmError) {
      Sentry.captureException(confirmError, {
        tags: { 
          webhook: 'mp', 
          step: 'confirm_order',
          critical: 'true'
        },
        extra: { orderId, paymentId }
      })
      return new Response(null, { status: 200 })
    }
    
    if (confirmResult.reason === 'already_processed') {
      console.log('[MP Webhook] Already processed:', orderId)
      return new Response(null, { status: 200 })
    }
    
    if (confirmResult.tickets_created > 0) {
      try {
        await sendOrderAndTicketsEmails(orderId)
      } catch (emailError) {
        Sentry.captureException(emailError, {
          tags: { webhook: 'mp', step: 'email' }
        })
      }
      
      try {
        await sendOrderConfirmedPush(
          confirmResult.buyer_id,
          paymentDetails.description ?? 'seu evento',
          orderId
        )
      } catch (pushError) {
        console.error('[MP Webhook] Push error:', pushError)
      }
    }
    
    console.log('[MP Webhook] Order confirmed:', {
      orderId,
      ticketsCreated: confirmResult.tickets_created,
    })
  } else if (status === 'rejected') {
    await supabase
      .from('orders')
      .update({ mp_status_detail: paymentDetails.status_detail })
      .eq('id', orderId)
      .eq('status', 'pending')
    
    console.log('[MP Webhook] Payment rejected:', {
      orderId, statusDetail: paymentDetails.status_detail
    })
  } else if (status === 'cancelled') {
    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()
    
    if (order?.status === 'pending') {
      await supabase.rpc('release_tickets', { p_order_id: orderId })
      
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('status', 'pending')
    }
  }

  return new Response(null, { status: 200 })
}
