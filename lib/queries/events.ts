import { createClient } from '@/lib/supabase/server'
import { EventSearchParams, EventSearchResult, PaginatedResult } from '@/types'

export async function searchEvents(params: EventSearchParams): Promise<PaginatedResult<EventSearchResult>> {
  const supabase = await createClient()
  
  const PER_PAGE = 12
  const page = params.page ?? 1
  const offset = (page - 1) * PER_PAGE

  let query = supabase
    .from('events_with_stats')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString().split('T')[0])

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,city.ilike.%${params.q}%`)
  }

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }

  if (params.category) {
    query = query.eq('category', params.category)
  }

  if (params.date_from) {
    query = query.gte('event_date', params.date_from)
  }

  if (params.date_to) {
    query = query.lte('event_date', params.date_to)
  }

  if (params.price_min !== undefined) {
    query = query.gte('min_price', params.price_min)
  }

  if (params.price_max !== undefined) {
    query = query.lte('max_price', params.price_max)
  }

  switch (params.sort) {
    case 'date_asc':
      query = query.order('event_date', { ascending: true })
      break
    case 'date_desc':
      query = query.order('event_date', { ascending: false })
      break
    case 'price_asc':
      query = query.order('min_price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('min_price', { ascending: false })
      break
    default:
      query = query.order('event_date', { ascending: true })
  }

  query = query.range(offset, offset + PER_PAGE - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error searching events:', error)
    return {
      data: [],
      total: 0,
      page,
      perPage: PER_PAGE,
      totalPages: 0
    }
  }

  return {
    data: (data as any) || [],
    total: count ?? 0,
    page,
    perPage: PER_PAGE,
    totalPages: Math.ceil((count ?? 0) / PER_PAGE)
  }
}

export async function getCities(): Promise<string[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select('city')
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('city', { ascending: true })

  if (error || !data) {
    return []
  }

  const cities = Array.from(new Set(data.map(e => e.city)))
  return cities
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const supabase = await createClient()
  
  // Custom RPC or simplified query to get the range of active published tickets
  const { data, error } = await supabase
    .from('events_with_stats')
    .select('min_price, max_price')
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString().split('T')[0])

  if (error || !data || data.length === 0) {
    return { min: 0, max: 1000 } // Default fallback
  }

  let min = data[0].min_price
  let max = data[0].max_price

  data.forEach(e => {
    if (e.min_price < min) min = e.min_price
    if (e.max_price > max) max = e.max_price
  })

  return { min, max }
}
