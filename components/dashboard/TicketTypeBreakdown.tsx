import { formatCurrency } from '@/lib/utils/format'

interface TicketTypeData {
  name: string
  price: number
  quantity_sold: number
  quantity_total: number
  revenue: number
}

interface TicketTypeBreakdownProps {
  data: TicketTypeData[]
}

export function TicketTypeBreakdown({ data }: TicketTypeBreakdownProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-6">Vendas por tipo de ingresso</h3>
      
      <div className="space-y-5">
        {data.map((type, index) => {
          const percentage = type.quantity_total > 0 
            ? Math.round((type.quantity_sold / type.quantity_total) * 100) 
            : 0

          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm text-gray-900">{type.name}</span>
                <span className="text-sm text-gray-500">{formatCurrency(type.price)}</span>
              </div>
              
              <div className="bg-gray-100 h-2 rounded-full overflow-hidden w-full my-2">
                <div 
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                {type.quantity_sold} de {type.quantity_total} vendidos • {formatCurrency(type.revenue)}
              </div>
            </div>
          )
        })}

        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum tipo de ingresso cadastrado</p>
        )}
      </div>
    </div>
  )
}
