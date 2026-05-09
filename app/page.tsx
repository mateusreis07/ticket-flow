import { supabaseAdmin } from '@/lib/supabase/admin'
import { Sparkles, Search, CalendarX } from 'lucide-react'
import EventCard from '@/components/events/EventCard'

export default async function Home() {
  // Fetch events with relations using admin client to bypass RLS
  const { data: rawEvents } = await supabaseAdmin
    .from('events')
    .select(`
      *,
      profiles ( name ),
      ticket_types ( price, quantity_sold, quantity_total, is_active )
    `)
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(12)

  // Format events to match EventCard props
  const events = rawEvents?.map(event => {
    const activeTickets = event.ticket_types?.filter((t: any) => t.is_active) || []
    
    let min_price = 0
    let max_price = 0
    let total_sold = 0
    let total_capacity = 0

    if (activeTickets.length > 0) {
      const prices = activeTickets.map((t: any) => t.price)
      min_price = Math.min(...prices)
      max_price = Math.max(...prices)
      total_sold = activeTickets.reduce((acc: number, t: any) => acc + (t.quantity_sold || 0), 0)
      total_capacity = activeTickets.reduce((acc: number, t: any) => acc + (t.quantity_total || 0), 0)
    }

    return {
      ...event,
      organizer_name: event.profiles?.name || 'Organizador',
      min_price,
      max_price,
      total_sold,
      total_capacity
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.08),transparent)] pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto text-center py-24 px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light/50 px-4 py-1.5 text-sm text-primary font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Descubra eventos perto de você
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="block text-gray-900">Os melhores eventos</span>
            <span className="block text-primary mt-2">da sua cidade</span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-xl mx-auto">
            Encontre shows, festivais, workshops e muito mais. Compre seu ingresso com segurança em minutos.
          </p>

          <div className="mt-10 max-w-lg mx-auto shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-200 flex items-center overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <div className="pl-5 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar eventos, artistas ou locais..." 
              className="flex-1 px-4 py-4 text-base outline-none bg-transparent"
            />
            <button className="bg-primary text-white px-8 py-4 font-semibold hover:bg-primary-hover transition-colors">
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 px-4 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Próximos eventos</h2>
              <p className="text-gray-500 mt-2">Eventos confirmados e com ingressos disponíveis</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-full px-5 py-2 text-sm font-medium border bg-primary text-white border-primary">
                Todos
              </button>
              {['Shows', 'Festivais', 'Workshops', 'Teatro'].map(cat => (
                <button key={cat} className="rounded-full px-5 py-2 text-sm font-medium border border-gray-200 text-gray-600 hover:border-primary/50 hover:bg-gray-50 transition-colors">
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center">
              <CalendarX className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum evento disponível no momento</h3>
              <p className="text-gray-500">Volte em breve para conferir as novidades</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
