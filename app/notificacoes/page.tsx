import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, CheckCircle2, Clock, XCircle, ArrowLeftRight, Sparkles, Tag } from 'lucide-react'
import { MarkAllReadButton } from '@/components/notifications/MarkAllReadButton'

interface PushNotification {
  id: string
  type: string
  title: string
  body: string
  sent_at: string
  is_read: boolean
  url: string | null
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order_confirmed: <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />,
  event_reminder: <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />,
  event_cancelled: <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />,
  ticket_transferred: <ArrowLeftRight className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />,
  new_event: <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />,
  promotional: <Tag className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />,
}

function groupByDate(notifications: PushNotification[]): Record<string, PushNotification[]> {
  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7)

  const groups: Record<string, PushNotification[]> = {
    'Hoje': [],
    'Ontem': [],
    'Esta semana': [],
    'Mais antigas': [],
  }

  for (const n of notifications) {
    const d = new Date(n.sent_at)
    if (d >= today) groups['Hoje'].push(n)
    else if (d >= yesterday) groups['Ontem'].push(n)
    else if (d >= weekAgo) groups['Esta semana'].push(n)
    else groups['Mais antigas'].push(n)
  }

  return groups
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days} dia${days > 1 ? 's' : ''}`
}

export default async function NotificacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/notificacoes')

  const { data: notifications } = await supabase
    .from('push_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(50)

  const allNotifications = (notifications ?? []) as PushNotification[]
  const unreadCount = allNotifications.filter(n => !n.is_read).length
  const grouped = groupByDate(allNotifications)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && <MarkAllReadButton userId={user.id} />}
      </div>

      {allNotifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="h-16 w-16 text-gray-200 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Tudo em dia!</h2>
          <p className="text-gray-500 mt-2">Suas notificações aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([period, items]) => {
            if (items.length === 0) return null
            return (
              <div key={period}>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  {period}
                </h3>
                <div className="space-y-1">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 p-4 rounded-xl border transition-colors ${
                        n.is_read
                          ? 'bg-white border-gray-100'
                          : 'bg-primary/[0.03] border-primary/10'
                      }`}
                    >
                      {TYPE_ICONS[n.type] ?? <Bell className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1.5">{timeAgo(n.sent_at)}</p>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
