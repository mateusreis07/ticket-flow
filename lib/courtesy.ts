import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendCourtesyEmail } from '@/lib/email'
import { formatDate } from '@/lib/utils/format'

export async function issueCourtesyTickets(entryId: string): Promise<{ success: boolean; tickets?: any[]; order?: any; guestProfile?: any; error?: string }> {
  try {
    // 1. Buscar a courtesy_entry com todos os detalhes
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('courtesy_entries')
      .select(`
        *,
        courtesy_lists (*),
        events (*),
        ticket_types (*)
      `)
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      return { success: false, error: 'Entrada de cortesia não encontrada.' }
    }

    const list = Array.isArray(entry.courtesy_lists) ? entry.courtesy_lists[0] : entry.courtesy_lists
    const event = Array.isArray(entry.events) ? entry.events[0] : entry.events
    const ticketType = Array.isArray(entry.ticket_types) ? entry.ticket_types[0] : entry.ticket_types
    const organizerId = event.organizer_id

    const { data: organizer } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', organizerId)
      .single()

    // 2. Validações
    if (entry.status !== 'pending') {
      return { success: false, error: 'Esta entrada já foi processada ou cancelada.' }
    }

    if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
      await supabaseAdmin
        .from('courtesy_entries')
        .update({ status: 'expired' })
        .eq('id', entryId)
      return { success: false, error: 'Esta entrada expirou.' }
    }

    if (ticketType.quantity_total - ticketType.quantity_sold < entry.quantity) {
      return { success: false, error: 'Ingresso sem capacidade disponível.' }
    }

    // 3. Criar ou buscar perfil do convidado
    let guestProfileId = ''
    const { data: existingProfiles, error: profileSearchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', entry.guest_email)

    if (existingProfiles && existingProfiles.length > 0) {
      guestProfileId = existingProfiles[0].id
    } else {
      // Criar usuário no Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: entry.guest_email,
        email_confirm: true,
        user_metadata: {
          name: entry.guest_name,
          role: 'buyer'
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário:', authError)
        return { success: false, error: 'Falha ao criar usuário para o convidado.' }
      }
      guestProfileId = authUser.user.id
      
      // Aguardar a trigger criar o profile (retry)
      let profileCreated = false
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 500))
        const { data: checkProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', guestProfileId)
          .single()
        if (checkProfile) {
          profileCreated = true
          break
        }
      }
      
      if (!profileCreated) {
        return { success: false, error: 'Timeout ao aguardar criação de perfil.' }
      }
    }

    // 4. Criar order de cortesia
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: guestProfileId,
        event_id: entry.event_id,
        status: 'paid',
        total_amount: 0,
        subtotal_amount: 0,
        discount_amount: 0,
        is_courtesy: true,
        courtesy_entry_id: entryId,
        courtesy_list_id: entry.list_id,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 5. Criar order_items
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        ticket_type_id: entry.ticket_type_id,
        quantity: entry.quantity,
        unit_price: 0,
      })

    if (itemsError) throw itemsError

    // 6. Criar tickets
    const ticketsToInsert = []
    for (let i = 0; i < entry.quantity; i++) {
      ticketsToInsert.push({
        order_id: order.id,
        ticket_type_id: entry.ticket_type_id,
        event_id: entry.event_id,
        buyer_id: guestProfileId,
        qr_code: crypto.randomUUID(),
        is_used: false,
        is_courtesy: true,
        courtesy_entry_id: entryId,
      })
    }

    const { data: createdTickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .insert(ticketsToInsert)
      .select()

    if (ticketsError) throw ticketsError

    // 7. Atualizar quantity_sold no ticket_type
    const { error: updateTicketTypeError } = await supabaseAdmin.rpc('increment_ticket_sold', {
      p_ticket_type_id: entry.ticket_type_id,
      p_quantity: entry.quantity
    })
    // Se o rpc não existir, fallback:
    if (updateTicketTypeError) {
        await supabaseAdmin
            .from('ticket_types')
            .update({ quantity_sold: ticketType.quantity_sold + entry.quantity })
            .eq('id', entry.ticket_type_id)
    }

    // 8. Atualizar status da courtesy_entry
    const { error: updateEntryError } = await supabaseAdmin
      .from('courtesy_entries')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', entryId)

    if (updateEntryError) throw updateEntryError

    // Enviar e-mail
    try {
      await sendCourtesyEmail({
        guestName: entry.guest_name,
        guestEmail: entry.guest_email,
        organizerName: organizer?.name || 'Organizador',
        eventTitle: event.title,
        eventDate: formatDate(event.event_date, "dd 'de' MMMM 'de' yyyy"),
        eventTime: event.event_time,
        eventLocation: event.location,
        eventCity: event.city,
        listType: list.list_type,
        listName: list.name,
        tickets: createdTickets.map(t => ({
          qrCode: t.qr_code,
          ticketTypeName: ticketType.name,
          ticketCode: t.qr_code.slice(-8).toUpperCase(),
        })),
        note: entry.note ?? undefined,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      })
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de cortesia:', emailError)
    }

    return { 
      success: true, 
      tickets: createdTickets, 
      order, 
      guestProfile: { id: guestProfileId } 
    }

  } catch (error: any) {
    console.error('Erro na emissão de cortesia:', error)
    return { success: false, error: error.message || 'Erro interno.' }
  }
}

export async function revokeCourtesyEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: entry, error: fetchError } = await supabaseAdmin
      .from('courtesy_entries')
      .select('status, ticket_type_id, quantity')
      .eq('id', entryId)
      .single()

    if (fetchError || !entry) {
      return { success: false, error: 'Entrada não encontrada.' }
    }

    if (entry.status !== 'sent' && entry.status !== 'confirmed') {
      return { success: false, error: 'Apenas entradas emitidas podem ser revogadas.' }
    }

    // Marcar tickets como "usados" (proxy para inválidos no MVP)
    const { error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('courtesy_entry_id', entryId)

    if (ticketsError) throw ticketsError

    // Tentar decrementar vendas (fallback se RPC falhar)
    const { data: ticketType } = await supabaseAdmin
      .from('ticket_types')
      .select('quantity_sold')
      .eq('id', entry.ticket_type_id)
      .single()
      
    if (ticketType) {
        await supabaseAdmin
            .from('ticket_types')
            .update({ quantity_sold: Math.max(0, ticketType.quantity_sold - entry.quantity) })
            .eq('id', entry.ticket_type_id)
    }

    // Atualizar status para cancelled
    const { error: updateError } = await supabaseAdmin
      .from('courtesy_entries')
      .update({ status: 'cancelled' })
      .eq('id', entryId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao revogar cortesia:', error)
    return { success: false, error: error.message || 'Erro interno.' }
  }
}
