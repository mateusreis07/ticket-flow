import { TopEvent } from '@/types'
import { formatCurrency } from '@/lib/utils/format'

interface TopEventsListProps {
  events: TopEvent[]
}

export function TopEventsList({ events }: TopEventsListProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
      <div>
        <h3 className="font-semibold text-gray-900">Top eventos</h3>
        <p className="text-xs text-gray-400 mt-0.5">Por ingressos vendidos</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-8">
          Nenhum evento com vendas ainda
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((event, index) => {
            let rankClass = "bg-gray-50 text-gray-500"
            if (index === 0) rankClass = "bg-amber-100 text-amber-700"
            else if (index === 1) rankClass = "bg-gray-100 text-gray-600"
            else if (index === 2) rankClass = "bg-orange-100 text-orange-700"

            return (
              <div key={event.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankClass}`}>
                  {index + 1}º
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate" title={event.title}>
                    {event.title}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {event.tickets_sold} / {event.tickets_total} ingressos
                  </p>
                </div>
                
                <div className="text-sm font-semibold text-primary text-right shrink-0">
                  {formatCurrency(event.revenue)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
