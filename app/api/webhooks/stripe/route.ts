import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Stripe webhook mantido apenas para evitar falhas no dashboard do Stripe.
// Novos pagamentos são processados via Mercado Pago.
// Se não há mais pedidos com stripe_session_id pendentes, 
// este webhook pode ser desabilitado no painel do Stripe.

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Retornar 200 para o Stripe não gerar alertas de webhook com falha
  return new Response('Webhook ignored (Stripe disabled)', { status: 200 })
}

