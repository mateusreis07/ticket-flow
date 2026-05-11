import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEventReminderPush } from '@/lib/push-notifications'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verificar autorização via CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Buscar tickets de eventos que acontecem amanhã
  const { data: ticketsForTomorrow, error } = await supabaseAdmin
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

  if (error) {
    console.error('[Reminders] Erro ao buscar tickets:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Filtrar apenas eventos de amanhã
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const tomorrowTickets = (ticketsForTomorrow || []).filter((t) => {
    const event = t.events as unknown as { event_date: string; status: string }
    return event?.event_date === tomorrowStr
  })

  if (tomorrowTickets.length === 0) {
    return NextResponse.json({ reminders_sent: 0, message: 'No events tomorrow' })
  }

  let remindersSent = 0

  for (const ticket of tomorrowTickets) {
    const event = ticket.events as unknown as { title: string; event_date: string }

    // Verificar se já enviou lembrete hoje para esse usuário/ticket
    const today = new Date().toISOString().split('T')[0]
    const { data: existingReminder } = await supabaseAdmin
      .from('push_notifications')
      .select('id')
      .eq('user_id', ticket.buyer_id)
      .eq('type', 'event_reminder')
      .gte('sent_at', `${today}T00:00:00Z`)
      .like('body', `%${event.title.substring(0, 20)}%`)
      .limit(1)

    if (existingReminder && existingReminder.length > 0) {
      continue // Já enviou hoje
    }

    try {
      await sendEventReminderPush(ticket.buyer_id, event.title, ticket.id)
      remindersSent++
    } catch (pushErr) {
      console.error(`[Reminders] Erro ao enviar para user ${ticket.buyer_id}:`, pushErr)
    }
  }

  console.log(`[Reminders] ${remindersSent} lembretes enviados`)
  return NextResponse.json({ reminders_sent: remindersSent })
}
