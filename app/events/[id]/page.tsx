import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, MapPin, Clock, XCircle, BadgeCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import TicketSelectorManager from '@/components/events/TicketSelectorManager'
import EventStructuredData from '@/components/seo/EventStructuredData'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', params.id).single()
  
  if (!event) return { title: 'Evento não encontrado — TicketFlow' }

  return {
    title: `${event.title} — TicketFlow`,
    description: event.description?.substring(0, 150) || 'Compre seu ingresso no TicketFlow',
    openGraph: {
      title: event.title,
      description: event.description?.substring(0, 150),
      images: event.cover_image_url ? [event.cover_image_url] : [],
    }
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: event } = await supabaseAdmin
    .from('events')
    .select(`
      *,
      profiles ( name, username, avatar_url, is_verified )
    `)
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const { data: ticketTypes } = await supabaseAdmin
    .from('ticket_types')
    .select('*')
    .eq('event_id', params.id)
    .eq('is_active', true)
    .order('price', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const activeTickets = ticketTypes || []
  const prices = activeTickets.map(t => t.price)
  const min_price = prices.length > 0 ? Math.min(...prices) : 0
  const total_sold = activeTickets.reduce((acc, t) => acc + (t.quantity_sold || 0), 0)
  const total_capacity = activeTickets.reduce((acc, t) => acc + (t.quantity_total || 0), 0)

  const eventDataForSeo = {
    ...event,
    organizer_name: event.profiles?.name || 'Organizador',
    min_price,
    total_sold,
    total_capacity
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        
        <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-3xl overflow-hidden shadow-sm bg-gray-900">
          {event.cover_image_url ? (
            <Image src={event.cover_image_url} alt={event.title} fill className="object-cover opacity-90" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-800" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Em breve
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight max-w-4xl">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 md:gap-8 text-white/90 text-sm md:text-base font-medium">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary-light" />
                <span className="capitalize">{formatDate(event.event_date, "EEEE, dd 'de' MMMM 'de' yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-light" />
                <span>{event.event_time.substring(0, 5)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sobre o evento</h2>
              <div className="prose prose-gray max-w-none">
                {event.description ? (
                  <p className="whitespace-pre-line text-gray-600 leading-relaxed text-lg">
                    {event.description}
                  </p>
                ) : (
                  <p className="italic text-gray-400">Nenhuma descrição fornecida para este evento.</p>
                )}
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Local e data</h2>
              
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-6">
                <div className="flex gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm h-12 w-12 flex items-center justify-center shrink-0">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">Data e hora</h3>
                    <p className="text-gray-600 capitalize">
                      {formatDate(event.event_date, "EEEE, dd 'de' MMMM 'de' yyyy")} às {event.event_time.substring(0, 5)}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200" />
                
                <div className="flex gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm h-12 w-12 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{event.location}</h3>
                    <p className="text-gray-600">
                      {event.city}, {event.state}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <p className="text-sm text-primary font-bold uppercase tracking-wider mb-4">Organizador</p>
              
              {event.profiles?.username ? (
                <Link href={`/organizadores/${event.profiles.username}`} className="flex items-center gap-4 group">
                  <div className="h-14 w-14 rounded-2xl bg-primary-light flex items-center justify-center overflow-hidden border border-gray-100 shrink-0 relative transition-transform group-hover:scale-105">
                    {event.profiles.avatar_url ? (
                      <Image src={event.profiles.avatar_url} alt={event.profiles.name} fill className="object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-xl">{event.profiles.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      {event.profiles.name}
                      {event.profiles.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                    </h3>
                    <p className="text-sm text-primary hover:underline mt-0.5">Ver perfil do organizador</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary-light flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                    <span className="text-primary font-bold text-xl">{event.profiles?.name?.substring(0, 2).toUpperCase() || 'OG'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{event.profiles?.name || 'Não informado'}</h3>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Ingressos disponíveis</h2>
              
              {event.status === 'cancelled' ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-700 font-bold text-lg">Este evento foi cancelado</p>
                  <p className="text-red-600/80 text-sm mt-1">Não é possível comprar ingressos.</p>
                </div>
              ) : (
                <TicketSelectorManager 
                  ticketTypes={ticketTypes || []} 
                  eventId={event.id} 
                  isLoggedIn={isLoggedIn} 
                />
              )}
            </div>
          </div>

        </div>
      </div>
      <EventStructuredData event={eventDataForSeo as any} />
    </div>
  )
}
