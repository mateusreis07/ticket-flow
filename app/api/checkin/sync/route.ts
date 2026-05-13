import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { OfflineCheckinAction } from '@/types'
import { sendCheckinMilestonePush } from '@/lib/push-notifications'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId, actions } = body as { sessionId: string, actions: OfflineCheckinAction[] }

    if (!sessionId || !Array.isArray(actions)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { data: session } = await supabaseAdmin
      .from('checkin_sessions')
      .select('event_id, organizer_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 403 })
    }

    let synced = 0
    let failed = 0
    const details = []

    for (const action of actions) {
      try {
        // Idempotência: verificar se já existe o log desse ticket nessa sessão (apenas se ticketId existir)
        if (action.ticketId) {
            const { data: existingLog } = await supabaseAdmin
            .from('checkin_logs')
            .select('id')
            .eq('session_id', sessionId)
            .eq('ticket_id', action.ticketId)
            .single()

            if (existingLog) {
                // Já processado, apenas marcamos como sincronizado
                await supabaseAdmin.from('checkin_logs').update({ is_synced: true, synced_at: new Date().toISOString() }).eq('id', existingLog.id)
                synced++
                continue
            }
        }

        // Registrar log da ação offline
        const { data: log, error: logError } = await supabaseAdmin.from('checkin_logs').insert({
            session_id: sessionId,
            ticket_id: action.ticketId || null,
            qr_code: action.qrCode || null,
            buyer_name: action.buyerName || null,
            ticket_type_name: action.ticketTypeName || null,
            result: action.result,
            checked_in_at: action.timestamp,
            is_synced: true,
            synced_at: new Date().toISOString()
        }).select().single()

        if (logError) throw logError

        // Aplicar a alteração no ticket se foi sucesso
        if (action.result === 'success' || action.result === 'manual_override') {
            if (action.ticketId) {
                // Checar status atual
                const { data: ticket } = await supabaseAdmin.from('tickets').select('is_used').eq('id', action.ticketId).single()
                
                if (ticket && !ticket.is_used) {
                    const { error: updateError } = await supabaseAdmin.from('tickets').update({
                        is_used: true,
                        used_at: action.timestamp,
                        checked_in_by: user.id,
                        checkin_session_id: sessionId,
                        checkin_method: 'manual_list' // Assumindo lista manual do modo offline
                    }).eq('id', action.ticketId)

                    if (updateError) {
                        console.error("Falha ao atualizar o ticket no sync:", updateError)
                        throw updateError
                    }

                    // Incrementa na sessão (gambiarra sem RPC para simplificar)
                    const { data: currSess } = await supabaseAdmin.from('checkin_sessions').select('total_checkins').eq('id', sessionId).single()
                    if (currSess) {
                        await supabaseAdmin.from('checkin_sessions').update({ total_checkins: currSess.total_checkins + 1 }).eq('id', sessionId)
                    }
                }
            }
        }

        synced++
      } catch (err: any) {
        failed++
        details.push({ localId: action.localId, error: err.message })
      }
    }

    // Checar marcos após sincronização em lote
    const { data: stats } = await supabaseAdmin
      .from('checkin_overview')
      .select('checked_in_count, total_tickets, event_title')
      .eq('event_id', session.event_id)
      .single()
      
    if (stats) {
      await sendCheckinMilestonePush(user.id, stats.event_title, stats.checked_in_count, stats.total_tickets, session.event_id)
    }

    return NextResponse.json({ synced, failed, details })

  } catch (error: any) {
    console.error('Checkin sync error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
