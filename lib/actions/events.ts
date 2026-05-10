'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const event_date = formData.get('event_date') as string
  const event_time = formData.get('event_time') as string
  const cover_image_url = formData.get('cover_image_url') as string
  const category = formData.get('category') as string
  const action = formData.get('action') as string // 'draft' or 'publish'

  const { error } = await supabase.from('events').insert({
    organizer_id: user.id,
    title,
    description: description || null,
    location,
    city,
    state,
    event_date,
    event_time,
    category,
    cover_image_url: cover_image_url || null,
    status: action === 'publish' ? 'published' : 'draft'
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/eventos')
  redirect('/dashboard/eventos')
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const event_date = formData.get('event_date') as string
  const event_time = formData.get('event_time') as string
  const cover_image_url = formData.get('cover_image_url') as string
  const category = formData.get('category') as string
  const action = formData.get('action') as string // 'draft' or 'publish'

  const { error } = await supabase
    .from('events')
    .update({
      title,
      description: description || null,
      location,
      city,
      state,
      event_date,
      event_time,
      category,
      cover_image_url: cover_image_url || null,
      status: action === 'publish' ? 'published' : 'draft'
    })
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/eventos')
  redirect('/dashboard/eventos')
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/eventos')
  return { success: true }
}

export async function publishEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('events')
    .update({ status: 'published' })
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/eventos')
  return { success: true }
}

export async function unpublishEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('events')
    .update({ status: 'draft' })
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/eventos')
  return { success: true }
}

export async function uploadEventCover(formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  if (!file) throw new Error('Nenhum arquivo enviado')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const timestamp = new Date().getTime()
  const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
  const filePath = `${user.id}/${filename}`

  const { data, error } = await supabase.storage
    .from('event-covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw new Error(error.message)

  const { data: publicUrlData } = supabase.storage
    .from('event-covers')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}
