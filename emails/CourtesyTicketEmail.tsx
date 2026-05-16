import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { CourtesyListType } from '@/types'

interface CourtesyTicketEmailProps {
  guestName: string
  organizerName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventCity: string
  listType: CourtesyListType
  listName: string
  tickets: Array<{
    qrCode: string
    ticketTypeName: string
    ticketCode: string
  }>
  appUrl: string
  note?: string
}

const listTypeConfig = {
  vip: { label: 'VIP', emoji: '⭐', color: '#F59E0B' },
  press: { label: 'Imprensa', emoji: '📰', color: '#3B82F6' },
  staff: { label: 'Staff', emoji: '🎪', color: '#8B5CF6' },
  sponsor: { label: 'Patrocinador', emoji: '🤝', color: '#10B981' },
  guest: { label: 'Convidado', emoji: '🎟', color: '#EC4899' },
  courtesy: { label: 'Cortesia', emoji: '🎁', color: '#7C3AED' },
}

export const CourtesyTicketEmail = ({
  guestName = 'Convidado',
  organizerName = 'Organizador',
  eventTitle = 'Evento Incrível',
  eventDate = 'Sábado, 20 de Maio de 2026',
  eventTime = '20:00',
  eventLocation = 'Local do Evento',
  eventCity = 'São Paulo',
  listType = 'courtesy',
  listName = 'Lista VIP',
  tickets = [],
  appUrl = 'http://localhost:3000',
  note,
}: CourtesyTicketEmailProps) => {
  const config = listTypeConfig[listType] || listTypeConfig.courtesy

  return (
    <Html>
      <Head />
      <Preview>Seu ingresso {config.label.toLowerCase()} para {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Cabeçalho Especial */}
          <Section style={{ ...headerSection, backgroundColor: config.color }}>
            <Text style={logoText}>TicketFlow</Text>
            <div style={badgeContainer}>
              <Text style={badgeEmoji}>{config.emoji}</Text>
            </div>
            <Heading style={headerTitle}>Ingresso {config.label}</Heading>
            <Text style={headerSubtext}>Você foi convidado especialmente</Text>
          </Section>

          <Section style={bodySection}>
            <Text style={greeting}>Olá, {guestName}!</Text>
            <Text style={paragraph}>
              <strong>{organizerName}</strong> te convidou para o evento <strong>{eventTitle}</strong> e adicionou você à lista {listName}.
            </Text>

            {note && (
              <Section style={noteBox}>
                <Text style={quoteMark}>"</Text>
                <Text style={noteText}>{note}</Text>
                <Text style={noteAuthor}>— {organizerName}</Text>
              </Section>
            )}

            <Section style={eventCard}>
              <Heading style={eventCardTitle}>{eventTitle}</Heading>
              <Text style={eventCardDetails}>
                📅 {eventDate} às {eventTime}<br />
                📍 {eventLocation} - {eventCity}
              </Text>
            </Section>

            {tickets.map((ticket, index) => (
              <Section key={index} style={ticketBox}>
                <Text style={ticketTypeBadge}>{ticket.ticketTypeName}</Text>
                <Img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.qrCode}`}
                  width="150"
                  height="150"
                  alt={`QR Code para ${ticket.ticketTypeName}`}
                  style={qrCodeImage}
                />
                <Text style={ticketCodeText}>CÓDIGO: {ticket.ticketCode}</Text>
              </Section>
            ))}

            <Text style={alertText}>
              Este é um ingresso gratuito e intransferível. 
              Apresente o QR Code na entrada do evento.
            </Text>

            <Section style={buttonContainer}>
              <Link href={`${appUrl}/meus-ingressos`} style={button}>
                Ver meu ingresso no app
              </Link>
            </Section>
          </Section>

          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              © 2026 TicketFlow. Todos os direitos reservados.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${appUrl}/ajuda`} style={link}>Central de Ajuda</Link>
              {' • '}
              <Link href={`${appUrl}/termos`} style={link}>Termos de Uso</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos
const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: '40px 0',
}

const container = {
  margin: '0 auto',
  width: '100%',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
}

const headerSection = {
  padding: '40px 20px',
  textAlign: 'center' as const,
  color: '#ffffff',
}

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '-0.5px',
  margin: '0 0 24px 0',
}

const badgeContainer = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px auto',
}

const badgeEmoji = {
  fontSize: '32px',
  margin: 0,
}

const headerTitle = {
  margin: '0 0 8px 0',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '-1px',
}

const headerSubtext = {
  margin: 0,
  fontSize: '16px',
  opacity: 0.9,
}

const bodySection = {
  padding: '40px 32px',
}

const greeting = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0 0 16px 0',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4B5563',
  margin: '0 0 24px 0',
}

const noteBox = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #d1d5db',
  padding: '20px',
  marginBottom: '24px',
  borderRadius: '0 8px 8px 0',
}

const quoteMark = {
  fontSize: '36px',
  color: '#9ca3af',
  fontFamily: 'serif',
  margin: '0 0 -20px 0',
  lineHeight: '1',
}

const noteText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  fontStyle: 'italic',
  margin: '0 0 12px 0',
}

const noteAuthor = {
  fontSize: '14px',
  color: '#6b7280',
  margin: 0,
  fontWeight: '500',
}

const eventCard = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}

const eventCardTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0 0 8px 0',
}

const eventCardDetails = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4B5563',
  margin: 0,
}

const ticketBox = {
  border: '2px dashed #e5e7eb',
  borderRadius: '16px',
  padding: '32px 20px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  backgroundColor: '#ffffff',
}

const ticketTypeBadge = {
  display: 'inline-block',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  padding: '6px 12px',
  borderRadius: '9999px',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 24px 0',
}

const qrCodeImage = {
  margin: '0 auto 16px auto',
  display: 'block',
  borderRadius: '8px',
}

const ticketCodeText = {
  fontSize: '14px',
  color: '#6B7280',
  fontWeight: '500',
  letterSpacing: '1px',
  margin: 0,
}

const alertText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '0 0 32px 0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#7C3AED',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '16px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer = {
  padding: '0 32px 40px 32px',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '0 0 24px 0',
}

const footerText = {
  fontSize: '14px',
  color: '#9CA3AF',
  margin: '0 0 8px 0',
}

const footerLinks = {
  fontSize: '14px',
  color: '#9CA3AF',
  margin: 0,
}

const link = {
  color: '#6B7280',
  textDecoration: 'underline',
}
