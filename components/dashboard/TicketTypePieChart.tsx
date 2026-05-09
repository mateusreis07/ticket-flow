'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

interface TicketTypeData {
  name: string
  price: number
  quantity_sold: number
  quantity_total: number
  revenue: number
}

interface TicketTypePieChartProps {
  data: TicketTypeData[]
}

const COLORS = ['#7C3AED', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6']

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-1">{data.name}</p>
        <p className="text-xs text-gray-500">
          Vendas: {data.quantity_sold}
        </p>
        <p className="text-xs text-primary font-medium mt-1">
          Receita: {formatCurrency(data.revenue)}
        </p>
      </div>
    )
  }
  return null
}

export function TicketTypePieChart({ data }: TicketTypePieChartProps) {
  // Filtrar apenas ingressos que venderam algo
  const chartData = data.filter(d => d.quantity_sold > 0)

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-gray-400">Sem dados de vendas suficientes para o gráfico</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
      <h3 className="font-semibold text-gray-900 mb-6">Proporção de vendas</h3>
      
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="quantity_sold"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
