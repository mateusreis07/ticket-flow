import { EventCategory } from '@/types'

export const CATEGORIES: { value: EventCategory; label: string; emoji: string }[] = [
  { value: 'show', label: 'Shows', emoji: '🎸' },
  { value: 'festival', label: 'Festivais', emoji: '🎪' },
  { value: 'workshop', label: 'Workshops', emoji: '🎓' },
  { value: 'teatro', label: 'Teatro', emoji: '🎭' },
  { value: 'esporte', label: 'Esportes', emoji: '⚽' },
  { value: 'gastronomia', label: 'Gastronomia', emoji: '🍽️' },
  { value: 'tecnologia', label: 'Tecnologia', emoji: '💻' },
  { value: 'arte', label: 'Arte', emoji: '🎨' },
  { value: 'religioso', label: 'Religioso', emoji: '✨' },
  { value: 'outros', label: 'Outros', emoji: '📌' },
]

export const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Data: mais próximos' },
  { value: 'date_desc', label: 'Data: mais distantes' },
  { value: 'price_asc', label: 'Preço: menor primeiro' },
  { value: 'price_desc', label: 'Preço: maior primeiro' },
]
