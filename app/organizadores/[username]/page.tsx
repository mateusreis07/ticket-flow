import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, MapPin, Settings } from 'lucide-react'
import { getOrganizerByUsername, getOrganizerEvents, isFollowing } from '@/lib/queries/organizers'
import { createClient } from '@/lib/supabase/server'
import { FollowButton } from '@/components/organizers/FollowButton'
import { OrganizerTabs } from '@/components/organizers/OrganizerTabs'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const organizer = await getOrganizerByUsername(params.username)
  
  if (!organizer) return { title: 'Organizador não encontrado' }

  return {
    title: `${organizer.name} (@${organizer.username}) — TicketFlow`,
    description: organizer.bio || `Confira os próximos eventos de ${organizer.name}`,
    openGraph: {
      title: `${organizer.name} — TicketFlow`,
      description: organizer.bio || `Confira os próximos eventos de ${organizer.name}`,
      images: organizer.avatar_url ? [organizer.avatar_url] : [],
    }
  }
}

export default async function OrganizerProfilePage({ params }: { params: { username: string } }) {
  const organizer = await getOrganizerByUsername(params.username)
  
  if (!organizer) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isUserFollowing = user ? await isFollowing(user.id, organizer.id) : false
  const isOwnProfile = user?.id === organizer.id

  const { data: upcomingEvents, total: upcomingTotal } = await getOrganizerEvents(organizer.id, { filter: 'upcoming' })
  const { data: pastEvents, total: pastTotal } = await getOrganizerEvents(organizer.id, { filter: 'past' })

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* COVER / BANNER */}
      <div className="relative h-48 md:h-64 w-full bg-gradient-to-br from-primary via-purple-700 to-indigo-800">
        {organizer.cover_url && (
          <Image src={organizer.cover_url} alt="Capa" fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* SEÇÃO DO PERFIL */}
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Linha 1: Avatar (sobrepondo a capa) + Botões de ação */}
        <div className="relative flex justify-between items-end mb-3">
          <div className="-mt-12 md:-mt-16 w-28 h-28 md:w-32 md:h-32 relative rounded-2xl border-4 border-white shadow-md bg-primary-light flex items-center justify-center overflow-hidden shrink-0 z-10">
            {organizer.avatar_url ? (
              <Image src={organizer.avatar_url} alt={organizer.name} fill className="object-cover" priority />
            ) : (
              <span className="text-primary text-3xl md:text-5xl font-bold">{organizer.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="flex items-center gap-3 relative z-10 pb-2">
            {!isOwnProfile ? (
              <FollowButton 
                organizerId={organizer.id} 
                initialIsFollowing={isUserFollowing} 
                followersCount={organizer.followers_count}
                username={organizer.username}
              />
            ) : (
              <Link 
                href="/dashboard/perfil"
                className="border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
              >
                <Settings className="w-4 h-4" />
                Editar perfil
              </Link>
            )}
          </div>
        </div>

        {/* Linha 2: Informações de Texto (garantido em fundo claro) */}
        <div className="mb-8">
          <h1 className="font-bold text-gray-900 text-2xl md:text-3xl flex items-center gap-2">
            {organizer.name}
            {organizer.is_verified && (
              <span title="Organizador verificado" className="inline-flex items-center justify-center">
                <BadgeCheck className="text-primary w-6 h-6" />
              </span>
            )}
          </h1>
          <p className="text-gray-500 font-medium mt-0.5">@{organizer.username}</p>
          
          {(organizer.city || organizer.state) && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
              <MapPin className="text-gray-400 w-4 h-4" />
              {[organizer.city, organizer.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6 border-y border-gray-200 py-5 bg-white rounded-2xl shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{organizer.upcoming_events_count}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Próximos eventos</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{organizer.past_events_count}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Eventos realizados</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{organizer.total_tickets_sold}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Ingressos vendidos</p>
          </div>
          <div className="text-center border-l border-gray-100 hidden md:block">
            <p className="text-2xl font-bold text-gray-900">{organizer.followers_count}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Seguidores</p>
          </div>
        </div>

        {/* TABS DE CONTEÚDO */}
        <div className="mt-8">
          <OrganizerTabs 
            organizerId={organizer.id}
            upcomingEvents={upcomingEvents}
            upcomingTotal={upcomingTotal}
            initialPastEvents={pastEvents}
            pastTotal={pastTotal}
            organizer={organizer}
          />
        </div>
      </div>
    </main>
  )
}
