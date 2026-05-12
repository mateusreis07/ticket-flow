'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, RefreshCw } from 'lucide-react'
import { createCoupon, updateCoupon } from '@/lib/actions/coupons'
import { toast } from 'sonner'
import type { Coupon } from '@/types'

interface CouponFormModalProps {
  isOpen: boolean
  onClose: () => void
  coupon?: Coupon | null
  events: { id: string; title: string }[]
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function CouponFormModal({
  isOpen,
  onClose,
  coupon,
  events,
}: CouponFormModalProps) {
  const isEdit = !!coupon
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState('0')
  const [maxUses, setMaxUses] = useState('')
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1')
  const [isActive, setIsActive] = useState(true)
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [appliesTo, setAppliesTo] = useState<'all' | 'specific_event' | 'specific_ticket_type'>('all')
  const [eventId, setEventId] = useState('')

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code)
      setDescription(coupon.description ?? '')
      setDiscountType(coupon.discount_type)
      setDiscountValue(String(coupon.discount_value))
      setMaxDiscountAmount(coupon.max_discount_amount ? String(coupon.max_discount_amount) : '')
      setMinOrderAmount(String(coupon.min_order_amount ?? 0))
      setMaxUses(coupon.max_uses ? String(coupon.max_uses) : '')
      setMaxUsesPerUser(String(coupon.max_uses_per_user ?? 1))
      setIsActive(coupon.is_active)
      setValidFrom(coupon.valid_from ? coupon.valid_from.slice(0, 16) : '')
      setValidUntil(coupon.valid_until ? coupon.valid_until.slice(0, 16) : '')
      setAppliesTo(coupon.applies_to)
      setEventId(coupon.event_id ?? '')
    } else {
      setCode('')
      setDescription('')
      setDiscountType('percentage')
      setDiscountValue('')
      setMaxDiscountAmount('')
      setMinOrderAmount('0')
      setMaxUses('')
      setMaxUsesPerUser('1')
      setIsActive(true)
      setValidFrom('')
      setValidUntil('')
      setAppliesTo('all')
      setEventId('')
    }
    setError(null)
  }, [coupon, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('code', code.toUpperCase())
    formData.set('description', description)
    formData.set('discount_type', discountType)
    formData.set('discount_value', discountValue)
    formData.set('max_discount_amount', maxDiscountAmount)
    formData.set('min_order_amount', minOrderAmount)
    formData.set('max_uses', maxUses)
    formData.set('max_uses_per_user', maxUsesPerUser)
    formData.set('is_active', String(isActive))
    formData.set('valid_from', validFrom)
    formData.set('valid_until', validUntil)
    formData.set('applies_to', appliesTo)
    formData.set('event_id', eventId)

    const result = isEdit
      ? await updateCoupon(coupon!.id, formData)
      : await createCoupon(formData)

    if (result.success) {
      toast.success(isEdit ? 'Cupom atualizado!' : 'Cupom criado com sucesso!')
      onClose()
    } else {
      setError(result.error ?? 'Erro ao salvar cupom.')
    }

    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Editar cupom' : 'Criar cupom'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Código do cupom <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="EX: BEMVINDO10"
                maxLength={20}
                required
                className="flex-1 font-mono border border-gray-300 rounded-xl px-4 py-2.5 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setCode(generateCode())}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                title="Gerar código aleatório"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Gerar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">O código é case-insensitive para o comprador.</p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descrição interna <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Cupom de boas-vindas para novos usuários"
              maxLength={100}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Tipo de desconto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de desconto <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-xl border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setDiscountType('percentage')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  discountType === 'percentage'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                % Percentual
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-gray-300 ${
                  discountType === 'fixed'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                R$ Valor fixo
              </button>
            </div>
          </div>

          {/* Valor do desconto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {discountType === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {discountType === 'percentage' ? '%' : 'R$'}
                </span>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min={0.01}
                  max={discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Desconto máximo (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    min={0.01}
                    step="0.01"
                    placeholder="Sem limite"
                    className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Pedido mínimo (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  min={0}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Limites de uso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Limites de uso</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total de usos</label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  min={1}
                  step={1}
                  placeholder="Ilimitado"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Máximo por usuário</label>
                <input
                  type="number"
                  value={maxUsesPerUser}
                  onChange={(e) => setMaxUsesPerUser(e.target.value)}
                  min={1}
                  step={1}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Validade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Validade</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Válido a partir de</label>
                <input
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Válido até</label>
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  placeholder="Sem expiração"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Aplicação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Este cupom se aplica a
            </label>
            <select
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value as typeof appliesTo)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
            >
              <option value="all">Todos os meus eventos</option>
              <option value="specific_event">Um evento específico</option>
            </select>

            {appliesTo === 'specific_event' && (
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white mt-2"
              >
                <option value="">Selecione um evento</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Toggle ativo */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">Cupom ativo</p>
              <p className="text-xs text-gray-500">Compradores podem usar este cupom</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isActive ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEdit ? 'Atualizar cupom' : 'Criar cupom'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
