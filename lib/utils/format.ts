import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateString: string, formatStr: string = "EEE, dd MMM yyyy"): string {
  try {
    return format(new Date(dateString), formatStr, { locale: ptBR })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string, timeString: string): string {
  try {
    const dateFormatted = format(new Date(dateString), "EEE, dd MMM", { locale: ptBR })
    const timeFormatted = timeString.substring(0, 5) // HH:mm
    return `${dateFormatted} • ${timeFormatted}`
  } catch {
    return `${dateString} • ${timeString}`
  }
}

export function getEventStatus(event: any): 'available' | 'soldout' | 'cancelled' | 'past' {
  if (event.status === 'cancelled') return 'cancelled'
  
  const eventDate = new Date(event.event_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (eventDate < today) return 'past'
  if (event.total_capacity > 0 && event.total_sold >= event.total_capacity) return 'soldout'
  
  return 'available'
}
