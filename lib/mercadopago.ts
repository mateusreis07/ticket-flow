import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createHmac, timingSafeEqual } from 'crypto'

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const mpPayment = new Payment(mpClient)

export function formatAmountForMP(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function isValidMPWebhook(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  try {
    const parts = xSignature.split(',')
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1]
    const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1]

    if (!ts || !v1) return false

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const hmac = createHmac('sha256', secret).update(manifest).digest('hex')

    return timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
  } catch (error) {
    console.error('Erro ao validar webhook do MP:', error)
    return false
  }
}
