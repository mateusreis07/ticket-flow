import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, ChevronRight, BarChart3 } from 'lucide-react'
import { isToday, isFuture, parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function CheckinIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch events with checkin overview
  const { data: overview, error } = await supabase
    .from('checkin_overview')
    .select('*')
    .eq('organizer_id', user.id)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching checkin overview:', error)
  }

  // Filter only today or future events
  const todayOrFutureEvents = (overview || []).filter(e => {
    const date = parseISO(`${e.event_date}T00:00:00`)
    return isToday(date) || isFuture(date)
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Check-in de eventos</h1>
        <p className="text-gray-500 mt-1">Gerencie a entrada dos participantes e monitore as estatísticas de público em tempo real.</p>
      </div>

      {todayOrFutureEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum evento próximo</h3>
          <p className="text-gray-500 mb-4">Você não possui eventos programados para hoje ou para o futuro.</p>
          <Link href="/dashboard/eventos/novo" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            Criar Evento
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {todayOrFutureEvents.map((event) => {
            const date = parseISO(`${event.event_date}T00:00:00`)
            const eventIsToday = isToday(date)
            const percentage = event.checkin_percentage || 0
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

            return (
              <div key={event.event_id} className="relative group bg-white rounded-2xl border border-gray-200 hover:border-primary/30 hover:shadow-sm transition-all p-5 flex flex-col h-full">
                
                {/* Main Action Link (Overlays the whole card) */}
                <Link 
                  href={`/dashboard/checkin/${event.event_id}`} 
                  className="absolute inset-0 z-0"
                  aria-label={`Iniciar check-in para ${event.event_title}`}
                />

                <div className="relative z-10 flex items-start justify-between mb-4 pointer-events-none">
                  {/* Selo de Data */}
                  {eventIsToday ? (
                    <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                      HOJE
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 uppercase">
                      {dateStr}
                    </span>
                  )}

                  {/* Botão de Relatório (Com z-index maior e pointer-events-auto) */}
                  <Link 
                    href={`/dashboard/checkin/${event.event_id}/relatorio`}
                    className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all pointer-events-auto"
                    title="Ver relatório de check-in"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Link>
                </div>

                <div className="relative z-10 pointer-events-none flex flex-col h-full">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{event.event_title}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex-1">{event.event_time}</p>

                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                      <span>{event.checked_in_count || 0} de {event.total_tickets || 0} check-ins</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary rounded-full h-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className={`mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    eventIsToday 
                      ? 'bg-primary text-white group-hover:bg-primary-hover' 
                      : 'border border-gray-200 text-gray-700 group-hover:bg-gray-50'
                  }`}>
                    Iniciar check-in
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
