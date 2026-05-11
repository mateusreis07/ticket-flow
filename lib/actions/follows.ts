'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getOrganizerById } from '../queries/organizers'

export async function followOrganizer(organizerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: organizerId
    })

  if (error && error.code !== '23505') { // Ignore unique constraint violation
    console.error('Error following organizer:', error)
    return { error: 'Erro ao seguir organizador' }
  }

  const organizer = await getOrganizerById(organizerId)
  if (organizer?.username) {
    revalidatePath(`/organizadores/${organizer.username}`)
  }
  revalidatePath('/meus-organizadores')

  // Optional: Send push notification to the organizer
  // (Assuming logic is available in lib/push-notifications or similar later)

  return { success: true }
}

export async function unfollowOrganizer(organizerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', organizerId)

  if (error) {
    console.error('Error unfollowing organizer:', error)
    return { error: 'Erro ao deixar de seguir organizador' }
  }

  const organizer = await getOrganizerById(organizerId)
  if (organizer?.username) {
    revalidatePath(`/organizadores/${organizer.username}`)
  }
  revalidatePath('/meus-organizadores')

  return { success: true }
}
