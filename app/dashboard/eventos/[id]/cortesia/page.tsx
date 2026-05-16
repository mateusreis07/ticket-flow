import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, Users, Ticket, Mail, Clock, MoreVertical, Search, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CourtesyListModal } from '@/components/courtesy/CourtesyListModal'
import { CourtesyEntryModal } from '@/components/courtesy/CourtesyEntryModal'
import { ImportCSVModal } from '@/components/courtesy/ImportCSVModal'
import { CourtesyListsClient } from './CourtesyListsClient' // I'll split the client logic

export const metadata = {
  title: 'Cortesia e VIP | TicketFlow',
  description: 'Gerencie convidados especiais e ingressos gratuitos.',
}

export default async function CourtesyPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Buscar evento
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', params.id)
    .single()

  if (eventError || !event || event.organizer_id !== user.id) {
    redirect('/dashboard')
  }

  // 2. Buscar ticket_types
  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('id, name, price')
    .eq('event_id', event.id)
    .order('price', { ascending: true })

  // 3. Buscar listas com stats
  const { data: lists } = await supabase
    .from('courtesy_lists')
    .select(`
      *,
      stats:courtesy_stats!list_id (total_entries, total_tickets, sent_count, confirmed_count, pending_count, cancelled_count)
    `)
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  // Transform data
  const formattedLists = lists?.map(list => {
    // A view stat pode retornar array (se não tipada bem no join) ou objeto
    const stat = Array.isArray(list.stats) ? list.stats[0] : list.stats
    return {
      ...list,
      total_entries: stat?.total_entries || 0,
      total_tickets: stat?.total_tickets || 0,
      sent_count: stat?.sent_count || 0,
      confirmed_count: stat?.confirmed_count || 0,
      pending_count: stat?.pending_count || 0,
      cancelled_count: stat?.cancelled_count || 0,
    }
  }) || []

  // Calcular totais globais
  const totalConvidados = formattedLists.reduce((acc, curr) => acc + curr.total_entries, 0)
  const totalIngressos = formattedLists.reduce((acc, curr) => acc + curr.total_tickets, 0)
  const totalEmitidos = formattedLists.reduce((acc, curr) => acc + curr.sent_count + curr.confirmed_count, 0)
  const totalPendentes = formattedLists.reduce((acc, curr) => acc + curr.pending_count, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/eventos" className="hover:text-gray-900 transition-colors">Meus eventos</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/dashboard/eventos/${event.id}`} className="hover:text-gray-900 transition-colors truncate max-w-[200px]">
            {event.title}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Cortesia e VIP</span>
        </div>

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cortesia e VIP</h1>
            <p className="text-gray-500 mt-1">Gerencie convidados especiais do {event.title}</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 mb-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium">Convidados</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalConvidados}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 mb-2">
              <Ticket className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Ingressos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalIngressos}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 mb-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Emitidos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalEmitidos}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 mb-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalPendentes}</p>
          </div>
        </div>

        {/* Client Component for the complex accordion interaction */}
        <CourtesyListsClient 
          initialLists={formattedLists} 
          eventId={event.id} 
          ticketTypes={ticketTypes || []} 
        />

      </div>
    )
}
