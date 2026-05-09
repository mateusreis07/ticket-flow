import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Converte valor em reais para centavos (Stripe usa centavos)
 * Ex: 120.50 → 12050
 */
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100)
}
