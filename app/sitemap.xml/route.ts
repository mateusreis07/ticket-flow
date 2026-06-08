import { getAllCitiesWithEvents, getAllCategoryStats, getCitySlug } from '@/lib/queries/seo'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // 1 hour cache

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [cities, categories, { data: events }] = await Promise.all([
    getAllCitiesWithEvents(),
    getAllCategoryStats(),
    supabase
      .from('events')
      .select('id, updated_at')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])
  ])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketflow.com.br'
  const now = new Date().toISOString()

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

  const addUrl = (url: string, priority: string, changefreq: string, lastmod: string = now) => {
    xml += `
  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  }

  // Core pages
  addUrl('', '1.0', 'daily')
  addUrl('/busca', '0.8', 'daily')
  addUrl('/eventos', '0.9', 'daily')
  addUrl('/auth/login', '0.3', 'weekly')
  addUrl('/auth/cadastro', '0.3', 'weekly')

  // City pages
  if (cities) {
    for (const city of cities) {
      addUrl(`/eventos/${getCitySlug(city.city)}`, '0.8', 'daily')
    }
  }

  // Category pages
  if (categories) {
    for (const cat of categories) {
      if (cat.count > 0) {
        addUrl(`/eventos/categoria/${cat.category}`, '0.7', 'daily')
      }
    }
  }

  // Event pages
  if (events) {
    for (const event of events) {
      addUrl(`/events/${event.id}`, '0.6', 'weekly', event.updated_at || now)
    }
  }

  xml += `\n</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
