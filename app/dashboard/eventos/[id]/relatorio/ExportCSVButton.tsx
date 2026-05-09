'use client'

import { Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface Order {
  id: string
  buyer_name: string
  buyer_email: string
  ticket_types: string
  total_amount: number
  created_at: string
  status: string
}

interface ExportCSVButtonProps {
  orders: Order[]
  eventName: string
}

export function ExportCSVButton({ orders, eventName }: ExportCSVButtonProps) {
  const exportToCSV = () => {
    // Definir cabeçalho
    const headers = ['Nome', 'E-mail', 'Tipos de ingresso', 'Valor pago', 'Data da compra', 'Status']
    
    // Converter linhas
    const rows = orders.map(order => [
      `"${order.buyer_name.replace(/"/g, '""')}"`,
      `"${order.buyer_email.replace(/"/g, '""')}"`,
      `"${order.ticket_types.replace(/"/g, '""')}"`,
      `"${formatCurrency(order.total_amount)}"`,
      `"${formatDate(order.created_at, 'dd/MM/yyyy HH:mm')}"`,
      `"${order.status === 'paid' ? 'Pago' : order.status === 'pending' ? 'Pendente' : order.status === 'cancelled' ? 'Cancelado' : 'Reembolsado'}"`
    ])
    
    // Unir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n')

    // Criar blob e link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Formatar nome do arquivo
    const safeEventName = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    link.setAttribute('href', url)
    link.setAttribute('download', `${safeEventName}-compradores.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
      onClick={exportToCSV}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </button>
  )
}
