import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { OrganizerCard } from '@/components/organizers/OrganizerCard'
import { FollowButton } from '@/components/organizers/FollowButton'

export const metadata = {
  title: 'Organizadores que sigo — TicketFlow'
}

export default async function MyOrganizersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/meus-organizadores')

  // Buscar organizadores que o usuário segue
  const { data: followedIds } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  let organizers: any[] = []

  if (followedIds && followedIds.length > 0) {
    const ids = followedIds.map(f => f.following_id)
    const { data } = await supabase
      .from('organizer_profiles')
      .select('*')
      .in('id', ids)
      
    organizers = data || []
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Organizadores que sigo</h1>

        {organizers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum organizador ainda</h2>
            <p className="text-gray-500 max-w-sm mb-6">
              Siga organizadores para acompanhar seus próximos eventos e receber novidades.
            </p>
            <Link 
              href="/organizadores"
              className="bg-primary text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors"
            >
              Descobrir organizadores
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {organizers.map(organizer => (
              <div key={organizer.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-primary-light flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 relative">
                    {organizer.avatar_url ? (
                      <img src={organizer.avatar_url} alt={organizer.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-primary">{organizer.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 truncate max-w-[200px]">{organizer.name}</h3>
                    <p className="text-xs text-gray-500">@{organizer.username || organizer.id.substring(0, 8)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-900">{organizer.upcoming_events_count}</span> eventos próximos
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/organizadores/${organizer.username || organizer.id}`}
                      className="text-xs font-medium text-primary hover:underline px-2 py-2"
                    >
                      Ver perfil
                    </Link>
                    <FollowButton 
                      organizerId={organizer.id}
                      initialIsFollowing={true}
                      followersCount={organizer.followers_count}
                      username={organizer.username}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
