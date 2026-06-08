import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizerById } from '@/lib/queries/organizers'
import { ExternalLink, Camera, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

import { ProfileForm } from './ProfileForm' // We will extract the form to a client component

export const metadata = {
  title: 'Meu Perfil Público | Dashboard — TicketFlow'
}

export default async function DashboardProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, auth_provider')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') {
    redirect('/dashboard')
  }

  const organizer = await getOrganizerById(user.id)
  
  if (!organizer) {
    // Fallback if view doesn't return data yet
    return (
      <div className="p-8">
        <p>Erro ao carregar perfil do organizador.</p>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu perfil público</h1>
            <p className="text-gray-500 mt-1">Configure como seu perfil aparece para os compradores</p>
          </div>
          
          <Link 
            href={`/organizadores/${organizer.username || organizer.id}`}
            target="_blank"
            className="text-sm font-medium text-primary bg-primary-light/50 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-light transition-colors w-fit"
          >
            Ver perfil público
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Profile Form (Client Component) */}
        <ProfileForm organizer={organizer} userId={user.id} authProvider={profile?.auth_provider || 'email'} />

      </div>
    </>
  )
}
