'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/format'
import { Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react'

export default function TicketSelectorManager({ ticketTypes, eventId, isLoggedIn }: any) {
  const router = useRouter()
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const handleQuantityChange = (ticketId: string, delta: number, max: number) => {
    setSelections(prev => {
      const current = prev[ticketId] || 0
      const next = Math.max(0, Math.min(max, current + delta))
      
      const updated = { ...prev }
      if (next === 0) {
        delete updated[ticketId]
      } else {
        updated[ticketId] = next
      }
      return updated
    })
  }

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/events/${eventId}`)
      return
    }

    const items = Object.entries(selections).map(([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity
    }))

    if (items.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, items })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar pedido')
      }

      alert('Pedido criado com sucesso! Redirecionando para pagamento...')
      router.push(`/checkout/${data.orderId}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = Object.values(selections).reduce((acc, curr) => acc + curr, 0)
  const totalAmount = Object.entries(selections).reduce((acc, [id, qty]) => {
    const tt = ticketTypes.find((t: any) => t.id === id)
    return acc + (tt?.price || 0) * qty
  }, 0)

  if (!ticketTypes || ticketTypes.length === 0) {
    return <p className="text-gray-500 text-center py-4">Nenhum ingresso à venda ainda.</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ticketTypes.map((tt: any) => {
          const available = tt.quantity_total - (tt.quantity_sold || 0)
          const isSoldOut = available <= 0
          const currentSelection = selections[tt.id] || 0

          return (
            <div 
              key={tt.id} 
              className={`border rounded-2xl p-5 transition-colors ${
                isSoldOut ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-200 bg-white hover:border-primary/30'
              } ${currentSelection > 0 ? 'border-primary shadow-sm bg-primary-light/10' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{tt.name}</h3>
                  {tt.description && <p className="text-sm text-gray-500 mt-1">{tt.description}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  {tt.price === 0 ? (
                    <span className="font-bold text-green-600 text-lg">Gratuito</span>
                  ) : (
                    <span className="font-bold text-primary text-xl">{formatCurrency(tt.price)}</span>
                  )}
                </div>
              </div>

              {isSoldOut ? (
                <div className="inline-flex items-center px-3 py-1 rounded-md bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider mt-2">
                  Esgotado
                </div>
              ) : (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                    {available} restantes
                  </span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleQuantityChange(tt.id, -1, available)}
                      disabled={currentSelection === 0}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary hover:bg-primary-light/50 disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-gray-900">{currentSelection}</span>
                    <button 
                      onClick={() => handleQuantityChange(tt.id, 1, Math.min(10, available))}
                      disabled={currentSelection >= Math.min(10, available)}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary hover:bg-primary-light/50 disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Resumo da compra</h3>
          <div className="space-y-2 mb-4">
            {Object.entries(selections).map(([id, qty]) => {
              const tt = ticketTypes.find((t: any) => t.id === id)
              if (!tt) return null
              return (
                <div key={id} className="flex justify-between text-sm text-gray-600">
                  <span>{qty}x {tt.name}</span>
                  <span className="font-medium">{formatCurrency(tt.price * qty)}</span>
                </div>
              )
            })}
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-black text-primary text-2xl">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}

      <button
        disabled={selectedCount === 0 || loading}
        onClick={handleCheckout}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
          selectedCount === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-primary text-white hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5'
        }`}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : selectedCount === 0 ? (
          'Selecione os ingressos'
        ) : !isLoggedIn ? (
          'Entre para comprar →'
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Ir para pagamento
          </>
        )}
      </button>
    </div>
  )
}
