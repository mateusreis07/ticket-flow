export type Profile = {
  id: string
  name: string
  email: string
  role: 'buyer' | 'organizer'
  auth_provider: 'email' | 'google' | 'apple'
  needs_role_selection: boolean
  avatar_url: string | null
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

export type PaymentMethod = 'card' | 'pix'

export type CardInstallment = {
  quantity: number
  amount: number
  totalAmount: number
  label: string
}

export type CardPaymentData = {
  token: string
  installments: number
  paymentMethodId: string
  issuerId?: string
}

export type CardPaymentResult = {
  success: boolean
  orderId?: string
  error?: string
  statusDetail?: string
}

export type PixPaymentData = {
  mpPaymentId: string
  qrCode: string
  qrCodeBase64: string
  copyPaste: string
  expiresAt: string
}

export type MercadoPagoPaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'in_process'
  | 'refunded'

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
  payment_method: PaymentMethod
  mp_payment_id: string | null
  mp_external_reference: string | null
  mp_installments: number
  mp_installment_amount: number | null
  mp_card_last_four: string | null
  mp_card_brand: string | null
  mp_status_detail: string | null
  pix_qr_code: string | null
  pix_qr_code_base64: string | null
  pix_copy_paste: string | null
  pix_expires_at: string | null
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
  is_courtesy: boolean
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

// ─── Coupon Types ─────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed'

export type CouponAppliesTo =
  'all' | 'specific_event' | 'specific_ticket_type'

export type Coupon = {
  id: string
  organizer_id: string
  event_id: string | null
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  max_uses: number | null
  max_uses_per_user: number
  used_count: number
  is_active: boolean
  valid_from: string
  valid_until: string | null
  applies_to: CouponAppliesTo
  ticket_type_ids: string[] | null
  created_at: string
  updated_at: string
}

export type CouponUse = {
  id: string
  coupon_id: string
  order_id: string
  user_id: string
  discount_applied: number
  used_at: string
}

export type CouponValidationResult = {
  valid: boolean
  coupon?: Coupon
  discount_amount?: number
  new_total?: number
  error?: string
}

export type AppliedCoupon = {
  code: string
  discount_amount: number
  new_total: number
}

// ─── Check-in System Types ───────────────────────────────────────────────────

export type CheckinResult =
  'success' | 'already_used' | 'not_found' |
  'wrong_event' | 'manual_override'

export type CheckinSession = {
  id: string
  event_id: string
  organizer_id: string
  device_info: string | null
  started_at: string
  ended_at: string | null
  total_checkins: number
  is_active: boolean
}

export type CheckinLog = {
  id: string
  session_id: string
  ticket_id: string | null
  qr_code: string | null
  buyer_name: string | null
  ticket_type_name: string | null
  result: CheckinResult
  checked_in_at: string
  synced_at: string | null
  is_synced: boolean
  operator_note: string | null
}

export type CheckinListItem = {
  ticket_id: string
  qr_code: string
  buyer_name: string
  buyer_email: string
  ticket_type_name: string
  ticket_type_id: string
  order_id: string
  is_used: boolean
  used_at: string | null
  checkin_method: string | null
}

export type OfflineCheckinAction = {
  localId: string
  ticketId: string
  qrCode: string
  buyerName: string
  ticketTypeName: string
  result: CheckinResult
  timestamp: string
  synced: boolean
}

// ─── Courtesy & VIP System Types ─────────────────────────────────────────────

export type CourtesyListType =
  | 'courtesy' | 'vip' | 'press'
  | 'staff' | 'sponsor' | 'guest'

export type CourtesyEntryStatus =
  | 'pending' | 'sent' | 'confirmed'
  | 'cancelled' | 'expired'

export type CourtesyList = {
  id: string
  event_id: string
  organizer_id: string
  name: string
  description: string | null
  list_type: CourtesyListType
  max_entries: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CourtesyEntry = {
  id: string
  list_id: string
  event_id: string
  organizer_id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  guest_document: string | null
  ticket_type_id: string
  quantity: number
  note: string | null
  status: CourtesyEntryStatus
  sent_at: string | null
  confirmed_at: string | null
  expires_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type CourtesyEntryWithDetails = CourtesyEntry & {
  ticket_type_name: string
  ticket_type_price: number
  list_name: string
  list_type: CourtesyListType
  tickets?: { id: string, qr_code: string }[]
}

export type CourtesyStats = {
  event_id: string
  list_id: string
  list_name: string
  list_type: CourtesyListType
  total_entries: number
  total_tickets: number
  sent_count: number
  confirmed_count: number
  pending_count: number
  cancelled_count: number
}
