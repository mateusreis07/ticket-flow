'use client'

import { useState } from 'react'
import { SalesDataPoint } from '@/types'
import { formatCurrency } from '@/lib/utils/format'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesChartProps {
  data: SalesDataPoint[]
  totalRevenue: number
}

// Custom tooltip function matching Recharts types
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SalesDataPoint
    const [year, month, day] = data.date.split('-')
    const formattedDate = `${day}/${month}/${year}`

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-1">{formattedDate}</p>
        <p className="text-sm text-primary font-bold">
          {formatCurrency(data.revenue)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {data.orders} pedido{data.orders !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }
  return null
}

export function SalesChart({ data, totalRevenue }: SalesChartProps) {
  const [period, setPeriod] = useState<'7' | '30'>('7')

  // formatador de Y Axis
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`
    }
    return `R$ ${value}`
  }

  // formatador de X Axis
  const formatXAxis = (dateStr: string) => {
    const [, month, day] = dateStr.split('-')
    return `${day}/${month}`
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Receita dos últimos {period} dias</h3>
          <p className="text-2xl font-bold text-primary mt-1">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        
        {/* Futuro: os botões podem realmente trocar os dados passados como prop ou via nova chamada fetch */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
          <button
            onClick={() => setPeriod('7')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === '7' 
                ? 'bg-primary-light text-primary font-medium shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriod('30')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === '30' 
                ? 'bg-primary-light text-primary font-medium shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            30 dias
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              width={45}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#7C3AED" 
              strokeWidth={2}
              fill="url(#colorRevenue)" 
              activeDot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
