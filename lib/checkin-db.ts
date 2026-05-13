import { get, set, del } from 'idb-keyval'
import { CheckinListItem, OfflineCheckinAction } from '@/types'

export async function saveCheckinList(eventId: string, items: CheckinListItem[]): Promise<void> {
  await set(`checkin_list_${eventId}`, items)
  await set(`checkin_metadata_${eventId}`, {
    downloadedAt: new Date().toISOString(),
    totalItems: items.length
  })
}

export async function getCheckinList(eventId: string): Promise<CheckinListItem[] | null> {
  const data = await get<CheckinListItem[]>(`checkin_list_${eventId}`)
  return data || null
}

export async function updateCheckinItem(
  eventId: string,
  ticketId: string,
  updates: Partial<CheckinListItem>
): Promise<void> {
  const list = await getCheckinList(eventId)
  if (!list) return

  const index = list.findIndex(item => item.ticket_id === ticketId)
  if (index !== -1) {
    list[index] = { ...list[index], ...updates }
    await set(`checkin_list_${eventId}`, list)
  }
}

export async function saveOfflineAction(sessionId: string, action: OfflineCheckinAction): Promise<void> {
  const actions = await getOfflineActions(sessionId)
  actions.push(action)
  await set(`offline_actions_${sessionId}`, actions)
}

export async function getOfflineActions(sessionId: string): Promise<OfflineCheckinAction[]> {
  const data = await get<OfflineCheckinAction[]>(`offline_actions_${sessionId}`)
  return data || []
}

export async function clearOfflineActions(sessionId: string): Promise<void> {
  await del(`offline_actions_${sessionId}`)
}

export async function getListMetadata(eventId: string): Promise<{ downloadedAt: string; totalItems: number } | null> {
  const data = await get<{ downloadedAt: string; totalItems: number }>(`checkin_metadata_${eventId}`)
  return data || null
}

export async function clearCheckinData(eventId: string): Promise<void> {
  await del(`checkin_list_${eventId}`)
  await del(`checkin_metadata_${eventId}`)
}
