'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(300, 'Máximo 300 caracteres').optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  avatar_url: z.string().optional(),
  cover_url: z.string().optional(),
})

export async function updateOrganizerProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const rawData = {
    name: formData.get('name') as string,
    username: formData.get('username') as string,
    bio: formData.get('bio') as string,
    website: formData.get('website') as string,
    instagram: formData.get('instagram') as string,
    facebook: formData.get('facebook') as string,
    whatsapp: formData.get('whatsapp') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    avatar_url: formData.get('avatar_url') as string | undefined,
    cover_url: formData.get('cover_url') as string | undefined,
  }

  const result = profileSchema.safeParse(rawData)
  if (!result.success) {
    return { error: 'Dados inválidos', details: result.error.flatten() }
  }

  const data = result.data

  // Check username availability if changed and not empty
  if (data.username) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', data.username)
      .neq('id', user.id)

    if (count && count > 0) {
      return { error: 'Username já está em uso' }
    }
  }

  // Update profile
  const updateData: any = {
    name: data.name,
    username: data.username || null,
    bio: data.bio || null,
    website: data.website || null,
    instagram: data.instagram || null,
    facebook: data.facebook || null,
    whatsapp: data.whatsapp || null,
    city: data.city || null,
    state: data.state || null,
  }

  if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url || null
  if (data.cover_url !== undefined) updateData.cover_url = data.cover_url || null

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: 'Erro ao atualizar perfil' }
  }

  revalidatePath('/dashboard/perfil')
  if (data.username) {
    revalidatePath(`/organizadores/${data.username}`)
  }

  return { success: true }
}

export async function checkUsernameAvailable(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('username', username)
    .neq('id', user?.id || '00000000-0000-0000-0000-000000000000')

  return { available: count === 0 }
}
