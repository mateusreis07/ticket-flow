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

    // 1. Validar a sessão e permissão
    const { data: session } = await supabaseAdmin
      .from('checkin_sessions')
      .select('event_id, organizer_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 403 })
    }

    // 2. Chamar o RPC de processamento em lote
    // O RPC cuida da idempotência, logs e updates de ticket em uma única transação
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_bulk_checkins', {
      p_session_id: sessionId,
      p_organizer_id: user.id,
      checkin_data: actions
    })

    if (rpcError) {
      console.error('RPC bulk checkin error:', rpcError)
      throw rpcError
    }

    const { success_count: synced, error_count: failed } = rpcResult

    // 3. Checar marcos após sincronização em lote (Opcional: Pode ser feito em background)
    const { data: stats } = await supabaseAdmin
      .from('checkin_overview')
      .select('checked_in_count, total_tickets, event_title')
      .eq('event_id', session.event_id)
      .single()
      
    if (stats) {
      await sendCheckinMilestonePush(user.id, stats.event_title, stats.checked_in_count, stats.total_tickets, session.event_id)
    }

    return NextResponse.json({ 
      synced, 
      failed, 
      message: `Sincronização concluída: ${synced} sucessos, ${failed} falhas.` 
    })

  } catch (error: any) {
    console.error('Checkin sync error:', error)
    return NextResponse.json({ error: 'Erro interno na sincronização' }, { status: 500 })
  }
}
