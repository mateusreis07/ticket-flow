import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { RecentOrder } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface RecentOrdersTableProps {
  orders: RecentOrder[]
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Pedidos recentes</h3>
        {/* Futuro link para página de pedidos */}
        <span className="text-sm text-primary hover:text-primary-hover font-medium cursor-pointer">
          Ver todos
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">Nenhum pedido ainda</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Comprador</th>
                <th className="px-6 py-3">Evento</th>
                <th className="px-6 py-3 text-center">Ingressos</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
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
                    <td className="px-6 py-4">
                      <div className="text-gray-600 truncate max-w-[160px]" title={order.event_title}>
                        {order.event_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-600">{order.tickets_count}x</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {statusBadge}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-500">{formatDate(order.created_at, "dd/MM/yyyy")}</div>
                      <div className="text-xs text-gray-400">{formatDate(order.created_at, "HH:mm")}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
