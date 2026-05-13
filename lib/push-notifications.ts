import { sendPushToUser, sendPushToMultipleUsers } from '@/lib/web-push'

export async function sendOrderConfirmedPush(
  userId: string,
  eventTitle: string,
  orderId: string
) {
  return sendPushToUser(userId, {
    title: '🎟 Pagamento confirmado!',
    body: `Seu ingresso para "${eventTitle}" está disponível.`,
    url: '/meus-ingressos',
    type: 'order_confirmed',
    tag: `order-${orderId}`,
    requireInteraction: false,
  })
}

export async function sendEventReminderPush(
  userId: string,
  eventTitle: string,
  ticketId: string
) {
  return sendPushToUser(userId, {
    title: '⏰ Seu evento é amanhã!',
    body: `"${eventTitle}" acontece amanhã. Não esqueça seu ingresso!`,
    url: `/meus-ingressos`,
    type: 'event_reminder',
    tag: `reminder-${ticketId}`,
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Ver ingresso' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  })
}

export async function sendEventCancelledPush(
  userIds: string[],
  eventTitle: string
) {
  return sendPushToMultipleUsers(userIds, {
    title: '❌ Evento cancelado',
    body: `"${eventTitle}" foi cancelado. Você será reembolsado em breve.`,
    url: '/meus-ingressos',
    type: 'event_cancelled',
    tag: `cancelled-${eventTitle.substring(0, 30)}`,
    requireInteraction: true,
  })
}

export async function sendNewEventPush(
  userIds: string[],
  eventTitle: string,
  eventId: string
) {
  return sendPushToMultipleUsers(userIds, {
    title: '✨ Novo evento disponível!',
    body: `"${eventTitle}" acabou de ser publicado. Garanta seu ingresso!`,
    url: `/eventos/${eventId}`,
    type: 'new_event',
    tag: `new-event-${eventId}`,
  })
}

export async function sendCheckinMilestonePush(
  organizerId: string,
  eventTitle: string,
  checkedIn: number,
  total: number,
  eventId: string
) {
  if (total === 0) return

  const percentage = Math.round((checkedIn / total) * 100)
  
  // Enviar push apenas em marcos de 25%, 50%, 75%, 90% e 100%
  const milestones = [25, 50, 75, 90, 100]
  
  // Calcular se o último check-in atingiu exatamente o marco
  // Isso requer que checkedIn / total seja calculado precisamente
  const hitMilestone = milestones.find(m => {
    // Tolerância para bater o marco, ou logar no banco quando disparou
    const threshold = Math.ceil((m / 100) * total)
    return checkedIn === threshold
  })

  if (hitMilestone) {
    return sendPushToUser(organizerId, {
      title: '📊 Marco de Check-in!',
      body: `"${eventTitle}" atingiu ${hitMilestone}% de presença! (${checkedIn}/${total})`,
      url: `/dashboard/checkin/${eventId}`,
      type: 'checkin_milestone',
      tag: `milestone-${eventId}-${hitMilestone}`,
      requireInteraction: false,
    })
  }
}
