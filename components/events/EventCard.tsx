import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, MapPin, Music } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'

export default function EventCard({ event }: { event: any }) {
  const isSoldOut = event.total_capacity > 0 && event.total_sold >= event.total_capacity

  return (
    <Link href={`/events/${event.id}`} className="block group h-full">
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col relative">
        
        <div className="aspect-[4/3] relative overflow-hidden shrink-0">
          {event.cover_image_url ? (
            <Image 
              src={event.cover_image_url} 
              alt={event.title} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-light to-purple-100 flex items-center justify-center">
              <Music className="h-10 w-10 text-primary opacity-50" />
            </div>
          )}

          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
            {event.min_price === 0 ? (
              <span className="bg-green-500 text-white rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                Gratuito
              </span>
            ) : event.min_price > 0 ? (
              <span className="bg-black/70 backdrop-blur-sm text-white rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                A partir de {formatCurrency(event.min_price)}
              </span>
            ) : null}
          </div>

          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <span className="text-white font-bold text-lg uppercase tracking-wider border-2 border-white px-4 py-2 rounded-lg transform -rotate-12">
                Esgotado
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="capitalize">{formatDateTime(event.event_date, event.event_time)}</span>
          </div>

          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2 mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.location} • {event.city}/{event.state}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
            {event.organizer_username ? (
              <Link 
                href={`/organizadores/${event.organizer_username}`}
                className="text-xs text-gray-400 hover:text-primary transition-colors truncate max-w-[60%]"
                onClick={(e) => e.stopPropagation()}
              >
                por {event.organizer_name}
              </Link>
            ) : (
              <span className="text-xs text-gray-400 truncate max-w-[60%]">
                por {event.organizer_name}
              </span>
            )}
            {!isSoldOut && event.total_capacity > 0 && (
              <span className="text-[10px] uppercase font-bold text-gray-400">
                {event.total_capacity - event.total_sold} disponíveis
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
