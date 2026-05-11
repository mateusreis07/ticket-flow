'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function markAllAsRead(userId: string) {
  await supabaseAdmin
    .from('push_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)

  revalidatePath('/notificacoes')
}
