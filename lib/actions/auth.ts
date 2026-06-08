'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function selectRole(formData: FormData) {
  const role = formData.get('role') as string
  
  if (role !== 'buyer' && role !== 'organizer') {
    throw new Error('Role inválido')
  }
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      role,
      needs_role_selection: false
    })
    .eq('id', user.id)
    
  if (error) {
    console.error('Erro ao atualizar role:', error)
    throw new Error('Erro ao salvar sua escolha. Tente novamente.')
  }
  
  if (role === 'organizer') {
    redirect('/dashboard')
  } else {
    redirect('/meus-ingressos')
  }
}
