import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Ticket as TicketIcon, TicketX } from 'lucide-react'
import { TicketWithDetails } from '@/types'
import { EventTicketGroup, EventGroup } from '@/components/tickets/EventTicketGroup'
import PushManager from '@/components/notifications/PushManager'

export const dynamic = 'force-dynamic'

export default async function MeusIngressosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/meus-ingressos')
  }

  const { data: tickets } = await supabase
    .from('tickets_with_details')
    .select('*')
    .eq('buyer_id', user.id)
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })

  const orderIds = Array.from(new Set((tickets || []).map(t => t.order_id)))
  const { data: orders } = await supabase.from('orders').select('id, status').in('id', orderIds)
  const orderMap = new Map((orders || []).map(o => [o.id, o.status]))

  const typedTickets = (tickets || []).map(t => ({
    ...t,
    order_status: orderMap.get(t.order_id)
  })) as TicketWithDetails[]

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
        tickets: [],
      })
    }
    groupedEvents.get(ticket.event_id)!.tickets.push(ticket)
  })

  const allGroups = Array.from(groupedEvents.values())
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const proximosEventos = allGroups
    .filter(g => new Date(g.event_date) >= today)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  const eventosPassados = allGroups
    .filter(g => new Date(g.event_date) < today)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-[calc(100vh-64px)]">

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <TicketIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Meus ingressos</h1>
        </div>
        <p className="text-gray-500 text-sm">
          {typedTickets.length} ingresso(s) em {allGroups.length} evento(s)
        </p>
      </div>

      {/* Card de notificações push */}
      <div className="mb-8">
        <PushManager userId={user.id} />
      </div>

      {typedTickets.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <TicketX className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Nenhum ingresso ainda</h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
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
          {proximosEventos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos eventos</h2>
              {proximosEventos.map(group => (
                <EventTicketGroup key={group.event_id} eventGroup={group} />
              ))}
            </div>
          )}

          {proximosEventos.length > 0 && eventosPassados.length > 0 && (
            <div className="border-t border-gray-200 my-8" />
          )}

          {eventosPassados.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">Eventos passados</h2>
              {eventosPassados.map(group => (
                <EventTicketGroup key={group.event_id} eventGroup={group} isPast={true} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
