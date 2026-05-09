import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Ticket as TicketIcon, TicketX } from 'lucide-react'
import { TicketWithDetails } from '@/types'
import { EventTicketGroup, EventGroup } from '@/components/tickets/EventTicketGroup'

export default async function MeusIngressosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/meus-ingressos')
  }

  // Buscar tickets do usuário usando a view tickets_with_details
  const { data: tickets } = await supabase
    .from('tickets_with_details')
    .select('*')
    .eq('buyer_id', user.id)
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })

  const typedTickets = (tickets || []) as TicketWithDetails[]

  // Agrupar tickets por evento
  const groupedEvents = new Map<string, EventGroup>()

  typedTickets.forEach(ticket => {
    if (!groupedEvents.has(ticket.event_id)) {
      groupedEvents.set(ticket.event_id, {
        event_id: ticket.event_id,
        event_title: ticket.event_title,
        event_date: ticket.event_date,
        event_time: ticket.event_time,
        location: ticket.location,
        city: ticket.city,
        state: ticket.state,
        cover_image_url: ticket.cover_image_url,
        tickets: []
      })
    }
    groupedEvents.get(ticket.event_id)!.tickets.push(ticket)
  })

  const allGroups = Array.from(groupedEvents.values())

  // Separar em próximos e passados
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const proximosEventos = allGroups
    .filter(group => new Date(group.event_date) >= today)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()) // Mais próximo primeiro

  const eventosPassados = allGroups
    .filter(group => new Date(group.event_date) < today)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()) // Mais recente primeiro

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-[calc(100vh-64px)]">
      
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TicketIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Meus ingressos</h1>
        </div>
        <p className="text-gray-500 text-sm">
          {typedTickets.length} ingresso(s) em {allGroups.length} evento(s)
        </p>
      </div>

      {typedTickets.length === 0 ? (
        // Estado vazio
        <div className="py-20 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <TicketX className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">
            Nenhum ingresso ainda
          </h2>
          <p className="text-gray-500 mt-2 text-center max-w-sm mx-auto">
            Seus ingressos aparecerão aqui após a confirmação do pagamento.
          </p>
          <Link 
            href="/"
            className="inline-block bg-primary text-white font-medium rounded-xl px-6 py-3 mt-6 hover:bg-primary-hover transition-colors"
          >
            Explorar eventos
          </Link>
        </div>
      ) : (
        <>
          {/* Próximos eventos */}
          {proximosEventos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Próximos eventos
              </h2>
              {proximosEventos.map(group => (
                <EventTicketGroup 
                  key={group.event_id} 
                  eventGroup={group} 
                />
              ))}
            </div>
          )}

          {/* Divisor condicional */}
          {proximosEventos.length > 0 && eventosPassados.length > 0 && (
            <div className="border-t border-gray-200 my-8" />
          )}

          {/* Eventos passados */}
          {eventosPassados.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">
                Eventos passados
              </h2>
              {eventosPassados.map(group => (
                <EventTicketGroup 
                  key={group.event_id} 
                  eventGroup={group} 
                  isPast={true} 
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
