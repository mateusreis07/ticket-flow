'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { toggleCoupon, deleteCoupon } from '@/lib/actions/coupons'
import CouponFormModal from '@/components/dashboard/CouponFormModal'
import { Plus, Tag, MoreVertical, Eye, Pencil, Power, Trash2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Coupon } from '@/types'
import { toast } from 'sonner'

interface CouponRow extends Coupon {
  event_title: string | null
  total_uses: number
}

interface CouponsClientProps {
  coupons: CouponRow[]
  events: { id: string; title: string }[]
}

function getCouponStatus(coupon: CouponRow): { label: string; color: string } {
  if (!coupon.is_active) return { label: 'Inativo', color: 'bg-gray-100 text-gray-500' }
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date())
    return { label: 'Expirado', color: 'bg-red-100 text-red-600' }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses)
    return { label: 'Esgotado', color: 'bg-amber-100 text-amber-600' }
  return { label: 'Ativo', color: 'bg-green-100 text-green-600' }
}

function DiscountBadge({ coupon }: { coupon: CouponRow }) {
  const value =
    coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% de desconto`
      : `${formatCurrency(coupon.discount_value)} de desconto`

  return (
    <div>
      <p className="text-sm font-medium text-gray-900">{value}</p>
      {coupon.max_discount_amount && (
        <p className="text-xs text-gray-400">até {formatCurrency(coupon.max_discount_amount)}</p>
      )}
    </div>
  )
}

function RowMenu({
  coupon,
  onEdit,
  onRefresh,
}: {
  coupon: CouponRow
  onEdit: (c: CouponRow) => void
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    setOpen(false)
    const res = await toggleCoupon(coupon.id, !coupon.is_active)
    if (res.success) {
      toast.success(coupon.is_active ? 'Cupom desativado.' : 'Cupom ativado.')
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Excluir o cupom "${coupon.code}"? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    setOpen(false)
    const res = await deleteCoupon(coupon.id)
    if (res.success) {
      toast.success('Cupom excluído.')
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
            <Link
              href={`/dashboard/cupons/${coupon.id}/usos`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <Eye className="w-4 h-4 text-gray-400" />
              Ver usos
            </Link>
            <button
              onClick={() => { setOpen(false); onEdit(coupon) }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
            >
              <Pencil className="w-4 h-4 text-gray-400" />
              Editar
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
            >
              <Power className="w-4 h-4 text-gray-400" />
              {coupon.is_active ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CouponsClient({ coupons, events }: CouponsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null)

  const handleEdit = (coupon: CouponRow) => {
    setEditingCoupon(coupon)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCoupon(null)
  }

  return (
    <>
      {/* Botão criar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary-hover transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Criar cupom
        </button>
      </div>

      {/* Tabela */}
      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">Nenhum cupom ainda</h3>
          <p className="text-sm text-gray-500 mb-5">
            Crie cupons de desconto para impulsionar as vendas dos seus eventos.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro cupom
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Desconto</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usos</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Validade</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon)
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Código */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-mono font-bold text-gray-900 text-sm tracking-wider">
                            {coupon.code}
                          </span>
                          {coupon.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                              {coupon.description}
                            </p>
                          )}
                          {coupon.event_title && (
                            <p className="text-xs text-primary mt-0.5 truncate max-w-[180px]">
                              📅 {coupon.event_title}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Desconto */}
                      <td className="px-5 py-4">
                        <DiscountBadge coupon={coupon} />
                      </td>

                      {/* Usos */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {coupon.used_count}
                            {coupon.max_uses !== null && (
                              <span className="text-gray-400 font-normal">
                                /{coupon.max_uses}
                              </span>
                            )}
                          </p>
                          {coupon.max_uses !== null && (
                            <div className="mt-1 h-1 w-20 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (coupon.used_count / coupon.max_uses) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Validade */}
                      <td className="px-5 py-4">
                        {coupon.valid_until ? (
                          <span className="text-sm text-gray-600">
                            {formatDate(coupon.valid_until, 'dd/MM/yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Sem expiração</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-4">
                        <RowMenu coupon={coupon} onEdit={handleEdit} onRefresh={() => {}} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de criação/edição */}
      <CouponFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        coupon={editingCoupon}
        events={events}
      />
    </>
  )
}
