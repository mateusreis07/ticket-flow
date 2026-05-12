import { supabaseAdmin } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils/format'
import type { Coupon, CouponValidationResult } from '@/types'

// ─── validateCoupon ───────────────────────────────────────────────────────────

interface ValidateCouponParams {
  code: string
  userId: string
  eventId: string
  orderSubtotal: number
  items: Array<{ ticketTypeId: string; quantity: number }>
}

export async function validateCoupon(
  params: ValidateCouponParams
): Promise<CouponValidationResult> {
  const { code, userId, eventId, orderSubtotal, items } = params

  // 1. Buscar o cupom (case-insensitive)
  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .filter('code', 'ilike', code)
    .maybeSingle()

  if (error || !coupon) {
    return { valid: false, error: 'Cupom inválido ou inexistente.' }
  }

  const now = new Date()

  // 2. Verificar validade temporal
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: 'Este cupom ainda não está válido.' }
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, error: 'Este cupom expirou.' }
  }

  // 3. Verificar limite total de usos
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, error: 'Este cupom atingiu o limite de usos.' }
  }

  // 4. Verificar uso por usuário
  const { count: userUseCount } = await supabaseAdmin
    .from('coupon_uses')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId)

  if ((userUseCount ?? 0) >= coupon.max_uses_per_user) {
    return {
      valid: false,
      error: 'Você já utilizou este cupom o número máximo de vezes.',
    }
  }

  // 5. Verificar aplicabilidade
  if (coupon.applies_to === 'specific_event') {
    if (coupon.event_id !== eventId) {
      return {
        valid: false,
        error: 'Este cupom não é válido para este evento.',
      }
    }
  }

  if (coupon.applies_to === 'specific_ticket_type') {
    const couponTicketIds: string[] = coupon.ticket_type_ids ?? []
    const hasMatch = items.some((item) =>
      couponTicketIds.includes(item.ticketTypeId)
    )
    if (!hasMatch) {
      return {
        valid: false,
        error: 'Este cupom não se aplica aos ingressos selecionados.',
      }
    }
  }

  // 6. Verificar valor mínimo do pedido
  if (orderSubtotal < (coupon.min_order_amount ?? 0)) {
    return {
      valid: false,
      error: `Valor mínimo para este cupom: ${formatCurrency(coupon.min_order_amount ?? 0)}`,
    }
  }

  // 7. Calcular desconto
  let discount = 0

  if (coupon.discount_type === 'percentage') {
    discount = orderSubtotal * (coupon.discount_value / 100)
    if (coupon.max_discount_amount !== null) {
      discount = Math.min(discount, coupon.max_discount_amount)
    }
  } else {
    // fixed
    discount = Math.min(coupon.discount_value, orderSubtotal)
  }

  discount = Math.round(discount * 100) / 100
  const new_total = Math.max(orderSubtotal - discount, 0)

  return {
    valid: true,
    coupon: coupon as Coupon,
    discount_amount: discount,
    new_total,
  }
}

// ─── applyCouponToOrder ───────────────────────────────────────────────────────

interface ApplyCouponParams {
  couponId: string
  orderId: string
  userId: string
  discountAmount: number
}

export async function applyCouponToOrder(
  params: ApplyCouponParams
): Promise<{ success: boolean; error?: string }> {
  const { couponId, orderId, userId, discountAmount } = params

  try {
    // 1. Re-verificar o cupom (proteção contra race condition)
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('id, code, is_active, valid_until, max_uses, used_count')
      .eq('id', couponId)
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return { success: false, error: 'Cupom não encontrado ou inativo.' }
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { success: false, error: 'Este cupom expirou.' }
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return { success: false, error: 'Este cupom atingiu o limite de usos.' }
    }

    // 2. Buscar o pedido para calcular o novo total
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, subtotal_amount, total_amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pedido não encontrado.' }
    }

    const subtotal = order.subtotal_amount ?? order.total_amount
    const newTotal = Math.max(subtotal - discountAmount, 0)

    // 3. Atualizar o pedido com os dados do cupom
    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({
        coupon_id: couponId,
        coupon_code: coupon.code,
        discount_amount: discountAmount,
        total_amount: newTotal,
      })
      .eq('id', orderId)

    if (updateOrderError) throw updateOrderError

    // 4. Registrar uso do cupom
    const { error: insertUseError } = await supabaseAdmin
      .from('coupon_uses')
      .upsert(
        {
          coupon_id: couponId,
          order_id: orderId,
          user_id: userId,
          discount_applied: discountAmount,
        },
        { onConflict: 'coupon_id,order_id' }
      )

    if (insertUseError) throw insertUseError

    // 5. Incrementar contador de usos
    const { error: incrementError } = await supabaseAdmin
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', couponId)

    if (incrementError) throw incrementError

    return { success: true }
  } catch (err: any) {
    console.error('applyCouponToOrder error:', err)
    return { success: false, error: 'Erro ao aplicar cupom.' }
  }
}

// ─── removeCouponFromOrder ────────────────────────────────────────────────────

export async function removeCouponFromOrder(orderId: string): Promise<void> {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, coupon_id, subtotal_amount, total_amount')
    .eq('id', orderId)
    .single()

  if (!order?.coupon_id) return

  const subtotal = order.subtotal_amount ?? order.total_amount

  // Decrementar contador de usos
  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('used_count')
    .eq('id', order.coupon_id)
    .single()

  if (coupon) {
    await supabaseAdmin
      .from('coupons')
      .update({ used_count: Math.max(0, coupon.used_count - 1) })
      .eq('id', order.coupon_id)
  }

  // Remover registro de uso
  await supabaseAdmin
    .from('coupon_uses')
    .delete()
    .eq('order_id', orderId)

  // Restaurar total original do pedido
  await supabaseAdmin
    .from('orders')
    .update({
      coupon_id: null,
      coupon_code: null,
      discount_amount: 0,
      total_amount: subtotal,
    })
    .eq('id', orderId)
}
