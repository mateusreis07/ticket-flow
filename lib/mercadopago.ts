import { MercadoPagoConfig, Payment, CardToken } from 'mercadopago'
import { createHmac, timingSafeEqual } from 'crypto'
import { CardInstallment } from '@/types'
import { formatCurrency } from '@/lib/utils/format'

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const mpPayment = new Payment(mpClient)
export const mpCardToken = new CardToken(mpClient)

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

export async function getInstallments(
  amount: number,
  bin: string
): Promise<CardInstallment[]> {
  const url = new URL('https://api.mercadopago.com/v1/payment_methods/installments')
  url.searchParams.set('amount', amount.toString())
  url.searchParams.set('bin', bin)
  url.searchParams.set('processing_mode', 'aggregator')

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': 'Bearer ' + process.env.MERCADOPAGO_ACCESS_TOKEN!
    }
  })

  if (!res.ok) {
    throw new Error('Falha ao buscar opções de parcelamento')
  }

  const data = await res.json()
  const payerCosts = data[0]?.payer_costs || []

  return payerCosts.map((inst: any) => ({
    quantity: inst.installments,
    amount: inst.installment_amount,
    totalAmount: inst.total_amount,
    label: inst.installments === 1
      ? '1x de ' + formatCurrency(inst.installment_amount) + ' sem juros'
      : inst.installments + 'x de ' + formatCurrency(inst.installment_amount) + 
        (inst.installment_rate === 0 ? ' sem juros' : ' com juros')
  }))
}

export async function createCardPayment(params: {
  orderId: string
  amount: number
  token: string
  installments: number
  paymentMethodId: string
  issuerId: string | undefined
  payerEmail: string
  payerName: string
  description: string
  notificationUrl: string
}) {
  return await mpPayment.create({
    body: {
      transaction_amount: formatAmountForMP(params.amount),
      token: params.token,
      description: params.description,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId ? Number(params.issuerId) : undefined,
      payer: {
        email: params.payerEmail,
        identification: {
          type: 'CPF',
          number: '',
        },
      },
      external_reference: params.orderId,
      notification_url: params.notificationUrl,
      metadata: {
        order_id: params.orderId,
        ticketflow: true,
      },
      statement_descriptor: 'TICKETFLOW',
    }
  })
}
