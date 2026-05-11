export type Profile = {
  id: string
  name: string
  email: string
  role: 'buyer' | 'organizer'
  created_at: string
}

export type Event = {
  id: string
  organizer_id: string
  title: string
  description: string
  cover_image_url: string | null
  location: string
  event_date: string
  event_time: string
  status: 'draft' | 'published' | 'cancelled'
  created_at: string
  updated_at: string
}

export type TicketType = {
  id: string
  event_id: string
  name: string
  price: number
  quantity_total: number
  quantity_sold: number
  is_active: boolean
}

export type Order = {
  id: string
  buyer_id: string
  event_id: string
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  total_amount: number
  stripe_session_id: string | null
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  ticket_type_id: string
  quantity: number
  unit_price: number
}

export type Ticket = {
  id: string
  order_id: string
  ticket_type_id: string
  buyer_id: string
  qr_code: string
  is_used: boolean
  used_at: string | null
}

export type TicketWithDetails = {
  id: string
  order_id: string
  ticket_type_id: string
  event_id: string
  buyer_id: string
  qr_code: string
  is_used: boolean
  used_at: string | null
  created_at: string
  event_title: string
  event_date: string
  event_time: string
  location: string
  city: string
  state: string
  cover_image_url: string | null
  ticket_type_name: string
  ticket_price: number
  buyer_name: string
  buyer_email: string
}

export type OverviewMetrics = {
  totalEvents: number
  publishedEvents: number
  totalTicketsSold: number
  totalRevenue: number
  pendingOrders: number
  nextEvent: {
    id: string
    title: string
    event_date: string
    event_time: string
    location: string
    city: string
  } | null
}

export type SalesDataPoint = {
  date: string
  orders: number
  revenue: number
}

export type TopEvent = {
  id: string
  title: string
  event_date: string
  status: string
  city: string
  state: string
  tickets_sold: number
  tickets_total: number
  revenue: number
}

export type RecentOrder = {
  id: string
  total_amount: number
  status: string
  created_at: string
  event_title: string
  buyer_name: string
  buyer_email: string
  items_count: number
  tickets_count: number
}

export type EventCategory = 
  | 'show' | 'festival' | 'workshop' | 'teatro'
  | 'esporte' | 'gastronomia' | 'tecnologia'
  | 'arte' | 'religioso' | 'outros'

export type EventSearchParams = {
  q?: string
  city?: string
  category?: EventCategory
  date_from?: string
  date_to?: string
  price_min?: number
  price_max?: number
  sort?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc'
  page?: number
}

export type EventSearchResult = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  location: string
  city: string
  state: string
  event_date: string
  event_time: string
  category: EventCategory
  status: string
  organizer_name: string
  min_price: number
  max_price: number
  total_sold: number
  total_capacity: number
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export type OrganizerProfile = {
  id: string
  name: string
  username: string | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  whatsapp: string | null
  city: string | null
  state: string | null
  is_verified: boolean
  created_at: string
  published_events_count: number
  upcoming_events_count: number
  past_events_count: number
  total_tickets_sold: number
  followers_count: number
}

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}
