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
  Text,
  Heading,
  Button,
  Link
} from '@react-email/components'

interface EventReminderEmailProps {
  buyerName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventCity: string
  ticketsCount: number
  appUrl: string
}

export const EventReminderEmail = ({
  buyerName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventCity,
  ticketsCount,
  appUrl,
}: EventReminderEmailProps) => {
  return (
    <Html lang="pt-BR">
      <Head>
        <title>Lembrete do evento — TicketFlow</title>
      </Head>
      <Preview>Seu evento é amanhã! {eventTitle}</Preview>
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
            </Row>
          </Section>

          {/* === SAUDAÇÃO E LEMBRETE === */}
          <Section style={{ padding: '32px 40px 0' }}>
            <Heading as="h2" style={{ fontSize: '22px', color: '#111827', fontWeight: 600, margin: '0 0 8px' }}>
              Olá, {buyerName}!
            </Heading>
            <Text style={{ color: '#6B7280', fontSize: '15px', margin: '0 0 16px' }}>
              Este é um lembrete de que o evento <strong>{eventTitle}</strong> está chegando!
            </Text>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
              <Row style={{ margin: '0 0 8px' }}>
                <Text style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                  📅 <strong>Data:</strong> {eventDate} às {eventTime}
                </Text>
              </Row>
              <Row style={{ margin: '0 0 8px' }}>
                <Text style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                  📍 <strong>Local:</strong> {eventLocation} — {eventCity}
                </Text>
              </Row>
              <Row>
                <Text style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                  🎫 <strong>Ingressos:</strong> {ticketsCount} ingresso(s)
                </Text>
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
                  Ver meus ingressos
                </Button>
              </Column>
            </Row>
          </Section>

          {/* === FOOTER === */}
          <Section style={{ padding: '24px 40px', borderTop: '1px solid #E5E7EB' }}>
            <Text style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
              © 2026 TicketFlow. Todos os direitos reservados.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export default EventReminderEmail
