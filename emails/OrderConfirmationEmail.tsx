import * as React from 'react'
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Heading,
  Button,
  Link
} from '@react-email/components'

interface OrderItem {
  ticketTypeName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface OrderConfirmationEmailProps {
  buyerName: string
  buyerEmail: string
  orderId: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventCity: string
  eventState: string
  coverImageUrl: string | null
  items: OrderItem[]
  totalAmount: number
  appUrl: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const OrderConfirmationEmail = ({
  buyerName,
  buyerEmail,
  orderId,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventCity,
  eventState,
  coverImageUrl,
  items,
  totalAmount,
  appUrl,
}: OrderConfirmationEmailProps) => {
  const shortOrderId = orderId ? orderId.substring(0, 8) : ''

  return (
    <Html lang="pt-BR">
      <Head>
        <title>Pedido confirmado — TicketFlow</title>
      </Head>
      <Preview>Seu pedido foi confirmado! Acesse seus ingressos.</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#F9FAFB', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 0' }}>
          
          {/* === HEADER === */}
          <Section style={{ backgroundColor: '#7C3AED', padding: '32px 40px' }}>
            <Row>
              <Column>
                <Text style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  🎟 TicketFlow
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ color: '#C4B5FD', fontSize: '12px', margin: 0 }}>
                  Ingresso digital
                </Text>
              </Column>
            </Row>
          </Section>

          {/* === BANNER DE SUCESSO === */}
          <Section style={{ backgroundColor: '#DCFCE7', padding: '16px 40px', borderLeft: '4px solid #16A34A' }}>
            <Row>
              <Text style={{ fontSize: '14px', color: '#15803D', margin: 0 }}>
                ✓ Pagamento confirmado — Pedido #{shortOrderId}
              </Text>
            </Row>
          </Section>

          {/* === SAUDAÇÃO === */}
          <Section style={{ padding: '32px 40px 0' }}>
            <Heading as="h2" style={{ fontSize: '22px', color: '#111827', fontWeight: 600, margin: '0 0 8px' }}>
              Olá, {buyerName}!
            </Heading>
            <Text style={{ color: '#6B7280', fontSize: '15px', margin: 0 }}>
              Seu pedido foi confirmado e seus ingressos estão prontos. Mostre o QR Code na entrada do evento.
            </Text>
          </Section>

          {/* === CARD DO EVENTO === */}
          <Section style={{ padding: '24px 40px' }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              {coverImageUrl && (
                <Img 
                  src={coverImageUrl} 
                  width="100%" 
                  height="200" 
                  style={{ objectFit: 'cover', display: 'block' }} 
                  alt={eventTitle}
                />
              )}
              <div style={{ padding: '20px' }}>
                <Text style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
                  {eventTitle}
                </Text>
                
                <Row style={{ margin: '0 0 8px' }}>
                  <Text style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                    📅 {eventDate} às {eventTime}
                  </Text>
                </Row>
                
                <Row>
                  <Text style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                    📍 {eventLocation} — {eventCity}/{eventState}
                  </Text>
                </Row>
              </div>
            </div>
          </Section>

          {/* === RESUMO DO PEDIDO === */}
          <Section style={{ padding: '0 40px' }}>
            <Heading as="h3" style={{ fontSize: '16px', color: '#111827', fontWeight: 600, margin: '0 0 16px' }}>
              Resumo do pedido
            </Heading>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              {items && items.map((item, index) => (
                <Row key={index} style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                  <Column>
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: 0 }}>
                      {item.ticketTypeName}
                    </Text>
                    <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                      {item.quantity}x ingresso(s)
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                  </Column>
                </Row>
              ))}

              <Row style={{ padding: '16px 20px', backgroundColor: '#F9FAFB' }}>
                <Column>
                  <Text style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Total pago
                  </Text>
                </Column>
                <Column align="right">
                  <Text style={{ fontSize: '18px', fontWeight: 700, color: '#7C3AED', margin: 0 }}>
                    {formatCurrency(totalAmount)}
                  </Text>
                </Column>
              </Row>
            </div>
          </Section>

          {/* === BOTÃO CTA === */}
          <Section style={{ padding: '32px 40px' }}>
            <Row>
              <Column align="center">
                <Button 
                  href={`${appUrl}/meus-ingressos`}
                  style={{
                    backgroundColor: '#7C3AED',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    padding: '14px 32px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  Ver meus ingressos com QR Code →
                </Button>
              </Column>
            </Row>
          </Section>

          {/* === INFORMAÇÕES DE SEGURANÇA === */}
          <Section style={{ padding: '0 40px 32px' }}>
            <div style={{ backgroundColor: '#EDE9FE', borderRadius: '12px', padding: '16px 20px' }}>
              <Text style={{ fontSize: '13px', color: '#5B21B6', margin: 0, lineHeight: '1.5' }}>
                🔒 Seus ingressos são únicos e intransferíveis. Cada QR Code só pode ser utilizado uma vez na entrada do evento.
              </Text>
            </div>
          </Section>

          {/* === FOOTER === */}
          <Section style={{ padding: '24px 40px', borderTop: '1px solid #E5E7EB' }}>
            <Text style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', margin: '0 0 8px' }}>
              Este e-mail foi enviado para {buyerEmail}
            </Text>
            <Text style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
              © 2026 TicketFlow. Todos os direitos reservados.
            </Text>
            <Row style={{ marginTop: '12px' }}>
              <Column align="center">
                <Link href={appUrl} style={{ color: '#7C3AED', fontSize: '12px', textDecoration: 'none' }}>
                  Acessar plataforma
                </Link>
                <Text style={{ fontSize: '12px', color: '#D1D5DB', display: 'inline', margin: '0 8px' }}>
                  ·
                </Text>
                <Link href={`${appUrl}/meus-ingressos`} style={{ color: '#7C3AED', fontSize: '12px', textDecoration: 'none' }}>
                  Meus ingressos
                </Link>
              </Column>
            </Row>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export default OrderConfirmationEmail
