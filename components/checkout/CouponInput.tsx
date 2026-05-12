'use client'

import { useState } from 'react'
import { Tag, X, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import type { AppliedCoupon } from '@/types'
import { toast } from 'sonner'

interface CouponInputProps {
  orderId: string
  eventId: string
  subtotal: number
  appliedCoupon: AppliedCoupon | null
  onCouponApplied: (result: AppliedCoupon) => void
  onCouponRemoved: () => void
}

export default function CouponInput({
  orderId,
  eventId,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
}: CouponInputProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleApply = async () => {
    if (code.trim().length < 2) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), orderId, eventId }),
      })
      const data = await res.json()

      if (data.success) {
        onCouponApplied({
          code: code.trim().toUpperCase(),
          discount_amount: data.discount_amount,
          new_total: data.new_total,
        })
        setCode('')
        setIsExpanded(false)
        toast.success('Cupom aplicado!', {
          description: `Desconto de ${formatCurrency(data.discount_amount)} aplicado.`,
        })
      } else {
        setError(data.error ?? 'Cupom inválido.')
      }
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/coupons/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.success) {
        onCouponRemoved()
        toast.info('Cupom removido.')
      }
    } catch {
      toast.error('Erro ao remover cupom.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Cupom aplicado ──────────────────────────────────────────────────────────
  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="w-[18px] h-[18px] text-green-600 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-800 text-sm">Cupom aplicado</span>
                <span className="bg-green-100 text-green-800 font-mono text-xs rounded px-2 py-0.5">
                  {appliedCoupon.code}
                </span>
              </div>
              <p className="text-xs text-green-700 mt-0.5">
                Desconto de {formatCurrency(appliedCoupon.discount_amount)}
              </p>
            </div>
          </div>

          <button
            onClick={handleRemove}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-green-700 hover:text-red-500 transition-colors disabled:opacity-50 ml-2 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-[14px] h-[14px]" />
            )}
            <span>Remover</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Sem cupom ───────────────────────────────────────────────────────────────
  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors w-fit"
      >
        <Tag className="w-4 h-4" />
        <span>Tenho um cupom de desconto</span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder="SEUCUPOM"
              maxLength={20}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              style={{ textTransform: 'uppercase' }}
            />
            <button
              onClick={handleApply}
              disabled={code.trim().length < 2 || isLoading}
              className="bg-primary text-white rounded-xl px-5 py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Aplicar'
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-[14px] h-[14px] text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
