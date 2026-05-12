import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CouponsClient from '@/components/dashboard/CouponsClient'
import { formatCurrency } from '@/lib/utils/format'

export default async function CouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'organizer') redirect('/dashboard')

  // Buscar cupons com contagem de usos
  const { data: coupons } = await supabaseAdmin
    .from('coupons')
    .select(`
      *,
      events ( title ),
      coupon_uses ( discount_applied )
    `)
    .eq('organizer_id', profile.id)
    .order('created_at', { ascending: false })

  // Buscar eventos do organizador para o formulário
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title')
    .eq('organizer_id', profile.id)
    .eq('status', 'published')
    .order('event_date', { ascending: false })

  // Calcular métricas
  const totalActive = (coupons ?? []).filter((c: any) => c.is_active).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayUses = (coupons ?? []).reduce((sum: number, c: any) => {
    const usesToday = (c.coupon_uses ?? []).filter((u: any) => {
      const usedAt = new Date(u.used_at)
      return usedAt >= today && usedAt < tomorrow
    }).length
    return sum + usesToday
  }, 0)

  const totalDiscountGranted = (coupons ?? []).reduce((sum: number, c: any) => {
    return sum + (c.coupon_uses ?? []).reduce((s: number, u: any) => s + (u.discount_applied ?? 0), 0)
  }, 0)

  return (
    <DashboardLayout profile={profile}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cupons de desconto</h1>
            <p className="text-sm text-gray-500 mt-0.5">Crie e gerencie cupons para seus eventos</p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cupons ativos</p>
            <p className="text-3xl font-bold text-gray-900">{totalActive}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Usos hoje</p>
            <p className="text-3xl font-bold text-gray-900">{todayUses}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total em descontos</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalDiscountGranted)}</p>
          </div>
        </div>

        {/* Tabela + ações — componente client */}
        <CouponsClient
          coupons={(coupons ?? []).map((c: any) => ({
            ...c,
            event_title: c.events?.title ?? null,
            total_uses: (c.coupon_uses ?? []).length,
          }))}
          events={events ?? []}
        />
      </div>
    </DashboardLayout>
  )
}
