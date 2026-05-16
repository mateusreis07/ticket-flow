import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const listId = formData.get('listId') as string
    const eventId = formData.get('eventId') as string

    if (!file || !listId || !eventId) {
      return NextResponse.json({ success: false, error: 'Parâmetros ausentes' }, { status: 400 })
    }

    // Verificar propriedade da lista
    const { data: list } = await supabase
      .from('courtesy_lists')
      .select('organizer_id, list_type')
      .eq('id', listId)
      .single()

    if (!list || list.organizer_id !== user.id) {
       return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }

    // Buscar ticket types para mapeamento
    const { data: ticketTypes } = await supabase
      .from('ticket_types')
      .select('id, name')
      .eq('event_id', eventId)

    if (!ticketTypes || ticketTypes.length === 0) {
        return NextResponse.json({ success: false, error: 'Evento não possui tipos de ingresso' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n')
    
    // Ignorar cabeçalho se houver
    let startIdx = 0
    if (lines[0].toLowerCase().includes('nome') && lines[0].toLowerCase().includes('email')) {
        startIdx = 1
    }

    const toInsert = []
    const errors = []
    let skipped = 0

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) {
            skipped++
            continue
        }

        const parts = line.split(',')
        if (parts.length < 2) {
            errors.push({ linha: i + 1, detalhe: 'Formato inválido. Esperado pelo menos nome e email separados por vírgula.' })
            continue
        }

        const guest_name = parts[0]?.trim()
        const guest_email = parts[1]?.trim()
        const guest_phone = parts[2]?.trim() || null
        const quantityRaw = parseInt(parts[3]?.trim() || '1')
        const ticket_type_name = parts[4]?.trim()
        const note = parts[5]?.trim() || null

        if (!guest_name || !guest_email) {
            errors.push({ linha: i + 1, detalhe: 'Nome e email são obrigatórios.' })
            continue
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(guest_email)) {
            errors.push({ linha: i + 1, detalhe: `Email inválido: ${guest_email}` })
            continue
        }

        const quantity = isNaN(quantityRaw) || quantityRaw < 1 ? 1 : Math.min(quantityRaw, 10)

        // Encontrar ticket type correspondente
        let ticket_type_id = ticketTypes[0].id // Default to first
        if (ticket_type_name) {
            const found = ticketTypes.find(t => t.name.toLowerCase() === ticket_type_name.toLowerCase())
            if (found) {
                ticket_type_id = found.id
            }
        }

        toInsert.push({
            list_id: listId,
            event_id: eventId,
            organizer_id: user.id,
            guest_name,
            guest_email,
            guest_phone,
            ticket_type_id,
            quantity,
            note,
            created_by: user.id,
            status: 'pending'
        })
    }

    if (toInsert.length > 0) {
        // Inserir em lote usando service_role para evitar RLS complexo se necessário, 
        // ou usar cliente normal (que já validamos permissão)
        const { error: insertError } = await supabaseAdmin
            .from('courtesy_entries')
            .insert(toInsert)
            
        if (insertError) {
             console.error('Erro no insert em lote:', insertError)
             return NextResponse.json({ success: false, error: 'Falha ao salvar registros importados.' }, { status: 500 })
        }
    }

    return NextResponse.json({ 
        success: true, 
        result: {
            imported: toInsert.length,
            skipped,
            errors
        }
    })
  } catch (error: any) {
    console.error('API Import Courtesy error:', error)
    return NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 })
  }
}
