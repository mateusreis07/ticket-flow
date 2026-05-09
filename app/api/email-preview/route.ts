import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/components'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail'
import { TicketsEmail } from '@/emails/TicketsEmail'
import { EventReminderEmail } from '@/emails/EventReminderEmail'

export async function GET(request: NextRequest) {
  // Proteger a rota para funcionar apenas em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template') || 'confirmation'

  // Dados mock para preview
  const mockData = {
    buyerName: 'João Silva',
    buyerEmail: 'joao@exemplo.com',
    orderId: 'abc12345-6789-0abc-def1-234567890abc',
    eventTitle: 'Show do Mestres da MPB',
    eventDate: 'Sábado, 15 de junho de 2026',
    eventTime: '20:00',
    eventLocation: 'Teatro da Paz',
    eventCity: 'Belém',
    eventState: 'PA',
    coverImageUrl: null,
    items: [
      { ticketTypeName: 'Pista', quantity: 2, unitPrice: 60, subtotal: 120 },
      { ticketTypeName: 'VIP', quantity: 1, unitPrice: 150, subtotal: 150 }
    ],
    totalAmount: 270,
    tickets: [
      { id: '1', qrCode: 'abc123def456ghi7', ticketTypeName: 'Pista', ticketCode: 'DEF456GH' },
      { id: '2', qrCode: 'xyz789uvw012rst3', ticketTypeName: 'Pista', ticketCode: 'UVW012RS' },
      { id: '3', qrCode: 'mno345pqr678stu9', ticketTypeName: 'VIP', ticketCode: 'PQR678ST' }
    ],
    ticketsCount: 3,
    appUrl: 'http://localhost:3000'
  }

  try {
    let html = ''

    if (template === 'confirmation') {
      html = await render(OrderConfirmationEmail({ ...mockData }))
    } else if (template === 'tickets') {
      html = await render(TicketsEmail({ ...mockData }))
    } else if (template === 'reminder') {
      html = await render(EventReminderEmail({ ...mockData }))
    } else {
      return new NextResponse('Template not found. Use ?template=confirmation | tickets | reminder', { status: 400 })
    }

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error: any) {
    console.error('Erro ao renderizar template de email:', error)
    return new NextResponse(`Erro ao renderizar: ${error.message}`, { status: 500 })
  }
}
