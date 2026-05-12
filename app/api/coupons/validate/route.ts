import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateCoupon } from '@/lib/coupons'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(1).max(50),
  eventId: z.string().uuid(),
  orderId: z.string().uuid(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ valid: false, error: 'Dados inválidos.' })
    }

    const { code, eventId, orderId } = result.data

    // Buscar pedido verificando ownership e status
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, subtotal_amount, total_amount, status')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ valid: false, error: 'Pedido não encontrado.' })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ valid: false, error: 'Este pedido não pode ser modificado.' })
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

    const validationResult = await validateCoupon({
      code,
      userId: user.id,
      eventId,
      orderSubtotal,
      items,
    })

    return NextResponse.json(validationResult)
  } catch (err: any) {
    console.error('Validate coupon error:', err)
    return NextResponse.json({ valid: false, error: 'Erro interno ao validar cupom.' })
  }
}
