import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { createCardPayment } from '@/lib/mercadopago'

const schema = z.object({
  orderId: z.string().uuid(),
  token: z.string().min(1),
  installments: z.number().int().min(1).max(12),
  paymentMethodId: z.string().min(1),
  issuerId: z.string().optional(),
  cpf: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }

    const { orderId, token, installments, paymentMethodId, issuerId, cpf } = result.data

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        events (title),
        profiles (email, name)
      `)
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado ou já processado' }, { status: 404 })
    }

    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Pedido expirado' }, { status: 400 })
    }

    if (order.total_amount === 0) {
      return NextResponse.json({ success: true, free: true, orderId })
    }

    const eventTitle = Array.isArray(order.events) ? order.events[0]?.title : order.events?.title
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles

    await supabaseAdmin
      .from('payment_attempts')
      .insert({
        order_id: orderId,
        payment_method: 'card',
        amount: order.total_amount,
        installments,
        status: 'processing'
      })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`

    const payment = await createCardPayment({
      orderId,
      amount: order.total_amount,
      token,
      installments,
      paymentMethodId,
      issuerId,
      payerEmail: profile?.email || user.email || '',
      payerName: profile?.name || '',
      description: `Ingresso - ${eventTitle}`,
      notificationUrl
    })

    if (payment.status === 'approved') {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          payment_method: 'card',
          mp_payment_id: payment.id?.toString(),
          mp_installments: installments,
          mp_installment_amount: payment.transaction_details?.installment_amount,
          mp_card_last_four: payment.card?.last_four_digits,
          mp_card_brand: payment.payment_method_id,
          mp_status_detail: payment.status_detail
        })
        .eq('id', orderId)

      await supabaseAdmin
        .from('payment_attempts')
        .update({ status: 'approved' })
        .eq('order_id', orderId)
        .eq('status', 'processing')

      // A criação dos tickets e envio de e-mails/push serão feitos pelo webhook do MP também se necessário, 
      // ou podem ser despachados aqui. Como a especificação diz para fazer no webhook (que recebe approved), 
      // delegaremos a finalização para o webhook, apenas respondendo success.

      return NextResponse.json({ success: true, orderId, installments })
    }

    if (payment.status === 'in_process' || payment.status === 'pending') {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'pending',
          mp_payment_id: payment.id?.toString(),
          mp_status_detail: payment.status_detail
        })
        .eq('id', orderId)

      await supabaseAdmin
        .from('payment_attempts')
        .update({ status: payment.status })
        .eq('order_id', orderId)
        .eq('status', 'processing')

      return NextResponse.json({
        success: false,
        pending: true,
        message: 'Pagamento em análise. Você receberá uma confirmação por e-mail em breve.',
        orderId
      })
    }

    if (payment.status === 'rejected') {
      await supabaseAdmin
        .from('payment_attempts')
        .update({ status: 'rejected', error_message: payment.status_detail })
        .eq('order_id', orderId)
        .eq('status', 'processing')

      const errorMessages: Record<string, string> = {
        'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão.',
        'cc_rejected_bad_filled_card_number': 'Número do cartão incorreto.',
        'cc_rejected_bad_filled_date': 'Data de validade incorreta.',
        'cc_rejected_bad_filled_security_code': 'Código de segurança incorreto.',
        'cc_rejected_bad_filled_other': 'Dados do cartão incorretos.',
        'cc_rejected_blacklist': 'Cartão não autorizado pelo banco.',
        'cc_rejected_call_for_authorize': 'Ligue para o banco para autorizar.',
        'cc_rejected_card_disabled': 'Cartão desativado. Contate seu banco.',
        'cc_rejected_duplicated_payment': 'Pagamento duplicado detectado.',
        'cc_rejected_high_risk': 'Pagamento recusado por segurança.',
        'cc_rejected_max_attempts': 'Limite de tentativas atingido.',
      }

      const userMessage = errorMessages[payment.status_detail ?? ''] ?? 'Pagamento recusado. Tente outro cartão.'

      return NextResponse.json({
        success: false,
        error: userMessage,
        statusDetail: payment.status_detail
      }, { status: 422 })
    }

    return NextResponse.json({ success: false, error: 'Status desconhecido.' }, { status: 400 })
  } catch (error: any) {
    console.error('Erro ao processar pagamento com cartão:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar pagamento. Tente novamente.'
    }, { status: 500 })
  }
}
