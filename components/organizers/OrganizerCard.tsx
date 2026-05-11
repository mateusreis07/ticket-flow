import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { OrganizerProfile } from '@/types'

interface OrganizerCardProps {
  organizer: OrganizerProfile
  variant?: 'small' | 'large'
}

export function OrganizerCard({ organizer, variant = 'small' }: OrganizerCardProps) {
  const profileUrl = `/organizadores/${organizer.username || organizer.id}`

  if (variant === 'large') {
    return (
      <Link href={profileUrl} className="group block h-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Cover */}
        <div className="h-24 w-full relative bg-gradient-to-br from-primary via-purple-700 to-indigo-800">
          {organizer.cover_url && (
            <Image src={organizer.cover_url} alt="Cover" fill className="object-cover" />
          )}
        </div>
        
        {/* Avatar */}
        <div className="px-4 relative">
          <div className="w-16 h-16 -mt-8 rounded-2xl border-4 border-white overflow-hidden bg-primary-light shadow-sm flex items-center justify-center relative z-10">
            {organizer.avatar_url ? (
              <Image src={organizer.avatar_url} alt={organizer.name} fill className="object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{organizer.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{organizer.name}</h3>
            {organizer.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-gray-400 truncate mb-3">@{organizer.username || organizer.id.substring(0, 8)}</p>
          
          {organizer.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">{organizer.bio}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
            <span><strong>{organizer.upcoming_events_count}</strong> eventos</span>
            <span><strong>{organizer.followers_count}</strong> seguidores</span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-primary block text-center border border-primary/20 rounded-xl py-2 group-hover:bg-primary group-hover:text-white transition-colors">
              Ver perfil
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Small variant (for homepage scroll)
  return (
    <Link href={profileUrl} className="flex-shrink-0 w-36 md:w-auto text-center cursor-pointer group block">
      <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-transparent group-hover:border-primary transition-all overflow-hidden shadow-sm relative flex items-center justify-center bg-primary-light">
        {organizer.avatar_url ? (
          <Image src={organizer.avatar_url} alt={organizer.name} fill className="object-cover" />
        ) : (
          <span className="text-xl font-bold text-primary">{organizer.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {organizer.is_verified && (
        <div className="inline-flex items-center justify-center bg-primary-light text-primary text-[10px] font-medium rounded-full px-2 py-0.5 mt-2">
          <BadgeCheck className="w-3 h-3 mr-0.5" /> Verificado
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-900 mt-2 group-hover:text-primary transition-colors truncate px-2">
        {organizer.name}
      </h3>
      <p className="text-xs text-gray-400 truncate px-2">@{organizer.username || organizer.id.substring(0, 8)}</p>

      <p className="text-[11px] text-gray-500 mt-1">
        {organizer.upcoming_events_count > 0 
          ? `${organizer.upcoming_events_count} eventos próximos` 
          : `${organizer.followers_count} seguidores`}
      </p>
    </Link>
  )
}
