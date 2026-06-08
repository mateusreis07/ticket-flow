import { getAllCitiesWithEvents, getAllCategoryStats, getCitySlug } from '@/lib/queries/seo'
import { CATEGORIES } from '@/lib/constants/events'
import Link from 'next/link'
import HeroSearchInput from '@/components/search/HeroSearchInput'

export const metadata = {
  title: 'Eventos com ingressos disponíveis — TicketFlow',
  description: 'Encontre eventos em todo o Brasil. Shows, festivais, workshops e muito mais com ingressos digitais.'
}

export default async function EventosHubPage() {
  const [allCities, allCategoryStats] = await Promise.all([
    getAllCitiesWithEvents(),
    getAllCategoryStats()
  ])

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Eventos em todo o Brasil</h1>
        <p className="text-xl text-gray-500 mt-3">
          Encontre eventos na sua cidade com ingressos disponíveis online
        </p>
        <div className="max-w-lg mx-auto mt-6">
          <HeroSearchInput />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Explorar por tipo de evento</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CATEGORIES.map(cat => {
          const stats = allCategoryStats.find(s => s.category === cat.value)
          if (!stats || stats.count === 0) return null
          
          return (
            <Link key={cat.value} href={`/eventos/categoria/${cat.value}`} className="group">
              <div className="border border-gray-200 rounded-2xl p-5 text-center hover:border-primary hover:bg-primary-light/30 transition-all cursor-pointer h-full">
                <span className="text-3xl block mb-2">{cat.emoji}</span>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
                  {cat.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count} evento{stats.count !== 1 && 's'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Eventos por cidade</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allCities.map(city => (
          <Link key={`${city.city}-${city.state}`} href={`/eventos/${getCitySlug(city.city)}`} className="group">
            <div className="border border-gray-200 rounded-2xl p-5 hover:border-primary hover:shadow-sm transition-all h-full flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {city.city}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{city.state}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{city.count}</p>
                  <p className="text-xs text-gray-400">evento{city.count !== 1 && 's'}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-12 border-t border-gray-100 pt-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Compre ingressos online com segurança</h2>
          <p className="text-gray-600 leading-relaxed">
            O TicketFlow é a plataforma definitiva para você encontrar e garantir ingressos digitais para os melhores eventos do Brasil. Seja para aquele show internacional muito aguardado, festivais de música, workshops de especialização ou peças de teatro, nossa plataforma conecta você às experiências mais incríveis de forma rápida e segura. Compre seu ingresso online, receba o QR Code instantaneamente no seu celular e não pegue filas na bilheteria.
          </p>
        </div>
      </section>
    </main>
  )
}
