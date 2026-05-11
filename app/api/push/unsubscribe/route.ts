import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = unsubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 })
  }

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', parsed.data.endpoint)
    .eq('user_id', user.id)

  if (error) {
    console.error('[Push Unsubscribe] DB error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
