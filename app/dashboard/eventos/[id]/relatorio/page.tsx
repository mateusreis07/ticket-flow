import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Download } from 'lucide-react'
import { getEventDetails } from '@/lib/queries/dashboard'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { TicketTypeBreakdown } from '@/components/dashboard/TicketTypeBreakdown'
import { TicketTypePieChart } from '@/components/dashboard/TicketTypePieChart'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ExportCSVButton } from './ExportCSVButton' // Precisarei criar esse componente client isolado para usar onClick

export default async function EventReportPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const organizerId = user.id
  const eventId = params.id

  const details = await getEventDetails(eventId, organizerId)

  if (!details) {
    notFound()
  }

  const { event, ticketTypes, salesData, recentOrders } = details

  const totalTicketsCapacity = ticketTypes.reduce((acc: number, curr: any) => acc + curr.quantity_total, 0)
  const remainingCapacity = totalTicketsCapacity - event.total_tickets_sold
  const paidOrdersCount = recentOrders.filter((o: any) => o.status === 'paid').length

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 gap-1 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/dashboard/eventos" className="hover:text-gray-900 transition-colors">Meus eventos</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{event.title}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Relatório</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              event.status === 'published' ? 'bg-green-100 text-green-700' :
              event.status === 'draft' ? 'bg-gray-100 text-gray-600' :
              'bg-red-100 text-red-600'
            }`}>
              {event.status === 'published' ? 'Publicado' : event.status === 'draft' ? 'Rascunho' : 'Cancelado'}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(event.event_date, "dd 'de' MMMM 'de' yyyy")} • {event.city}/{event.state}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportCSVButton 
            orders={recentOrders} 
            eventName={event.title} 
          />
          <Link 
            href={`/dashboard/eventos/${event.id}/editar`}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Editar evento
          </Link>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Receita total</p>
          <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(event.revenue || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Ingressos vendidos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{event.total_tickets_sold || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Capacidade restante</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{remainingCapacity || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pedidos confirmados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{paidOrdersCount || 0}</p>
        </div>
      </div>

      {/* Gráfico de Vendas */}
      <div className="mt-8">
        <SalesChart data={salesData} totalRevenue={salesData.reduce((acc: number, curr: any) => acc + curr.revenue, 0)} />
      </div>

      {/* Distribuição por tipo de ingresso */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <TicketTypeBreakdown data={ticketTypes} />
        <TicketTypePieChart data={ticketTypes} />
      </div>

      {/* Lista de compradores */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Lista de compradores</h3>
          <span className="text-sm text-gray-500">{recentOrders.length} pedidos</span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Nenhum pedido encontrado para este evento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Comprador</th>
                  <th className="px-6 py-3">Ingressos comprados</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order: any) => {
                  let statusBadge = null
                  switch (order.status) {
                    case 'paid':
                      statusBadge = <span className="bg-green-100 text-green-700 rounded-full px-2.5 py-1 text-xs font-medium">Pago</span>
                      break
                    case 'pending':
                      statusBadge = <span className="bg-amber-100 text-amber-700 rounded-full px-2.5 py-1 text-xs font-medium">Pendente</span>
                      break
                    case 'cancelled':
                      statusBadge = <span className="bg-red-100 text-red-600 rounded-full px-2.5 py-1 text-xs font-medium">Cancelado</span>
                      break
                    case 'refunded':
                      statusBadge = <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 text-xs font-medium">Reembolsado</span>
                      break
                  }

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.buyer_name}</div>
                        <div className="text-xs text-gray-500">{order.buyer_email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate" title={order.ticket_types}>
                        {order.ticket_types}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-500">{formatDate(order.created_at, "dd/MM/yyyy")}</div>
                        <div className="text-xs text-gray-400">{formatDate(order.created_at, "HH:mm")}</div>
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
