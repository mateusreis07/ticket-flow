import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'organizer') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const { eventId, deviceInfo } = body

    if (!eventId) {
      return NextResponse.json({ error: 'eventId é obrigatório' }, { status: 400 })
    }

    // Verificar se evento é do organizador
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_id', user.id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado ou não pertence a você' }, { status: 404 })
    }

    // Encerrar sessões ativas anteriores
    await supabaseAdmin
      .from('checkin_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('organizer_id', user.id)
      .eq('is_active', true)

    // Criar nova sessão
    const { data: session, error } = await supabaseAdmin
      .from('checkin_sessions')
      .insert({
        event_id: eventId,
        organizer_id: user.id,
        device_info: deviceInfo || 'Unknown Device',
        is_active: true
      })
      .select()
      .single()

    if (error || !session) {
      throw error || new Error('Falha ao criar sessão')
    }

    return NextResponse.json({ sessionId: session.id, session })

  } catch (error: any) {
    console.error('Check-in Session error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId é obrigatório' }, { status: 400 })
    }

    await supabaseAdmin
      .from('checkin_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('organizer_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Check-in Session Close error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
