import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'eventId é obrigatório' }, { status: 400 })
    }

    const { data: stats, error } = await supabaseAdmin
      .from('checkin_overview')
      .select('*')
      .eq('event_id', eventId)
      .eq('organizer_id', user.id)
      .single()

    if (error || !stats) {
      return NextResponse.json({ error: 'Estatísticas não encontradas' }, { status: 404 })
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Checkin stats error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
