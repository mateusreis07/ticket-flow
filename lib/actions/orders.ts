'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Não autorizado')

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single()

  if (error || !order) {
    throw new Error('Pedido não encontrado ou não pertence a você')
  }

  if (order.status === 'paid') {
    return { error: 'Pedido já pago não pode ser cancelado aqui.' }
  }

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

  await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  revalidatePath('/checkout/' + orderId)
  redirect('/checkout/cancelado')
}

export async function cancelExpiredOrder(orderId: string) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new Error('Pedido não encontrado')
  }

  if (order.status === 'paid' || order.status === 'cancelled') {
    return { error: 'Apenas pedidos pendentes podem ser expirados' }
  }

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

  await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
}
