'use strict'
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { issueCourtesyTickets, revokeCourtesyEntry } from '@/lib/courtesy'

const createListSchema = z.object({
  name: z.string().min(2, 'O nome da lista precisa ter no mínimo 2 caracteres').max(100),
  description: z.string().max(300, 'A descrição deve ter no máximo 300 caracteres').optional(),
  list_type: z.enum(['courtesy', 'vip', 'press', 'staff', 'sponsor', 'guest']),
  max_entries: z.coerce.number().int().positive().optional().or(z.literal('')),
})

export async function createCourtesyList(eventId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Não autorizado' }

    // Verificar se evento pertence ao organizador
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single()

    if (!event || event.organizer_id !== user.id) {
      return { success: false, error: 'Evento não encontrado ou permissão negada' }
    }

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      list_type: formData.get('list_type') as string,
      max_entries: formData.get('max_entries') as string,
    }

    const parsed = createListSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const maxEntries = parsed.data.max_entries === '' ? null : Number(parsed.data.max_entries)

    const { data: list, error } = await supabase
      .from('courtesy_lists')
      .insert({
        event_id: eventId,
        organizer_id: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        list_type: parsed.data.list_type,
        max_entries: maxEntries,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/eventos/${eventId}/cortesia`)
    return { success: true, list }
  } catch (error: any) {
    console.error('Erro ao criar lista de cortesia:', error)
    return { success: false, error: error.message || 'Erro interno.' }
  }
}

export async function updateCourtesyList(listId: string, eventId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Não autorizado' }

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      list_type: formData.get('list_type') as string,
      max_entries: formData.get('max_entries') as string,
    }

    const parsed = createListSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const maxEntries = parsed.data.max_entries === '' ? null : Number(parsed.data.max_entries)

    const { error } = await supabase
      .from('courtesy_lists')
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        list_type: parsed.data.list_type,
        max_entries: maxEntries,
      })
      .eq('id', listId)
      .eq('organizer_id', user.id) // check property

    if (error) throw error

    revalidatePath(`/dashboard/eventos/${eventId}/cortesia`)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar lista:', error)
    return { success: false, error: error.message || 'Erro interno.' }
  }
}

export async function deleteCourtesyList(listId: string, eventId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Não autorizado' }

    // Verificar se há entries sent ou confirmed
    const { count } = await supabase
      .from('courtesy_entries')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)
      .in('status', ['sent', 'confirmed'])

    if (count && count > 0) {
      return { success: false, error: 'Não é possível excluir uma lista com ingressos emitidos.' }
    }

    const { error } = await supabase
      .from('courtesy_lists')
      .delete()
      .eq('id', listId)
      .eq('organizer_id', user.id)

    if (error) throw error

    revalidatePath(`/dashboard/eventos/${eventId}/cortesia`)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao deletar lista:', error)
    return { success: false, error: error.message || 'Erro interno.' }
  }
}

const createEntrySchema = z.object({
  guest_name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  guest_email: z.string().email('E-mail inválido'),
  guest_phone: z.string().optional(),
  guest_document: z.string().optional(),
  ticket_type_id: z.string().uuid('Tipo de ingresso inválido'),
  quantity: z.coerce.number().int().min(1).max(10),
  note: z.string().max(300).optional(),
  expires_at: z.string().optional(),
})

export async function addCourtesyEntry(listId: string, eventId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Não autorizado' }

    // Check list property
    const { data: list } = await supabase
      .from('courtesy_lists')
      .select('organizer_id, max_entries')
      .eq('id', listId)
      .single()

    if (!list || list.organizer_id !== user.id) {
       return { success: false, error: 'Lista não encontrada ou permissão negada' }
    }

    // Check max entries
    if (list.max_entries) {
        const { count } = await supabase
            .from('courtesy_entries')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId)
            
        if (count && count >= list.max_entries) {
            return { success: false, error: 'Esta lista já atingiu o limite de convidados.' }
        }
    }

    const data = {
      guest_name: formData.get('guest_name') as string,
      guest_email: formData.get('guest_email') as string,
      guest_phone: formData.get('guest_phone') as string,
      guest_document: formData.get('guest_document') as string,
      ticket_type_id: formData.get('ticket_type_id') as string,
      quantity: formData.get('quantity') as string,
      note: formData.get('note') as string,
      expires_at: formData.get('expires_at') as string,
    }

    const parsed = createEntrySchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const { data: entry, error } = await supabase
      .from('courtesy_entries')
      .insert({
        list_id: listId,
        event_id: eventId,
        organizer_id: user.id,
        guest_name: parsed.data.guest_name,
        guest_email: parsed.data.guest_email,
        guest_phone: parsed.data.guest_phone || null,
        guest_document: parsed.data.guest_document || null,
        ticket_type_id: parsed.data.ticket_type_id,
        quantity: parsed.data.quantity,
        note: parsed.data.note || null,
        expires_at: parsed.data.expires_at ? new Date(parsed.data.expires_at).toISOString() : null,
        created_by: user.id,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/eventos/${eventId}/cortesia`)
    return { success: true, entry }
  } catch (error: any) {
    console.error('Erro ao adicionar convidado:', error)
    return { success: false, error: error.message || 'Erro interno.' }
  }
}

export async function updateCourtesyEntry(entryId: string, eventId: string, formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
    
        if (!user) return { success: false, error: 'Não autorizado' }

        const { data: entry } = await supabase
            .from('courtesy_entries')
            .select('status, organizer_id')
            .eq('id', entryId)
            .single()

        if (!entry || entry.organizer_id !== user.id) {
            return { success: false, error: 'Entrada não encontrada ou permissão negada' }
        }

        if (entry.status !== 'pending') {
            return { success: false, error: 'Não é possível editar uma entrada já processada.' }
        }

        const data = {
            guest_name: formData.get('guest_name') as string,
            guest_email: formData.get('guest_email') as string,
            guest_phone: formData.get('guest_phone') as string,
            guest_document: formData.get('guest_document') as string,
            ticket_type_id: formData.get('ticket_type_id') as string,
            quantity: formData.get('quantity') as string,
            note: formData.get('note') as string,
            expires_at: formData.get('expires_at') as string,
          }
      
          const parsed = createEntrySchema.safeParse(data)
          if (!parsed.success) {
            return { success: false, error: parsed.error.errors[0].message }
          }

          const { error } = await supabase
            .from('courtesy_entries')
            .update({
                guest_name: parsed.data.guest_name,
                guest_email: parsed.data.guest_email,
                guest_phone: parsed.data.guest_phone || null,
                guest_document: parsed.data.guest_document || null,
                ticket_type_id: parsed.data.ticket_type_id,
                quantity: parsed.data.quantity,
                note: parsed.data.note || null,
                expires_at: parsed.data.expires_at ? new Date(parsed.data.expires_at).toISOString() : null,
            })
            .eq('id', entryId)

        if (error) throw error
        
        revalidatePath(`/dashboard/eventos/${eventId}/cortesia`)
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao atualizar convidado:', error)
        return { success: false, error: error.message || 'Erro interno.' }
    }
}

export async function cancelCourtesyEntry(entryId: string, eventId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
    
        if (!user) return { success: false, error: 'Não autorizado' }

        const { data: entry } = await supabase
            .from('courtesy_entries')
            .select('status, organizer_id')
            .eq('id', entryId)
            .single()

        if (!entry || entry.organizer_id !== user.id) {
            return { success: false, error: 'Entrada não encontrada ou permissão negada' }
        }

        if (entry.status === 'sent' || entry.status === 'confirmed') {
             const result = await revokeCourtesyEntry(entryId)
             if (!result.success) return result
        } else {
             await supabase
                .from('courtesy_entries')
                .update({ status: 'cancelled' })
                .eq('id', entryId)
        }

        revalidatePath(`/dashboard/eventos/${eventId}/cortesia`)
        return { success: true }

    } catch (error: any) {
        console.error('Erro ao cancelar convidado:', error)
        return { success: false, error: error.message || 'Erro interno.' }
    }
}

export async function issueAllPending(listId: string, eventId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
    
        if (!user) return { success: false, error: 'Não autorizado' }

        const { data: entries } = await supabase
            .from('courtesy_entries')
            .select('id')
            .eq('list_id', listId)
            .eq('organizer_id', user.id)
            .eq('status', 'pending')

        if (!entries || entries.length === 0) {
            return { success: true, issued: 0, errors: 0 }
        }

        let issued = 0
        let errors = 0

        for (const entry of entries) {
            const res = await issueCourtesyTickets(entry.id)
            if (res.success) {
                issued++
            } else {
                errors++
                console.error(`Erro ao emitir cortesia ${entry.id}:`, res.error)
            }
        }

        revalidatePath(`/dashboard/eventos/${eventId}/cortesia`)
        return { success: true, issued, errors }
    } catch (error: any) {
        console.error('Erro ao emitir todos pendentes:', error)
        return { success: false, error: error.message || 'Erro interno.' }
    }
}
