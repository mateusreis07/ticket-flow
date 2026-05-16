import { resend, EMAIL_CONFIG, EmailResult } from './resend'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail'
import { TicketsEmail } from '@/emails/TicketsEmail'
import { CourtesyTicketEmail } from '@/emails/CourtesyTicketEmail'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils/format'

export async function sendOrderConfirmationEmail(params: any): Promise<EmailResult> {
  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [params.buyerEmail],
      subject: `Pedido confirmado — ${params.eventTitle}`,
      react: OrderConfirmationEmail({ ...params }),
    })
    console.log('E-mail de confirmação enviado para:', params.buyerEmail)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de confirmação:', error)
    return { success: false, error: error.message }
  }
}

export async function sendTicketsEmail(params: any): Promise<EmailResult> {
  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [params.buyerEmail],
      subject: `Seus ingressos — ${params.eventTitle}`,
      react: TicketsEmail({ ...params }),
    })
    console.log('E-mail de ingressos enviado para:', params.buyerEmail)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de ingressos:', error)
    return { success: false, error: error.message }
  }
}

export async function sendOrderAndTicketsEmails(orderId: string): Promise<EmailResult> {
  try {
    // 1. Buscar dados completos do pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        profiles!buyer_id (name, email),
        events!event_id (title, event_date, event_time, location, city, state, cover_image_url)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Pedido não encontrado para envio de e-mail')
    }

    const buyerName = Array.isArray(order.profiles) ? order.profiles[0]?.name : order.profiles?.name
    const buyerEmail = Array.isArray(order.profiles) ? order.profiles[0]?.email : order.profiles?.email
    const event = Array.isArray(order.events) ? order.events[0] : order.events

    // 2. Buscar order_items com nomes dos tipos
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity, unit_price,
        ticket_types!ticket_type_id (name)
      `)
      .eq('order_id', orderId)

    const formattedItems = (orderItems || []).map((item: any) => ({
      ticketTypeName: Array.isArray(item.ticket_types) ? item.ticket_types[0]?.name : item.ticket_types?.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.quantity) * Number(item.unit_price)
    }))

    // 3. Buscar tickets do pedido
    const { data: ticketsData } = await supabaseAdmin
      .from('tickets')
      .select(`
        id, qr_code,
        ticket_types!ticket_type_id (name)
      `)
      .eq('order_id', orderId)

    const formattedTickets = (ticketsData || []).map((t: any) => ({
      id: t.id,
      qrCode: t.qr_code,
      ticketTypeName: Array.isArray(t.ticket_types) ? t.ticket_types[0]?.name : t.ticket_types?.name,
      ticketCode: t.qr_code ? t.qr_code.slice(-8).toUpperCase() : ''
    }))

    // 4. Formatar dados compartilhados
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const eventDateFormatted = event?.event_date 
      ? new Date(event.event_date).toLocaleDateString('pt-BR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
      : ''

    const emailParams = {
      buyerName: buyerName || '',
      buyerEmail: buyerEmail || '',
      orderId: order.id,
      eventTitle: event?.title || '',
      eventDate: eventDateFormatted,
      eventTime: event?.event_time || '',
      eventLocation: event?.location || '',
      eventCity: event?.city || '',
      eventState: event?.state || '',
      coverImageUrl: event?.cover_image_url || null,
      items: formattedItems,
      totalAmount: Number(order.total_amount),
      tickets: formattedTickets,
      appUrl
    }

    // 5. Chamar sendOrderConfirmationEmail
    await sendOrderConfirmationEmail(emailParams)

    // 6. Aguardar 1 segundo para não sobrecarregar API do Resend
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 7. Chamar sendTicketsEmail
    await sendTicketsEmail(emailParams)

    return { success: true }
  } catch (error: any) {
    console.error('Erro geral no fluxo de e-mails:', error)
    return { success: false, error: error.message }
  }
}

export async function sendCourtesyEmail(params: any): Promise<EmailResult> {
  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [params.guestEmail],
      subject: `🎟 Seu ingresso cortesia — ${params.eventTitle}`,
      react: CourtesyTicketEmail({ ...params }),
    })
    console.log('E-mail de cortesia enviado para:', params.guestEmail)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de cortesia:', error)
    return { success: false, error: error.message }
  }
}
