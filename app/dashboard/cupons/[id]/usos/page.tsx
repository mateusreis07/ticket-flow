import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import { ChevronRight, ArrowLeft, Download } from 'lucide-react'
import CouponUsesExport from './CouponUsesExport'

export default async function CouponUsesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'organizer') redirect('/dashboard')

  // Buscar o cupom (verificando ownership)
  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('id', params.id)
    .eq('organizer_id', profile.id)
    .single()

  if (!coupon) notFound()

  // Buscar usos com detalhes
  const { data: uses } = await supabaseAdmin
    .from('coupon_uses')
    .select(`
      *,
      profiles ( name, email ),
      orders (
        total_amount,
        subtotal_amount,
        events ( title )
      )
    `)
    .eq('coupon_id', params.id)
    .order('used_at', { ascending: false })

  const totalDiscount = (uses ?? []).reduce(
    (sum: number, u: any) => sum + (u.discount_applied ?? 0),
    0
  )

  return (
    <div className="max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/dashboard/cupons" className="hover:text-gray-900 transition-colors">Cupons</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-mono font-bold text-gray-900">{coupon.code}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">Usos</span>
      </nav>

      {/* Voltar */}
      <Link
        href="/dashboard/cupons"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para cupons
      </Link>

      {/* Card do cupom */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Código</p>
          <p className="font-mono font-bold text-gray-900 text-lg tracking-wider">{coupon.code}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Desconto</p>
          <p className="font-semibold text-gray-900">
            {coupon.discount_type === 'percentage'
              ? `${coupon.discount_value}%`
              : formatCurrency(coupon.discount_value)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total de usos</p>
          <p className="font-semibold text-gray-900">
            {coupon.used_count}
            {coupon.max_uses ? `/${coupon.max_uses}` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Desconto total</p>
          <p className="font-semibold text-primary">{formatCurrency(totalDiscount)}</p>
        </div>
      </div>

      {/* Header + Export */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">
          Histórico de uso ({(uses ?? []).length})
        </h1>
        {(uses ?? []).length > 0 && (
          <CouponUsesExport uses={uses ?? []} couponCode={coupon.code} />
        )}
      </div>

      {/* Tabela de usos */}
      {(uses ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nenhum uso registrado para este cupom ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Comprador</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">E-mail</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Evento</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Desconto</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(uses ?? []).map((use: any) => (
                  <tr key={use.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {use.profiles?.name ?? '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500">{use.profiles?.email ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 truncate max-w-[180px]">
                        {use.orders?.events?.title ?? '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-green-600">
                        - {formatCurrency(use.discount_applied)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500">
                        {formatDate(use.used_at, "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

