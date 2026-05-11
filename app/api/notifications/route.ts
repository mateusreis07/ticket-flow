import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: notifications } = await supabase
    .from('push_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(20)

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length

  return NextResponse.json({
    notifications: notifications ?? [],
    unreadCount,
  })
}
