import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { issueCourtesyTickets } from '@/lib/courtesy'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'organizer') {
       return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const { entryId } = body

    if (!entryId) {
      return NextResponse.json({ success: false, error: 'Entry ID é obrigatório' }, { status: 400 })
    }

    // Verificar se a entry pertence a um evento do organizador
    const { data: entry } = await supabase
      .from('courtesy_entries')
      .select('organizer_id')
      .eq('id', entryId)
      .single()

    if (!entry || entry.organizer_id !== user.id) {
       return NextResponse.json({ success: false, error: 'Permissão negada para esta entrada.' }, { status: 403 })
    }

    const result = await issueCourtesyTickets(entryId)
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, ticketsCount: result.tickets?.length || 0 })
  } catch (error: any) {
    console.error('API Issue Courtesy error:', error)
    return NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 })
  }
}
