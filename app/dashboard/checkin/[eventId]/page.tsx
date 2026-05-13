import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CheckinManager from '@/components/checkin/CheckinManager'

export const dynamic = 'force-dynamic'

export default async function CheckinEventPage({ params }: { params: { eventId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { eventId } = params

  // 1. Fetch Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  // 2. Fetch Checkin Overview
  const { data: overview } = await supabase
    .from('checkin_overview')
    .select('*')
    .eq('event_id', eventId)
    .single()

  // 3. Fetch active session
  const { data: activeSession } = await supabase
    .from('checkin_sessions')
    .select('*')
    .eq('event_id', eventId)
    .eq('organizer_id', user.id)
    .eq('is_active', true)
    .single()

  return (
    <CheckinManager 
      event={event} 
      overview={overview || { total_tickets: 0, checked_in_count: 0, pending_count: 0, checkin_percentage: 0 }}
      activeSession={activeSession || null}
    />
  )
}
