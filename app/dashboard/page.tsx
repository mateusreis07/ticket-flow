import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DollarSign, Ticket, CalendarCheck, CalendarDays } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { TopEventsList } from '@/components/dashboard/TopEventsList'
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable'
import { getOverviewMetrics, getSalesOverTime, getTopEvents, getRecentOrders } from '@/lib/queries/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Obter profile para o nome
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const organizerId = user.id

  // Executar queries do dashboard em paralelo
  const [metrics, salesData, topEvents, recentOrders] = await Promise.all([
    getOverviewMetrics(organizerId),
    getSalesOverTime(organizerId, 7),
    getTopEvents(organizerId),
    getRecentOrders(organizerId, 5)
  ])

  const todayStr = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }).format(new Date())

  const totalRevenue7Days = salesData.reduce((acc, curr) => acc + curr.revenue, 0)

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Olá, {profile?.name?.split(' ')[0] || 'Organizador'}. Aqui está o resumo dos seus eventos.
          </p>
        </div>
        <div className="text-sm text-gray-400 capitalize">
          {todayStr}
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          label="Receita total"
          value={formatCurrency(metrics.totalRevenue)}
          sublabel="de pedidos confirmados"
        />
        <MetricCard
          icon={Ticket}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Ingressos vendidos"
          value={metrics.totalTicketsSold.toString()}
          sublabel="em todos os eventos"
        />
        <MetricCard
          icon={CalendarCheck}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Eventos ativos"
          value={metrics.publishedEvents.toString()}
          sublabel={`${metrics.totalEvents} eventos no total`}
        />
        <MetricCard
          icon={CalendarDays}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Próximo evento"
          value={metrics.nextEvent ? (metrics.nextEvent.title.length > 20 ? metrics.nextEvent.title.substring(0, 20) + '...' : metrics.nextEvent.title) : "Nenhum agendado"}
          sublabel={metrics.nextEvent ? `${formatDate(metrics.nextEvent.event_date, "dd/MM/yyyy")} • ${metrics.nextEvent.city}` : "Crie um evento para começar"}
        />
      </div>

      {/* Seção de gráfico + tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={salesData} totalRevenue={totalRevenue7Days} />
        </div>
        <div className="lg:col-span-1">
          <TopEventsList events={topEvents} />
        </div>
      </div>

      {/* Seção de pedidos recentes */}
      <div>
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  )
}
