import { supabaseAdmin } from '@/lib/supabase/admin'
import { OrganizerProfile, EventSearchResult, PaginatedResult } from '@/types'

export async function getOrganizerByUsername(username: string): Promise<OrganizerProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('organizer_profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !data) return null
  return data as OrganizerProfile
}

export async function getOrganizerById(id: string): Promise<OrganizerProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('organizer_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as OrganizerProfile
}

export async function getOrganizerEvents(
  organizerId: string,
  options: { filter: 'upcoming' | 'past' | 'all'; page?: number }
): Promise<PaginatedResult<EventSearchResult>> {
  const page = options.page || 1
  const limit = 9
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('events_with_stats')
    .select('*', { count: 'exact' })
    .eq('organizer_id', organizerId)
    .eq('status', 'published')

  const today = new Date().toISOString().split('T')[0]

  if (options.filter === 'upcoming') {
    query = query.gte('event_date', today).order('event_date', { ascending: true })
  } else if (options.filter === 'past') {
    query = query.lt('event_date', today).order('event_date', { ascending: false })
  } else {
    query = query.order('event_date', { ascending: false })
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching organizer events:', error)
    return { data: [], total: 0, page, perPage: limit, totalPages: 0 }
  }

  return {
    data: (data as any[]).map(d => ({
      ...d,
      category: d.category as any
    })) as EventSearchResult[],
    total: count || 0,
    page,
    perPage: limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { count, error } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) return false
  return (count || 0) > 0
}

export async function getTopOrganizers(limit: number = 6): Promise<OrganizerProfile[]> {
  const { data, error } = await supabaseAdmin
    .from('organizer_profiles')
    .select('*')
    .order('followers_count', { ascending: false })
    .order('published_events_count', { ascending: false })
    .limit(limit)

  if (error) return []
  return data as OrganizerProfile[]
}
