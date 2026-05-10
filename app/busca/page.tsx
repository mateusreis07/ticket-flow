import { searchEvents, getCities, getPriceRange } from '@/lib/queries/events'
import { CATEGORIES, SORT_OPTIONS } from '@/lib/constants/events'
import { EventSearchParams, EventCategory } from '@/types'
import EventCard from '@/components/events/EventCard'
import EventCardSkeleton from '@/components/events/EventCardSkeleton'
import SearchFilters from '@/components/search/SearchFilters'
import Pagination from '@/components/search/Pagination'
import MobileFilterDrawer from '@/components/search/MobileFilterDrawer'
import SortSelect from '@/components/search/SortSelect'
import { SearchX, X } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const params: EventSearchParams = {
    q: searchParams.q,
    city: searchParams.city,
    category: searchParams.category as EventCategory,
    date_from: searchParams.date_from,
    date_to: searchParams.date_to,
    price_min: searchParams.price_min ? Number(searchParams.price_min) : undefined,
    price_max: searchParams.price_max ? Number(searchParams.price_max) : undefined,
    sort: searchParams.sort as any,
    page: searchParams.page ? Number(searchParams.page) : 1,
  }

  const [results, cities, priceRange] = await Promise.all([
    searchEvents(params),
    getCities(),
    getPriceRange()
  ])

  // Helpers to display active filters
  const activeFilters = []
  if (params.q) activeFilters.push({ key: 'q', label: `Busca: "${params.q}"` })
  if (params.city) activeFilters.push({ key: 'city', label: `Cidade: ${params.city}` })
  if (params.category) {
    const cat = CATEGORIES.find(c => c.value === params.category)
    if (cat) activeFilters.push({ key: 'category', label: `Categoria: ${cat.label}` })
  }
  if (params.date_from) activeFilters.push({ key: 'date_from', label: `A partir de: ${new Date(params.date_from).toLocaleDateString('pt-BR')}` })
  if (params.date_to) activeFilters.push({ key: 'date_to', label: `Até: ${new Date(params.date_to).toLocaleDateString('pt-BR')}` })
  if (params.price_min !== undefined) activeFilters.push({ key: 'price_min', label: `Min: R$ ${params.price_min}` })
  if (params.price_max !== undefined) activeFilters.push({ key: 'price_max', label: `Máx: R$ ${params.price_max}` })

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buscar eventos</h1>
        <p className="text-gray-500 mt-1">
          {params.q ? `Resultados para "${params.q}"` : 'Todos os eventos disponíveis'}
          {' '}— {results.total} evento(s) encontrado(s)
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Sidebar Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <SearchFilters 
            cities={cities} 
            priceRange={priceRange} 
            currentParams={params} 
          />
        </div>

        {/* Resultados */}
        <div className="lg:col-span-3">
          
          <MobileFilterDrawer 
            cities={cities} 
            priceRange={priceRange} 
            currentParams={params} 
            totalResults={results.total}
          />

          {/* Barra superior de resultados */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex gap-2 flex-wrap items-center">
              {activeFilters.map(filter => (
                <span key={filter.key} className="bg-primary-light text-primary border border-primary/20 rounded-full px-3 py-1 text-sm flex items-center gap-1.5">
                  {filter.label}
                  {/* The X doesn't do anything without JS, but the component works as a link to remove it */}
                  <Link 
                    href={{
                      pathname: '/busca',
                      query: { ...searchParams, [filter.key]: undefined, page: undefined }
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </Link>
                </span>
              ))}
              {activeFilters.length > 0 && (
                <Link 
                  href="/busca" 
                  className="text-sm text-gray-500 hover:text-red-500 ml-2"
                >
                  Limpar todos
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ordenar por:</span>
              <SortSelect />
            </div>
          </div>

          {/* Grid de resultados */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {results.data.length > 0 ? (
              results.data.map(event => (
                <EventCard key={event.id} event={event as any} />
              ))
            ) : (
              <div className="py-16 col-span-full text-center bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                <SearchX className="text-gray-300 h-12 w-12 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900 mt-4">Nenhum evento encontrado</h3>
                <p className="text-gray-500 mt-2">
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
                <Link 
                  href="/busca"
                  className="inline-block border border-gray-200 rounded-xl px-6 py-2.5 mt-6 hover:bg-gray-100 transition-colors font-medium text-gray-700 bg-white shadow-sm"
                >
                  Limpar filtros
                </Link>
              </div>
            )}
          </div>

          <Pagination 
            currentPage={results.page} 
            totalPages={results.totalPages} 
            searchParams={params} 
          />
        </div>
      </div>
    </main>
  )
}
