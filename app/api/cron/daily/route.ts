import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cancelExpiredOrder } from '@/lib/actions/orders'
import { sendEventReminderPush } from '@/lib/push-notifications'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Verificar autorização via CRON_SECRET
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const xCronSecret = request.headers.get('x-cron-secret')
    
    const isVercelCron = authHeader === `Bearer ${cronSecret}`
    const isManual = xCronSecret === cronSecret
    
    if (!isVercelCron && !isManual) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('[Cron Daily] Iniciando rotina diária...')

    // --- PARTE 1: EXPIRAÇÃO DE ORDENS ---
    const { data: expiredOrders, error: expireError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())

    if (expireError) throw expireError

    let cancelledCount = 0
    if (expiredOrders && expiredOrders.length > 0) {
      for (const order of expiredOrders) {
        try {
          await cancelExpiredOrder(order.id)
          cancelledCount++
        } catch (e) {
          console.error(`[Cron Daily] Erro ao cancelar pedido ${order.id}:`, e)
        }
      }
    }
    console.log(`[Cron Daily] ${cancelledCount} pedidos expirados processados.`)

    // --- PARTE 2: LEMBRETES DE EVENTOS (PUSH) ---
    // Buscar tickets de eventos que acontecem amanhã
    const { data: ticketsForTomorrow, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        buyer_id,
        events!inner (
          id,
          title,
          event_date,
          event_time,
          location,
          status
        )
      `)
      .eq('is_used', false)
      .eq('events.status', 'published')

    if (ticketError) throw ticketError

    // Filtrar apenas eventos de amanhã
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const tomorrowTickets = (ticketsForTomorrow || []).filter((t) => {
      const event = t.events as any
      return event?.event_date === tomorrowStr
    })

    let remindersSent = 0
    if (tomorrowTickets.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0]
      
      for (const ticket of tomorrowTickets) {
        const event = ticket.events as any

        // Verificar se já enviou lembrete hoje
        const { data: existingReminder } = await supabaseAdmin
          .from('push_notifications')
          .select('id')
          .eq('user_id', ticket.buyer_id)
          .eq('type', 'event_reminder')
          .gte('sent_at', `${todayStr}T00:00:00Z`)
          .like('body', `%${event.title.substring(0, 20)}%`)
          .limit(1)

        if (existingReminder && existingReminder.length > 0) continue

        try {
          await sendEventReminderPush(ticket.buyer_id, event.title, ticket.id)
          remindersSent++
        } catch (pushErr) {
          console.error(`[Cron Daily] Erro push para user ${ticket.buyer_id}:`, pushErr)
        }
      }
    }
    console.log(`[Cron Daily] ${remindersSent} lembretes de push enviados.`)

    return NextResponse.json({ 
      success: true, 
      orders_cancelled: cancelledCount,
      push_reminders_sent: remindersSent
    }, { status: 200 })

  } catch (error: any) {
    console.error('[Cron Daily] Erro fatal na rotina:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
