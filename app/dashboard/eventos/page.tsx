import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Plus, CalendarX, Search } from 'lucide-react'
import Link from 'next/link'
import EventListItem from '@/components/dashboard/EventListItem'

export default async function EventsPage({ searchParams }: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const q = searchParams.search || ''
  const status = searchParams.status || 'all'

  let query = supabaseAdmin
    .from('events')
    .select('*, orders(status, order_items(quantity)), ticket_types(quantity_total)')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })
  
  if (q) query = query.ilike('title', `%${q}%`)
  if (status !== 'all') query = query.eq('status', status)

  const { data: rawEvents } = await query

  const events = (rawEvents || []).map((e: any) => {
    let total_sold = 0
    let total_capacity = 0
    
    if (e.ticket_types) {
      e.ticket_types.forEach((tt: any) => {
        total_capacity += Number(tt.quantity_total) || 0
      })
    }

    if (e.orders) {
      e.orders.forEach((o: any) => {
        if (o.status === 'paid') {
          if (o.order_items) {
            o.order_items.forEach((item: any) => {
              total_sold += Number(item.quantity) || 0
            })
          }
        }
      })
    }

    return {
      ...e,
      total_sold,
      total_capacity
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meus eventos</h1>
        <Link href="/dashboard/eventos/criar" className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-md">
          <Plus className="h-5 w-5" /> Criar evento
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <form className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input name="search" defaultValue={q} placeholder="Buscar eventos pelo título... (aperte Enter)" className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
          </div>
          <select name="status" defaultValue={status} className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
            <option value="all">Todos os status</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <button type="submit" className="bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Filtrar
          </button>
        </form>
      </div>

      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {events.map(event => <EventListItem key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="text-center py-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <CalendarX className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Nenhum evento encontrado</h2>
          <p className="text-gray-500 mt-2">Tente ajustar seus filtros ou crie um novo evento.</p>
          {!q && status === 'all' && (
            <Link href="/dashboard/eventos/criar" className="mt-6 inline-block bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all">
              Criar meu primeiro evento
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
