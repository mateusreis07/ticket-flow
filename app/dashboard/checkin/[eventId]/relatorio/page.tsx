import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Users, CheckCircle2, Ticket, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function CheckinReportPage({ params }: { params: { eventId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { eventId } = params

  // 1. Fetch Event Overview
  const { data: overview, error } = await supabase
    .from('checkin_overview')
    .select('*')
    .eq('event_id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (error || !overview) notFound()

  // 2. Fetch Sessions
  const { data: sessions } = await supabase
    .from('checkin_sessions')
    .select('*')
    .eq('event_id', eventId)
    .order('started_at', { ascending: false })

  // 3. Ticket Types Distribution
  const { data: distributionData } = await supabase
    .from('tickets')
    .select(`
      is_used,
      ticket_types ( name )
    `)
    .eq('event_id', eventId)

  const distributionMap = new Map()
  if (distributionData) {
    distributionData.forEach((t: any) => {
      const typeName = t.ticket_types?.name || 'Geral'
      if (!distributionMap.has(typeName)) {
        distributionMap.set(typeName, { total: 0, checked_in: 0 })
      }
      const data = distributionMap.get(typeName)
      data.total++
      if (t.is_used) data.checked_in++
    })
  }

  const distribution = Array.from(distributionMap.entries()).map(([name, stats]) => ({
    ticket_type_name: name,
    ...stats
  }))

  const noShows = overview.total_tickets - overview.checked_in_count

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/checkin" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar para Eventos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Check-in</h1>
        <p className="text-gray-500 mt-1">{overview.event_title}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Ingressos Vendidos</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.total_tickets}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Check-ins Realizados</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.checked_in_count}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-light/50 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-gray-500">Taxa de Presença</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.checkin_percentage}%</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">No-shows</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{noShows}</p>
        </div>
      </div>

      {/* Tipo de Ingresso */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Distribuição por Tipo de Ingresso</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Tipo de Ingresso</th>
                <th className="px-6 py-3 text-right">Vendidos</th>
                <th className="px-6 py-3 text-right">Check-ins</th>
                <th className="px-6 py-3 text-right">Presença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {distribution.map((dist, i) => {
                const perc = dist.total > 0 ? Math.round((dist.checked_in / dist.total) * 100) : 0
                return (
                  <tr key={i}>
                    <td className="px-6 py-4 font-medium text-gray-900">{dist.ticket_type_name}</td>
                    <td className="px-6 py-4 text-right">{dist.total}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">{dist.checked_in}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                        {perc}%
                      </span>
                    </td>
                  </tr>
                )
              })}
              {distribution.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhum ingresso encontrado para este evento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sessões */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Sessões de Validação (Dispositivos)</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sessions?.map(session => (
            <div key={session.id} className="p-5 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 text-sm">{session.device_info || 'Dispositivo Desconhecido'}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>Início: {format(new Date(session.started_at), "dd/MM/yy HH:mm")}</span>
                  {session.ended_at && (
                    <span>Fim: {format(new Date(session.ended_at), "HH:mm")}</span>
                  )}
                  {session.is_active && (
                    <span className="text-green-600 font-medium">Sessão Ativa</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{session.total_checkins}</p>
                <p className="text-xs text-gray-500">validações</p>
              </div>
            </div>
          ))}
          {(!sessions || sessions.length === 0) && (
            <div className="p-8 text-center text-gray-500 text-sm">
              Nenhuma sessão de check-in registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
