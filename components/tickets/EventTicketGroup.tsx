import { TicketWithDetails } from '@/types'
import { CalendarDays, MapPin, Music } from 'lucide-react'
import Image from 'next/image'
import { formatDate } from '@/lib/utils/format'
import { TicketListItem } from './TicketListItem'

export interface EventGroup {
  event_id: string
  event_title: string
  event_date: string
  event_time: string
  location: string
  city: string
  state: string
  cover_image_url: string | null
  tickets: TicketWithDetails[]
}

interface EventTicketGroupProps {
  eventGroup: EventGroup
  isPast?: boolean
}

export function EventTicketGroup({ eventGroup, isPast }: EventTicketGroupProps) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm mb-4 ${isPast ? 'opacity-75' : ''}`}>
      
      {/* Cabeçalho do card */}
      <div className="flex items-center gap-4 p-5 border-b border-gray-100">
        
        {/* Imagem do evento */}
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-primary-light flex items-center justify-center">
          {eventGroup.cover_image_url ? (
            <Image 
              src={eventGroup.cover_image_url} 
              alt={eventGroup.event_title} 
              fill 
              className="object-cover" 
            />
          ) : (
            <Music className="h-6 w-6 text-primary opacity-50" />
          )}
        </div>

        {/* Informações do evento */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate text-base">
            {eventGroup.event_title}
          </h3>
          
          <div className="flex items-center gap-1.5 mt-1">
            <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm text-gray-600 truncate capitalize">
              {formatDate(eventGroup.event_date, "EEEE, dd 'de' MMMM 'de' yyyy")}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500 truncate">
              {eventGroup.location}, {eventGroup.city}/{eventGroup.state}
            </span>
          </div>
        </div>

        {/* Lado direito */}
        <div className="flex flex-col items-end">
          <span className="bg-primary-light text-primary text-xs font-medium rounded-full px-3 py-1">
            {eventGroup.tickets.length} ingresso(s)
          </span>
          {isPast && (
            <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-3 py-1 mt-1 font-medium whitespace-nowrap">
              Evento encerrado
            </span>
          )}
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="divide-y divide-gray-100">
        {eventGroup.tickets.map((ticket) => (
          <TicketListItem 
            key={ticket.id} 
            ticket={ticket} 
            isPast={isPast} 
          />
        ))}
      </div>
    </div>
  )
}
