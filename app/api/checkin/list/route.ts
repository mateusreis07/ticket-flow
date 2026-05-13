import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'eventId é obrigatório' }, { status: 400 })
    }

    // Check ownership
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_id', user.id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado ou acesso negado' }, { status: 403 })
    }

    // Busca de dados puros para o modo offline via Admin
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        qr_code,
        is_used,
        used_at,
        checkin_method,
        ticket_type_id,
        order_id,
        buyer_id,
        ticket_types!inner ( name ),
        orders!inner ( status )
      `)
      .eq('event_id', eventId)
      .eq('orders.status', 'paid')

    if (error) {
      throw error
    }

    // Manually join profiles because of admin rights and foreign keys
    // Optimization: get unique buyer_ids
    const buyerIds = [...new Set(tickets.map(t => t.buyer_id).filter(Boolean))]
    let profilesMap: Record<string, any> = {}
    
    if (buyerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .in('id', buyerIds)
        
      if (profiles) {
        profilesMap = profiles.reduce((acc, p) => ({...acc, [p.id]: p}), {})
      }
    }

    const list = tickets.map((t: any) => ({
      ticket_id: t.id,
      qr_code: t.qr_code,
      buyer_name: profilesMap[t.buyer_id]?.name || 'Usuário',
      buyer_email: profilesMap[t.buyer_id]?.email || '',
      ticket_type_name: t.ticket_types?.name || '',
      ticket_type_id: t.ticket_type_id,
      order_id: t.order_id,
      is_used: t.is_used,
      used_at: t.used_at,
      checkin_method: t.checkin_method
    })).sort((a, b) => a.buyer_name.localeCompare(b.buyer_name))

    const response = NextResponse.json(list)
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    
    return response

  } catch (error: any) {
    console.error('Checkin list error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
