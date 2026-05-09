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
  Link,
  Hr
} from '@react-email/components'

interface Ticket {
  id: string
  qrCode: string
  ticketTypeName: string
  ticketCode: string
}

interface TicketsEmailProps {
  buyerName: string
  buyerEmail: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventCity: string
  eventState: string
  coverImageUrl: string | null
  tickets: Ticket[]
  appUrl: string
}

export const TicketsEmail = ({
  buyerName,
  buyerEmail,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventCity,
  eventState,
  coverImageUrl,
  tickets,
  appUrl,
}: TicketsEmailProps) => {
  return (
    <Html lang="pt-BR">
      <Head>
        <title>Seus ingressos — TicketFlow</title>
      </Head>
      <Preview>Seus ingressos para {eventTitle} estão aqui!</Preview>
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

          {/* === SAUDAÇÃO === */}
          <Section style={{ padding: '32px 40px 0' }}>
            <Heading as="h2" style={{ fontSize: '22px', color: '#111827', fontWeight: 600, margin: '0 0 8px' }}>
              Seus ingressos
            </Heading>
            <Text style={{ color: '#6B7280', fontSize: '15px', margin: 0 }}>
              Apresente o QR Code abaixo na entrada do evento. Cada código é único e intransferível.
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

          {/* === INGRESSOS === */}
          {tickets && tickets.map((ticket, index) => (
            <React.Fragment key={ticket.id}>
              <Section style={{ padding: '16px 40px' }}>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <Text style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px' }}>
                    {ticket.ticketTypeName}
                  </Text>
                  
                  <Text style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>
                    {eventTitle}
                  </Text>

                  <Img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qrCode)}`}
                    width="200"
                    height="200"
                    alt="QR Code do ingresso"
                    style={{ margin: '0 auto', display: 'block' }}
                  />

                  <Text style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'monospace', margin: '16px 0 0' }}>
                    Código: #{ticket.ticketCode}
                  </Text>

                  <Hr style={{ borderColor: '#E5E7EB', margin: '20px 0' }} />

                  <Text style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                    🎫 {ticket.ticketTypeName} · {eventTitle}
                  </Text>
                </div>
              </Section>
              
              {index < tickets.length - 1 && (
                <Hr style={{ borderColor: '#E5E7EB', margin: '0 40px' }} />
              )}
            </React.Fragment>
          ))}

          {/* === BOTÃO CTA === */}
          <Section style={{ padding: '24px 40px' }}>
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
                  Ver todos os ingressos na plataforma
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

export default TicketsEmail
