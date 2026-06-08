import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { EventSearchResult, PaginatedResult } from '@/types'

// Cliente Supabase baunilha para chamadas estáticas sem depender de cookies,
// evitando erros de 'Dynamic server usage' com o unstable_cache
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Converte o nome de uma cidade para um slug amigável para URL.
 */
export function getCitySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Busca uma cidade no banco a partir do seu slug.
 */
export async function getCityFromSlug(slug: string): Promise<{ city: string; state: string } | null> {
  const { data } = await supabase
    .from('events')
    .select('city, state')
    .eq('status', 'published')

  if (!data) return null

  // Usar um Map/Set para pegar únicas (case insensitive)
  const uniqueCities = new Map<string, { city: string; state: string }>()
  data.forEach(item => {
    const key = item.city.toLowerCase()
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, { city: item.city, state: item.state })
    }
  })

  // Encontrar correspondência do slug
  for (const [_, item] of uniqueCities) {
    if (getCitySlug(item.city) === slug) {
      return item
    }
  }

  return null
}

/**
 * Busca todas as cidades que têm eventos publicados.
 */
export const getAllCitiesWithEvents = unstable_cache(
  async (): Promise<Array<{ city: string; state: string; count: number }>> => {
    // Busca agrupando no cliente para suportar qualquer versão do postgres facilmente
    const { data } = await supabase
      .from('events')
      .select('city, state')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])

    if (!data) return []

    const cityCount = new Map<string, { city: string; state: string; count: number }>()

    data.forEach(event => {
      const key = `${event.city}-${event.state}`
      const existing = cityCount.get(key)
      if (existing) {
        existing.count += 1
      } else {
        cityCount.set(key, { city: event.city, state: event.state, count: 1 })
      }
    })

    return Array.from(cityCount.values()).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
  },
  ['cities-with-events'],
  { revalidate: 3600 }
)

/**
 * Busca estatísticas de uma cidade (total de eventos, categorias e próximo evento)
 */
export const getCityStats = unstable_cache(
  async (city: string): Promise<{
    city: string
    state: string
    totalEvents: number
    categories: Array<{ category: string; count: number }>
    nextEvent: EventSearchResult | null
  } | null> => {
    // Ajustar city para ter sempre a grafia correta
    const realCityData = await supabase
      .from('events')
      .select('city, state')
      .ilike('city', city)
      .limit(1)
      .single()

    if (!realCityData.data) return null

    const realCity = realCityData.data.city
    const state = realCityData.data.state

    // Buscar todos os eventos dessa cidade para compor os status
    const { data: events } = await supabase
      .from('events_with_stats')
      .select('*')
      .ilike('city', city)
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })

    if (!events || events.length === 0) {
      return {
        city: realCity,
        state,
        totalEvents: 0,
        categories: [],
        nextEvent: null
      }
    }

    const categoriesCount = new Map<string, number>()
    events.forEach(e => {
      const cat = e.category
      if (cat) {
        categoriesCount.set(cat, (categoriesCount.get(cat) || 0) + 1)
      }
    })

    const categories = Array.from(categoriesCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    return {
      city: realCity,
      state,
      totalEvents: events.length,
      categories,
      nextEvent: (events[0] as unknown as EventSearchResult) || null
    }
  },
  ['city-stats'],
  { revalidate: 1800 }
)

/**
 * Paginação de eventos por cidade com cache
 */
export const getEventsByCity = unstable_cache(
  async (
    city: string,
    options: { category?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<EventSearchResult>> => {
    const page = options.page || 1
    const limit = options.limit || 12
    const offset = (page - 1) * limit

    let query = supabase
      .from('events_with_stats')
      .select('*', { count: 'exact' })
      .ilike('city', city)
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])

    if (options.category) {
      query = query.eq('category', options.category)
    }

    query = query.order('event_date', { ascending: true })
    query = query.range(offset, offset + limit - 1)

    const { data, count } = await query

    return {
      data: (data as unknown as EventSearchResult[]) || [],
      total: count || 0,
      page,
      perPage: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  },
  ['events-by-city'],
  { revalidate: 900 }
)

/**
 * Paginação de eventos por categoria
 */
export const getEventsByCategory = unstable_cache(
  async (
    category: string,
    options: { city?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<EventSearchResult>> => {
    const page = options.page || 1
    const limit = options.limit || 12
    const offset = (page - 1) * limit

    let query = supabase
      .from('events_with_stats')
      .select('*', { count: 'exact' })
      .eq('category', category)
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])

    if (options.city) {
      query = query.ilike('city', options.city)
    }

    query = query.order('event_date', { ascending: true })
    query = query.range(offset, offset + limit - 1)

    const { data, count } = await query

    return {
      data: (data as unknown as EventSearchResult[]) || [],
      total: count || 0,
      page,
      perPage: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  },
  ['events-by-category'],
  { revalidate: 900 }
)

/**
 * Busca estatísticas de todas as categorias
 */
export const getAllCategoryStats = unstable_cache(
  async (): Promise<Array<{ category: string; count: number; cities: string[] }>> => {
    const { data } = await supabase
      .from('events')
      .select('category, city')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])

    if (!data) return []

    const categoryMap = new Map<string, { count: number; cities: Set<string> }>()

    data.forEach(event => {
      const cat = event.category
      if (!cat) return
      
      const existing = categoryMap.get(cat)
      if (existing) {
        existing.count += 1
        if (event.city) existing.cities.add(event.city)
      } else {
        categoryMap.set(cat, {
          count: 1,
          cities: new Set(event.city ? [event.city] : [])
        })
      }
    })

    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        cities: Array.from(stats.cities).sort()
      }))
      .sort((a, b) => b.count - a.count)
  },
  ['category-stats'],
  { revalidate: 3600 }
)
