import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  eventId: z.string().uuid(),
  items: z.array(z.object({
    ticketTypeId: z.string().uuid(),
    quantity: z.number().min(1).max(10)
  })).min(1)
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
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { eventId, items } = result.data

    let totalAmount = 0
    const orderItemsToInsert = []

    // 1. Verify availability and calculate total
    for (const item of items) {
      const { data: tt, error } = await supabase
        .from('ticket_types')
        .select('price, quantity_total, quantity_sold, name')
        .eq('id', item.ticketTypeId)
        .single()

      if (error || !tt) {
        return NextResponse.json({ error: `Ingresso ${item.ticketTypeId} inválido` }, { status: 400 })
      }

      const available = tt.quantity_total - (tt.quantity_sold || 0)
      if (item.quantity > available) {
        return NextResponse.json({ error: `Apenas ${available} ingressos '${tt.name}' disponíveis` }, { status: 400 })
      }

      totalAmount += tt.price * item.quantity
      orderItemsToInsert.push({
        ticket_type_id: item.ticketTypeId,
        quantity: item.quantity,
        unit_price: tt.price
      })
    }

    // 2. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        event_id: eventId,
        status: 'pending',
        total_amount: totalAmount,
        subtotal_amount: totalAmount,   // registrar o subtotal original
        discount_amount: 0,
        expires_at: new Date(Date.now() + 30 * 60000).toISOString() // 30 mins
      })
      .select('id')
      .single()

    if (orderError || !order) {
      throw new Error('Falha ao criar pedido')
    }

    // 3. Insert Order Items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert.map(item => ({
        ...item,
        order_id: order.id
      })))

    if (itemsError) throw itemsError

    // 4. Update quantities
    for (const item of items) {
      const { data: curr } = await supabase.from('ticket_types').select('quantity_sold').eq('id', item.ticketTypeId).single()
      await supabase
        .from('ticket_types')
        .update({ quantity_sold: (curr?.quantity_sold || 0) + item.quantity })
        .eq('id', item.ticketTypeId)
    }

    return NextResponse.json({ orderId: order.id }, { status: 201 })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
