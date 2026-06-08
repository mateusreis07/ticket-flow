import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, MapPin } from 'lucide-react'
import { 
  getCityFromSlug, 
  getCityStats, 
  getEventsByCity, 
  getAllCitiesWithEvents,
  getCitySlug
} from '@/lib/queries/seo'
import { CATEGORIES } from '@/lib/constants/events'
import EventCard from '@/components/events/EventCard'
import Pagination from '@/components/search/Pagination'
import BreadcrumbStructuredData from '@/components/seo/BreadcrumbStructuredData'

export async function generateStaticParams() {
  const cities = await getAllCitiesWithEvents()
  return cities.map((city) => ({
    cidade: getCitySlug(city.city),
  }))
}

export async function generateMetadata({ params }: { params: { cidade: string } }) {
  const cityData = await getCityFromSlug(params.cidade)
  
  if (!cityData) {
    return { title: 'Cidade não encontrada — TicketFlow' }
  }

  const stats = await getCityStats(cityData.city)
  const total = stats?.totalEvents || 0
  
  const title = `Eventos em ${cityData.city}/${cityData.state} — TicketFlow`
  const description = `Encontre os melhores eventos em ${cityData.city}: shows, festivais, workshops e muito mais. ${total} eventos disponíveis.`

  return {
    title,
    description,
    keywords: [
      `eventos em ${cityData.city}`,
      `shows em ${cityData.city}`,
      `ingressos ${cityData.city}`,
      `o que fazer em ${cityData.city}`,
      `eventos ${cityData.state}`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
    },
    alternates: {
      canonical: `/eventos/${params.cidade}`,
    },
  }
}

export default async function CityEventsPage({
  params,
  searchParams,
}: {
  params: { cidade: string }
  searchParams: { categoria?: string; page?: string }
}) {
  const cityData = await getCityFromSlug(params.cidade)
  
  if (!cityData) {
    notFound()
  }

  const { city, state } = cityData
  const stats = await getCityStats(city)
  const currentPage = searchParams.page ? Number(searchParams.page) : 1
  const activeCategory = searchParams.categoria

  const results = await getEventsByCity(city, {
    category: activeCategory,
    page: currentPage,
    limit: 12,
  })

  // Para recomendação de cidades próximas
  const allCities = await getAllCitiesWithEvents()
  const stateCities = allCities.filter(
    c => c.state === state && getCitySlug(c.city) !== params.cidade
  )

  const breadcrumbItems = [
    { name: 'TicketFlow', url: '/' },
    { name: 'Eventos', url: '/eventos' },
    { name: `Eventos em ${city}`, url: `/eventos/${params.cidade}` }
  ]

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <BreadcrumbStructuredData items={breadcrumbItems} />

      {/* BREADCRUMB */}
      <nav aria-label="breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <li><Link href="/" className="text-primary hover:underline">TicketFlow</Link></li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li><Link href="/eventos" className="hover:underline">Eventos</Link></li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-gray-900 font-medium">{city}</li>
        </ol>
      </nav>

      {/* HERO DA CIDADE */}
      <div className="bg-gradient-to-r from-primary to-purple-700 rounded-2xl p-8 md:p-12 mb-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between relative z-10 gap-6">
          <div>
            <div className="bg-white/20 text-white text-sm rounded-full px-3 py-1 mb-3 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {state}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Eventos em {city}
            </h1>
            <p className="text-white/80 mt-2">
              {stats?.totalEvents || 0} eventos disponíveis
            </p>
          </div>

          {stats?.nextEvent && (
            <div className="mt-4 md:mt-0 bg-white/10 rounded-xl px-4 py-3 inline-block self-start backdrop-blur-sm border border-white/10 max-w-sm">
              <p className="text-xs text-white/70 uppercase font-semibold tracking-wider mb-1">Próximo evento</p>
              <p className="font-semibold text-white line-clamp-1">{stats.nextEvent.title}</p>
              <p className="text-white/80 text-sm">
                {new Date(`${stats.nextEvent.event_date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FILTRO POR CATEGORIA */}
      {stats && stats.categories.length > 1 && (
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Filtrar por categoria:</p>
          <div className="flex flex-wrap gap-2">
            <Link 
              href={`/eventos/${params.cidade}`}
              className={!activeCategory 
                ? "bg-primary text-white rounded-full px-4 py-2 text-sm font-medium" 
                : "border border-gray-200 text-gray-600 rounded-full px-4 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
              }
            >
              Todos
            </Link>
            
            {stats.categories.map(cat => {
              const catInfo = CATEGORIES.find(c => c.value === cat.category)
              if (!catInfo) return null
              
              const isActive = activeCategory === cat.category
              
              return (
                <Link 
                  key={cat.category}
                  href={`/eventos/${params.cidade}?categoria=${cat.category}`}
                  className={isActive
                    ? "bg-primary text-white rounded-full px-4 py-2 text-sm font-medium" 
                    : "border border-gray-200 text-gray-600 rounded-full px-4 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
                  }
                >
                  {catInfo.emoji} {catInfo.label} <span className="opacity-70 text-xs ml-1">({cat.count})</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* GRID DE EVENTOS */}
      {results.data.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.data.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
          <h3 className="text-xl font-semibold text-gray-900 mt-4">Nenhum evento encontrado</h3>
          <p className="text-gray-500 mt-2">
            Não encontramos eventos publicados para esta seleção.
          </p>
          <Link 
            href="/busca"
            className="inline-block border border-gray-200 rounded-xl px-6 py-2.5 mt-6 hover:bg-gray-100 transition-colors font-medium text-gray-700 bg-white shadow-sm"
          >
            Buscar em todas as cidades
          </Link>
        </div>
      )}

      {/* PAGINAÇÃO */}
      {results.totalPages > 1 && (
        <div className="mt-8">
          <Pagination currentPage={results.page} totalPages={results.totalPages} />
        </div>
      )}

      {/* SEÇÃO SEO */}
      <section className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Eventos e ingressos em {city}</h2>
        <p className="text-gray-600 leading-relaxed">
          O TicketFlow é a plataforma de ingressos digitais oficial em {city}. Encontre shows, festivais, workshops e outros eventos em {city}/{state} com ingressos disponíveis online. Comprar pelo nosso aplicativo web é 100% seguro. Basta criar sua conta e garantir seu QR Code exclusivo para acessar os melhores momentos na sua região sem se preocupar com impressão ou filas em bilheteria física.
        </p>

        {stats && stats.categories.length > 0 && (
          <p className="text-gray-600 mt-3">
            Em {city} você encontra eventos de {stats.categories.map(c => CATEGORIES.find(cat => cat.value === c.category)?.label).filter(Boolean).join(', ')}. Compre seu ingresso digital com segurança.
          </p>
        )}
      </section>

      {/* CIDADES PRÓXIMAS */}
      {stateCities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Outros eventos em {state}</h3>
          <div className="flex flex-wrap gap-2">
            {stateCities.map(c => (
              <Link 
                key={c.city}
                href={`/eventos/${getCitySlug(c.city)}`}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors bg-white shadow-sm"
              >
                {c.city}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
