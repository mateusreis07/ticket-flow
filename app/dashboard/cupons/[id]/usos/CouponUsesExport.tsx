'use client'

import { Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface CouponUsesExportProps {
  uses: any[]
  couponCode: string
}

export default function CouponUsesExport({ uses, couponCode }: CouponUsesExportProps) {
  const handleExport = () => {
    const headers = ['Comprador', 'E-mail', 'Evento', 'Desconto aplicado', 'Data de uso']
    const rows = uses.map((u) => [
      u.profiles?.name ?? '',
      u.profiles?.email ?? '',
      u.orders?.events?.title ?? '',
      formatCurrency(u.discount_applied),
      formatDate(u.used_at, "dd/MM/yyyy 'às' HH:mm"),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usos-cupom-${couponCode}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <Download className="w-4 h-4" />
      Exportar CSV
    </button>
  )
}
