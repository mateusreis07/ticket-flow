import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { 
  getAllCategoryStats, 
  getEventsByCategory,
  getCitySlug
} from '@/lib/queries/seo'
import { CATEGORIES } from '@/lib/constants/events'
import EventCard from '@/components/events/EventCard'
import Pagination from '@/components/search/Pagination'
import BreadcrumbStructuredData from '@/components/seo/BreadcrumbStructuredData'

export async function generateStaticParams() {
  const stats = await getAllCategoryStats()
  return stats.map((stat) => ({
    categoria: stat.category,
  }))
}

export async function generateMetadata({ params }: { params: { categoria: string } }) {
  const catInfo = CATEGORIES.find(c => c.value === params.categoria)
  
  if (!catInfo) {
    return { title: 'Categoria inválida — TicketFlow' }
  }
  
  const title = `${catInfo.label} — Ingressos e eventos — TicketFlow`
  const description = `Encontre os melhores eventos de ${catInfo.label.toLowerCase()} com ingressos disponíveis. Compre online com segurança e receba seu ingresso digital.`

  return {
    title,
    description,
    keywords: [
      `${catInfo.label.toLowerCase()} com ingressos`,
      `ingressos para ${catInfo.label.toLowerCase()}`,
      `eventos de ${catInfo.label.toLowerCase()}`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
    },
    alternates: {
      canonical: `/eventos/categoria/${params.categoria}`,
    },
  }
}

export default async function CategoryEventsPage({
  params,
  searchParams,
}: {
  params: { categoria: string }
  searchParams: { cidade?: string; page?: string }
}) {
  const catInfo = CATEGORIES.find(c => c.value === params.categoria)
  
  if (!catInfo) {
    notFound()
  }

  const stats = await getAllCategoryStats()
  const catStats = stats.find(s => s.category === params.categoria)
  const currentPage = searchParams.page ? Number(searchParams.page) : 1
  const activeCity = searchParams.cidade

  const results = await getEventsByCategory(params.categoria, {
    city: activeCity,
    page: currentPage,
    limit: 12,
  })

  const breadcrumbItems = [
    { name: 'TicketFlow', url: '/' },
    { name: 'Eventos', url: '/eventos' },
    { name: catInfo.label, url: `/eventos/categoria/${params.categoria}` }
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
          <li className="text-gray-900 font-medium flex items-center gap-1">
            <span>{catInfo.emoji}</span> {catInfo.label}
          </li>
        </ol>
      </nav>

      {/* HERO DA CATEGORIA */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">{catInfo.emoji}</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{catInfo.label}</h1>
            <p className="text-gray-500 mt-1">
              {results.total} evento{results.total !== 1 && 's'} disponível{results.total !== 1 && 'is'}
            </p>
            
            {catStats && catStats.cities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {catStats.cities.slice(0, 5).map(city => (
                  <Link 
                    key={city}
                    href={`/eventos/${getCitySlug(city)}?categoria=${params.categoria}`}
                    className="bg-gray-100 text-gray-600 text-xs rounded-full px-3 py-1 hover:bg-primary-light hover:text-primary transition-colors"
                  >
                    {city}
                  </Link>
                ))}
                {catStats.cities.length > 5 && (
                  <span className="bg-gray-100 text-gray-400 text-xs rounded-full px-3 py-1">
                    +{catStats.cities.length - 5} cidades
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTRO POR CIDADE */}
      {catStats && catStats.cities.length > 1 && (
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Filtrar por cidade:</p>
          <div className="flex flex-wrap gap-2">
            <Link 
              href={`/eventos/categoria/${params.categoria}`}
              className={!activeCity 
                ? "bg-primary text-white rounded-full px-4 py-2 text-sm font-medium" 
                : "border border-gray-200 text-gray-600 rounded-full px-4 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
              }
            >
              Todas as cidades
            </Link>
            
            {catStats.cities.slice(0, 8).map(city => {
              const isActive = activeCity?.toLowerCase() === city.toLowerCase()
              
              return (
                <Link 
                  key={city}
                  href={`/eventos/categoria/${params.categoria}?cidade=${encodeURIComponent(city)}`}
                  className={isActive
                    ? "bg-primary text-white rounded-full px-4 py-2 text-sm font-medium" 
                    : "border border-gray-200 text-gray-600 rounded-full px-4 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
                  }
                >
                  {city}
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
            Ver todos os eventos
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{catInfo.label} — encontre os melhores eventos</h2>
        <p className="text-gray-600 leading-relaxed">
          Compre ingressos para {catInfo.label.toLowerCase()} online com segurança no TicketFlow. Descubra os principais encontros da sua região e receba seu ingresso digital instantaneamente após a aprovação do pagamento. Trabalhamos apenas com produtores verificados, promovendo experiências reais.
        </p>
      </section>

      {/* OUTRAS CATEGORIAS */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Outros tipos de eventos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {CATEGORIES.filter(c => c.value !== params.categoria).map(cat => {
            const catStat = stats.find(s => s.category === cat.value)
            
            return (
              <Link 
                key={cat.value} 
                href={`/eventos/categoria/${cat.value}`}
                className="border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center hover:border-primary hover:bg-primary-light/10 transition-colors"
              >
                <span className="text-2xl mb-1">{cat.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{cat.label}</span>
                {catStat && catStat.count > 0 && (
                  <span className="text-[10px] text-gray-400 mt-0.5">{catStat.count} eventos</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
