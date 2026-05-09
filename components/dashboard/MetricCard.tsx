import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  label: string
  value: string
  sublabel: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sublabel,
  trend
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`${iconBg} rounded-xl p-2`}>
          <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        </div>
      </div>
      
      <div className="text-2xl font-bold text-gray-900 truncate">
        {value}
      </div>
      
      <div className="text-xs text-gray-400 mt-1 truncate">
        {sublabel}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400">vs mês anterior</span>
        </div>
      )}
    </div>
  )
}
