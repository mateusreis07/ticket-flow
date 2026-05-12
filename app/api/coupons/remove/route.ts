import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { removeCouponFromOrder } from '@/lib/coupons'
import { z } from 'zod'

const schema = z.object({
  orderId: z.string().uuid(),
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

    const { orderId } = result.data

    // Verificar ownership e status do pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado.' })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Este pedido não pode ser modificado.' })
    }

    await removeCouponFromOrder(orderId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Remove coupon error:', err)
    return NextResponse.json({ success: false, error: 'Erro interno ao remover cupom.' })
  }
}
