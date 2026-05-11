'use client'

import { markAllAsRead } from './actions'

interface MarkAllReadButtonProps {
  userId: string
}

export function MarkAllReadButton({ userId }: MarkAllReadButtonProps) {
  return (
    <form action={async () => { await markAllAsRead(userId) }}>
      <button
        type="submit"
        className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
      >
        Marcar todas como lidas
      </button>
    </form>
  )
}
