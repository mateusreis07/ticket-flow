'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTicketType(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  // Verifica permissão do evento
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) return { error: 'Evento não encontrado ou acesso negado' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const quantity_total = parseInt(formData.get('quantity_total') as string, 10)
  const is_active = formData.get('is_active') === 'true'
  const sales_start_at = formData.get('sales_start_at') as string
  const sales_end_at = formData.get('sales_end_at') as string

  const { error } = await supabase.from('ticket_types').insert({
    event_id: eventId,
    name,
    description: description || null,
    price,
    quantity_total,
    is_active,
    sales_start_at: sales_start_at || null,
    sales_end_at: sales_end_at || null
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/eventos/${eventId}/ingressos`)
  return { success: true }
}

export async function updateTicketType(ticketTypeId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const quantity_total = parseInt(formData.get('quantity_total') as string, 10)
  const is_active = formData.get('is_active') === 'true'
  const sales_start_at = formData.get('sales_start_at') as string
  const sales_end_at = formData.get('sales_end_at') as string

  const { error, data } = await supabase
    .from('ticket_types')
    .update({
      name,
      description: description || null,
      price,
      quantity_total,
      is_active,
      sales_start_at: sales_start_at || null,
      sales_end_at: sales_end_at || null
    })
    .eq('id', ticketTypeId)
    .select('event_id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/eventos/${data.event_id}/ingressos`)
  return { success: true }
}

export async function toggleTicketType(ticketTypeId: string, isActive: boolean) {
  const supabase = await createClient()
  
  const { error, data } = await supabase
    .from('ticket_types')
    .update({ is_active: isActive })
    .eq('id', ticketTypeId)
    .select('event_id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/eventos/${data.event_id}/ingressos`)
  return { success: true }
}

export async function deleteTicketType(ticketTypeId: string) {
  const supabase = await createClient()
  
  const { data: tt } = await supabase
    .from('ticket_types')
    .select('quantity_sold, event_id')
    .eq('id', ticketTypeId)
    .single()

  if (!tt) return { error: 'Ingresso não encontrado' }
  if (tt.quantity_sold > 0) {
    return { error: 'Não é possível remover ingresso com vendas' }
  }

  const { error } = await supabase
    .from('ticket_types')
    .delete()
    .eq('id', ticketTypeId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/eventos/${tt.event_id}/ingressos`)
  return { success: true }
}
