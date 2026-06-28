import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const schema = z.object({
  eventId: z.string().uuid(),
  items: z.array(z.object({
    ticketTypeId: z.string().uuid(),
    quantity: z.number().int().min(1).max(10)
  })).min(1).max(10)
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const identifier = getIdentifier(req)
    const rlResult = await checkRateLimit('order', user.id + ':' + identifier)
    if (!rlResult.success) {
      return rateLimitResponse(rlResult)
    }

    const body = await req.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { eventId, items } = result.data

    // Check existing pending order to avoid duplicates
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ orderId: existing.id }, { 
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(rlResult.limit),
          'X-RateLimit-Remaining': String(rlResult.remaining),
        }
      })
    }

    // Call atomic RPC
    // Use service role for RPC to bypass RLS since we validate user here
    // But since the RPC runs as SECURITY DEFINER, we can just use the normal client if granted correctly
    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_buyer_id: user.id,
      p_event_id: eventId,
      p_items: items.map(i => ({
        ticket_type_id: i.ticketTypeId,
        quantity: i.quantity
      })),
      p_expires_minutes: 30
    })

    if (error) {
      if (error.message.includes('INSUFFICIENT_STOCK')) {
        return NextResponse.json({ error: 'Ingressos insuficientes.' }, { status: 409 })
      }
      if (error.message.includes('TICKET_UNAVAILABLE')) {
        return NextResponse.json({ error: 'Ingresso não disponível.' }, { status: 409 })
      }
      Sentry.captureException(error, { tags: { route: 'create_order' } })
      return NextResponse.json({ error: 'Falha ao criar pedido' }, { status: 500 })
    }

    return NextResponse.json({ 
      orderId: data.order_id,
      totalAmount: data.total_amount
    }, { 
      status: 201,
      headers: {
        'X-RateLimit-Limit': String(rlResult.limit),
        'X-RateLimit-Remaining': String(rlResult.remaining),
      }
    })

  } catch (error: any) {
    Sentry.captureException(error, { tags: { route: 'create_order' } })
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
