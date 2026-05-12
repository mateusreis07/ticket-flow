'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Apenas letras maiúsculas e números')
    .transform((s) => s.toUpperCase()),
  description: z.string().max(100).optional().nullable(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.coerce.number().positive('Deve ser maior que zero'),
  min_order_amount: z.coerce.number().min(0).default(0),
  max_discount_amount: z.coerce.number().positive().optional().nullable(),
  max_uses: z.coerce.number().int().positive().optional().nullable(),
  max_uses_per_user: z.coerce.number().int().min(1).default(1),
  is_active: z.boolean().default(true),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  applies_to: z.enum(['all', 'specific_event', 'specific_ticket_type']),
  event_id: z.string().uuid().optional().nullable(),
})

// ─── Buscar organizerId do usuário autenticado ────────────────────────────────

async function getOrganizerIdOrThrow(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'organizer') {
    throw new Error('Apenas organizadores podem gerenciar cupons')
  }

  return profile.id
}

// ─── createCoupon ─────────────────────────────────────────────────────────────

export async function createCoupon(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizerId = await getOrganizerIdOrThrow()

    const raw = {
      code: formData.get('code'),
      description: formData.get('description') || null,
      discount_type: formData.get('discount_type'),
      discount_value: formData.get('discount_value'),
      min_order_amount: formData.get('min_order_amount') || '0',
      max_discount_amount: formData.get('max_discount_amount') || null,
      max_uses: formData.get('max_uses') || null,
      max_uses_per_user: formData.get('max_uses_per_user') || '1',
      is_active: formData.get('is_active') === 'true',
      valid_from: formData.get('valid_from') || null,
      valid_until: formData.get('valid_until') || null,
      applies_to: formData.get('applies_to'),
      event_id: formData.get('event_id') || null,
    }

    const parsed = couponSchema.safeParse(raw)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'Dados inválidos'
      return { success: false, error: firstError }
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({ ...parsed.data, organizer_id: organizerId })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Você já tem um cupom com este código.' }
      }
      throw error
    }

    revalidatePath('/dashboard/cupons')
    return { success: true }
  } catch (err: any) {
    console.error('createCoupon error:', err)
    return { success: false, error: err.message ?? 'Erro ao criar cupom.' }
  }
}

// ─── updateCoupon ─────────────────────────────────────────────────────────────

export async function updateCoupon(
  couponId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizerId = await getOrganizerIdOrThrow()

    // Verificar ownership
    const { data: existing } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('id', couponId)
      .eq('organizer_id', organizerId)
      .single()

    if (!existing) return { success: false, error: 'Cupom não encontrado.' }

    const raw = {
      code: formData.get('code'),
      description: formData.get('description') || null,
      discount_type: formData.get('discount_type'),
      discount_value: formData.get('discount_value'),
      min_order_amount: formData.get('min_order_amount') || '0',
      max_discount_amount: formData.get('max_discount_amount') || null,
      max_uses: formData.get('max_uses') || null,
      max_uses_per_user: formData.get('max_uses_per_user') || '1',
      is_active: formData.get('is_active') === 'true',
      valid_from: formData.get('valid_from') || null,
      valid_until: formData.get('valid_until') || null,
      applies_to: formData.get('applies_to'),
      event_id: formData.get('event_id') || null,
    }

    const parsed = couponSchema.safeParse(raw)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'Dados inválidos'
      return { success: false, error: firstError }
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', couponId)
      .eq('organizer_id', organizerId)

    if (error) throw error

    revalidatePath('/dashboard/cupons')
    return { success: true }
  } catch (err: any) {
    console.error('updateCoupon error:', err)
    return { success: false, error: err.message ?? 'Erro ao atualizar cupom.' }
  }
}

// ─── toggleCoupon ─────────────────────────────────────────────────────────────

export async function toggleCoupon(
  couponId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizerId = await getOrganizerIdOrThrow()

    const { error } = await supabaseAdmin
      .from('coupons')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', couponId)
      .eq('organizer_id', organizerId)

    if (error) throw error

    revalidatePath('/dashboard/cupons')
    return { success: true }
  } catch (err: any) {
    console.error('toggleCoupon error:', err)
    return { success: false, error: err.message ?? 'Erro ao atualizar cupom.' }
  }
}

// ─── deleteCoupon ─────────────────────────────────────────────────────────────

export async function deleteCoupon(
  couponId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizerId = await getOrganizerIdOrThrow()

    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('id, used_count')
      .eq('id', couponId)
      .eq('organizer_id', organizerId)
      .single()

    if (!coupon) return { success: false, error: 'Cupom não encontrado.' }

    if (coupon.used_count > 0) {
      return {
        success: false,
        error: 'Cupons com usos registrados não podem ser excluídos. Desative-o em vez disso.',
      }
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', couponId)
      .eq('organizer_id', organizerId)

    if (error) throw error

    revalidatePath('/dashboard/cupons')
    return { success: true }
  } catch (err: any) {
    console.error('deleteCoupon error:', err)
    return { success: false, error: err.message ?? 'Erro ao excluir cupom.' }
  }
}
