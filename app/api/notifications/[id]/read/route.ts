import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: 'Missing notification id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('push_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
