import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CheckinResult } from '@/types'
import { sendCheckinMilestonePush } from '@/lib/push-notifications'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const identifier = getIdentifier(req)
  const rlResult = await checkRateLimit('scanner', identifier)
  if (!rlResult.success) {
    return rateLimitResponse(rlResult)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { ticketId, qrCode, sessionId, eventId, method, operatorNote } = body

    if ((!ticketId && !qrCode) || !sessionId || !eventId || !method) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // 1. Validar ticket e evento
    let query = supabaseAdmin.from('tickets').select('*, events!inner(organizer_id, title)')
    
    if (ticketId) query = query.eq('id', ticketId)
    else query = query.eq('qr_code', qrCode)

    const { data: ticket, error: ticketError } = await query.single()

    let result: CheckinResult = 'not_found'
    let buyerData = null

    if (!ticket) {
      // Registrar falha (not_found)
      await supabaseAdmin.from('checkin_logs').insert({
        session_id: sessionId,
        qr_code: qrCode,
        result: 'not_found',
        operator_note: operatorNote
      })
      return NextResponse.json({ result: 'not_found', message: 'Ingresso não encontrado' })
    }

    if (ticket.events.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Você não tem permissão para este evento' }, { status: 403 })
    }

    if (ticket.event_id !== eventId) {
      result = 'wrong_event'
    } else if (ticket.is_used && method !== 'manual_override') {
      result = 'already_used'
    } else {
      result = method === 'manual_override' ? 'manual_override' : 'success'
    }

    // Buscar dados do comprador para o log
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', ticket.buyer_id)
      .single()
      
    buyerData = profile

    // Registrar log
    await supabaseAdmin.from('checkin_logs').insert({
      session_id: sessionId,
      ticket_id: ticket.id,
      qr_code: ticket.qr_code,
      buyer_name: profile?.name,
      result,
      operator_note: operatorNote
    })

    // Se válido, atualizar o ticket
    if (result === 'success' || result === 'manual_override') {
      const { error: updateError } = await supabaseAdmin.from('tickets').update({
        is_used: true,
        used_at: new Date().toISOString(),
        checked_in_by: user.id,
        checkin_session_id: sessionId,
        checkin_method: method
      }).eq('id', ticket.id)

      if (updateError) {
        console.error("Falha ao atualizar o ticket no validate:", updateError)
        return NextResponse.json({ error: 'Erro ao validar ingresso no banco de dados' }, { status: 500 })
      }

      // Atualizar total da sessão
      const { data: currSess } = await supabaseAdmin.from('checkin_sessions').select('total_checkins').eq('id', sessionId).single()
      if (currSess) {
          await supabaseAdmin.from('checkin_sessions').update({ total_checkins: currSess.total_checkins + 1 }).eq('id', sessionId)
      }
      
      // Checar marcos para push
      const { data: stats } = await supabaseAdmin
        .from('checkin_overview')
        .select('checked_in_count, total_tickets')
        .eq('event_id', eventId)
        .single()
        
      if (stats) {
        // Enviar push via helper
        await sendCheckinMilestonePush(user.id, ticket.events.title, stats.checked_in_count, stats.total_tickets, eventId)
      }
    }

    const messages = {
      success: 'Check-in realizado com sucesso!',
      already_used: 'Ingresso já utilizado!',
      wrong_event: 'Ingresso de outro evento!',
      manual_override: 'Check-in forçado com sucesso!',
      not_found: 'Ingresso não encontrado!'
    }

    return NextResponse.json({
      result,
      ticket: { ...ticket, buyer_name: profile?.name },
      message: messages[result]
    })

  } catch (error: any) {
    console.error('Checkin validation error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
