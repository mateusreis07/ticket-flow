import webPush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase/admin'

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  type: 'order_confirmed' | 'event_reminder' | 'event_cancelled' | 'ticket_transferred' | 'new_event' | 'promotional' | 'checkin_milestone' | 'courtesy_ticket'
  actions?: Array<{ action: string; title: string }>
  requireInteraction?: boolean
}

// Inicialização lazy: evita falha durante o build quando as variáveis não estão disponíveis
function getWebPush() {
  const subject = process.env.VAPID_EMAIL
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      '[web-push] Variáveis VAPID não configuradas. ' +
      'Verifique VAPID_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.'
    )
  }

  webPush.setVapidDetails(subject, publicKey, privateKey)
  return webPush
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  // 1. Registrar a notificação no banco antes de enviar
  const { data: notificationRecord } = await supabaseAdmin
    .from('push_notifications')
    .insert({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/',
      type: payload.type,
    })
    .select('id')
    .single()

  // 2. Buscar todas as subscriptions do usuário
  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  const pushData = JSON.stringify({
    ...payload,
    notificationId: notificationRecord?.id,
  })

  const wp = getWebPush()

  for (const sub of subscriptions) {
    try {
      await wp.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushData
      )
      sent++
    } catch (err: unknown) {
      const error = err as { statusCode?: number }
      // Subscription expirada ou inválida — remover do banco
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id)
        console.log(`[Push] Subscription expirada removida: ${sub.endpoint.substring(0, 50)}...`)
      } else {
        console.error('[Push] Erro ao enviar notificação:', err)
      }
      failed++
    }
  }

  return { sent, failed }
}

export async function sendPushToMultipleUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0
  let totalFailed = 0

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload)
    totalSent += result.sent
    totalFailed += result.failed
  }

  return { totalSent, totalFailed }
}
