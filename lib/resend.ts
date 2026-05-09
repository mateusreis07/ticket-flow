import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export const EMAIL_CONFIG = {
  from: `TicketFlow <${EMAIL_FROM}>`,
  replyTo: 'suporte@ticketflow.com.br',
}

export type EmailResult = {
  success: boolean
  error?: string
}
