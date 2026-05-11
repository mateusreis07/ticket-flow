'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, CheckCircle2, Clock, XCircle,
  ArrowLeftRight, Sparkles, Tag,
} from 'lucide-react'

interface PushNotification {
  id: string
  user_id: string
  title: string
  body: string
  url: string | null
  type: string
  sent_at: string
  is_read: boolean
  read_at: string | null
}

interface NotificationBellProps {
  userId: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order_confirmed: <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />,
  event_reminder: <Clock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />,
  event_cancelled: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />,
  ticket_transferred: <ArrowLeftRight className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />,
  new_event: <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />,
  promotional: <Tag className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />,
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

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // Silencioso — não quebrar a UI
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Polling a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications, userId])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleNotificationClick = async (notification: PushNotification) => {
    if (!notification.is_read) await markAsRead(notification.id)
    setIsOpen(false)
    if (notification.url) router.push(notification.url)
  }

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    await Promise.all(unread.map((n) => markAsRead(n.id)))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl w-80 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-gray-500 text-sm mt-2">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="w-full flex gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-left transition-colors"
                >
                  {TYPE_ICONS[n.type] ?? <Bell className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm leading-tight">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.sent_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 py-3 text-center">
            <button
              onClick={() => { setIsOpen(false); router.push('/notificacoes') }}
              className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
            >
              Ver todas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
