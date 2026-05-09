import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ChevronLeft, Ticket, Users, Clock } from 'lucide-react'

import { redirect } from 'next/navigation'

export default async function ScannerResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get tickets used today for the organizer's events
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data: tickets, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      used_at,
      ticket_types ( name ),
      profiles!buyer_id ( name ),
      events!inner ( title, organizer_id )
    `)
    .eq('events.organizer_id', user.id)
    .eq('is_used', true)
    .gte('used_at', todayISO)
    .order('used_at', { ascending: false })

  const validTickets = (tickets || []) as any[]

  // Calculate metrics
  const totalValidated = validTickets.length
  
  const typeDistribution: Record<string, number> = {}
  validTickets.forEach(t => {
    const typeName = Array.isArray(t.ticket_types) ? t.ticket_types[0]?.name : t.ticket_types?.name
    if (typeName) {
      typeDistribution[typeName] = (typeDistribution[typeName] || 0) + 1
    }
  })

  let firstScan = '--:--'
  let lastScan = '--:--'

  if (totalValidated > 0) {
    // The query is ordered descending by used_at
    const lastScanDate = new Date(validTickets[0].used_at!)
    const firstScanDate = new Date(validTickets[validTickets.length - 1].used_at!)
    
    lastScan = lastScanDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    firstScan = firstScanDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Header */}
        <Link href="/dashboard/scanner" className="inline-flex items-center gap-1 text-primary font-medium hover:underline mb-6">
          <ChevronLeft className="h-4 w-4" /> Voltar ao scanner
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resumo do dia</h1>
          <p className="text-gray-500 mt-1 capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalValidated}</p>
            <p className="text-gray-500 text-sm mt-1">Entradas validadas</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Ticket className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-gray-900 font-medium text-sm flex-1 flex flex-col justify-center">
              {Object.keys(typeDistribution).length === 0 ? (
                <span className="text-gray-400">Nenhum dado</span>
              ) : (
                Object.entries(typeDistribution).map(([name, count]) => (
                  <span key={name} className="block">{count}x {name}</span>
                ))
              )}
            </p>
            <p className="text-gray-500 text-sm mt-2 pt-2 border-t border-gray-100 w-full">Por tipo de ingresso</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex justify-between w-full text-sm font-medium text-gray-900 flex-1 items-center">
              <div className="text-center w-full">
                <span className="text-gray-400 text-xs block mb-1">Primeiro</span>
                {firstScan}
              </div>
              <div className="w-px h-8 bg-gray-200 mx-2"></div>
              <div className="text-center w-full">
                <span className="text-gray-400 text-xs block mb-1">Último</span>
                {lastScan}
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2 pt-2 border-t border-gray-100 w-full">Horários</p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-10 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Histórico completo de hoje</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Horário</th>
                  <th className="px-6 py-3 font-medium">Comprador</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {validTickets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma entrada validada hoje.
                    </td>
                  </tr>
                ) : (
                  validTickets.map((ticket, index) => {
                    const typeName = Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0]?.name : ticket.ticket_types?.name
                    const buyerName = Array.isArray(ticket.profiles) ? ticket.profiles[0]?.name : ticket.profiles?.name
                    const eventTitle = Array.isArray(ticket.events) ? ticket.events[0]?.title : ticket.events?.title
                    const usedAt = new Date(ticket.used_at!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{usedAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{buyerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {typeName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 truncate max-w-[200px]" title={eventTitle}>
                          {eventTitle}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Link 
          href="/dashboard/scanner" 
          className="block w-full bg-primary text-white text-center rounded-xl py-3 mt-8 font-semibold hover:bg-primary-hover transition-colors shadow-sm"
        >
          Voltar ao scanner
        </Link>
        
      </div>
    </div>
  )
}
