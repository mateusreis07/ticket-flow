import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateCoupon, applyCouponToOrder } from '@/lib/coupons'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(1).max(50),
  orderId: z.string().uuid(),
  eventId: z.string().uuid(),
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
      return NextResponse.json({ success: false, error: 'Dados inválidos.' })
    }

    const { code, orderId, eventId } = result.data

    // Verificar ownership do pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, subtotal_amount, total_amount, status')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado.' })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Este pedido não pode ser modificado.' })
    }

    // Buscar itens do pedido
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('ticket_type_id, quantity')
      .eq('order_id', orderId)

    const items = (orderItems ?? []).map((i: any) => ({
      ticketTypeId: i.ticket_type_id,
      quantity: i.quantity,
    }))

    const orderSubtotal = order.subtotal_amount ?? order.total_amount

    // Validar o cupom
    const validation = await validateCoupon({
      code,
      userId: user.id,
      eventId,
      orderSubtotal,
      items,
    })

    if (!validation.valid || !validation.coupon) {
      return NextResponse.json({ success: false, error: validation.error })
    }

    // Aplicar o cupom ao pedido
    const applyResult = await applyCouponToOrder({
      couponId: validation.coupon.id,
      orderId,
      userId: user.id,
      discountAmount: validation.discount_amount!,
    })

    if (!applyResult.success) {
      return NextResponse.json({ success: false, error: applyResult.error })
    }

    return NextResponse.json({
      success: true,
      discount_amount: validation.discount_amount,
      new_total: validation.new_total,
    })
  } catch (err: any) {
    console.error('Apply coupon error:', err)
    return NextResponse.json({ success: false, error: 'Erro interno ao aplicar cupom.' })
  }
}
