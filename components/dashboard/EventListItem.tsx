'use client'

import { CalendarDays, MapPin, Ticket, MoreVertical, ImageIcon, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteEvent, publishEvent, unpublishEvent } from '@/lib/actions/events'

interface EventListItemProps {
  event: any // type from view
}

export default function EventListItem({ event }: EventListItemProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const handlePublish = async () => {
    await publishEvent(event.id)
  }

  const handleUnpublish = async () => {
    await unpublishEvent(event.id)
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja cancelar este evento? Esta ação não exclui as vendas já realizadas, mas impede novas vendas.')) {
      await deleteEvent(event.id)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-primary/30 hover:shadow-sm transition-all">
      {/* Cover Image */}
      {event.cover_image_url ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-100">
          <Image 
            src={event.cover_image_url} 
            alt={event.title} 
            fill 
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
          <ImageIcon className="h-6 w-6 text-gray-300" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate" title={event.title}>{event.title}</h3>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[120px]" title={`${event.city}/${event.state}`}>{event.city}/{event.state}</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Ticket className="h-3.5 w-3.5 shrink-0" />
            <span>{event.total_sold || 0} vendidos / {event.total_capacity || 0}</span>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="hidden sm:block shrink-0">
        {event.status === 'published' && (
          <span className="bg-green-100 text-green-700 rounded-full px-2.5 py-1 text-xs font-medium">Publicado</span>
        )}
        {event.status === 'draft' && (
          <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 text-xs font-medium">Rascunho</span>
        )}
        {event.status === 'cancelled' && (
          <span className="bg-red-100 text-red-600 rounded-full px-2.5 py-1 text-xs font-medium">Cancelado</span>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors outline-none shrink-0">
          <MoreVertical className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem render={
              <Link href={`/dashboard/eventos/${event.id}/editar`} className="cursor-pointer" />
            }>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem render={
              <Link href={`/dashboard/eventos/${event.id}/ingressos`} className="cursor-pointer" />
            }>
              Gerenciar ingressos
            </DropdownMenuItem>
            <DropdownMenuItem render={
              <Link href={`/dashboard/eventos/${event.id}/relatorio`} className="cursor-pointer" />
            }>
              <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Ver relatório</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {event.status === 'draft' && (
              <DropdownMenuItem onClick={handlePublish} className="cursor-pointer">
                Publicar
              </DropdownMenuItem>
            )}
            
            {event.status === 'published' && (
              <DropdownMenuItem onClick={handleUnpublish} className="cursor-pointer">
                Despublicar
              </DropdownMenuItem>
            )}

            {event.status !== 'cancelled' && (
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 cursor-pointer">
                Cancelar evento
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
