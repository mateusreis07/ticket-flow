'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { EventSearchParams } from '@/types'
import { CATEGORIES } from '@/lib/constants/events'
import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'

interface SearchFiltersProps {
  cities: string[]
  priceRange: { min: number; max: number }
  currentParams: EventSearchParams
}

export default function SearchFilters({ cities, priceRange, currentParams }: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(currentParams.q || '')
  const [debouncedQ] = useDebounce(q, 400)

  const [priceMin, setPriceMin] = useState(currentParams.price_min?.toString() || '')
  const [debouncedPriceMin] = useDebounce(priceMin, 500)

  const [priceMax, setPriceMax] = useState(currentParams.price_max?.toString() || '')
  const [debouncedPriceMax] = useDebounce(priceMax, 500)

  // Avoid running on first mount if nothing changed, 
  // but ensure filters sync with debounce values
  useEffect(() => {
    if (debouncedQ !== (currentParams.q || '')) {
      updateFilter('q', debouncedQ)
    }
  }, [debouncedQ])

  useEffect(() => {
    if (debouncedPriceMin !== (currentParams.price_min?.toString() || '')) {
      updateFilter('price_min', debouncedPriceMin)
    }
  }, [debouncedPriceMin])

  useEffect(() => {
    if (debouncedPriceMax !== (currentParams.price_max?.toString() || '')) {
      updateFilter('price_max', debouncedPriceMax)
    }
  }, [debouncedPriceMax])

  const updateFilter = (key: string, value: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === undefined || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    // Reset page to 1 when filters change
    if (key !== 'page') {
      params.delete('page')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some(key => key !== 'sort' && key !== 'page')

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (searchParams.has('sort')) {
      params.set('sort', searchParams.get('sort')!)
    }
    setQ('')
    setPriceMin('')
    setPriceMax('')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">Filtros</h2>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-sm text-primary hover:text-primary-hover font-medium"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Busca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nome do evento, artista..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <select
            value={currentParams.city || ''}
            onChange={(e) => updateFilter('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Todas as cidades</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <hr className="border-gray-100" />

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => {
              const isSelected = currentParams.category === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => updateFilter('category', isSelected ? '' : cat.value)}
                  className={`
                    py-2 px-3 rounded-lg text-xs font-medium text-center w-full transition-all flex items-center justify-center gap-1.5
                    ${isSelected 
                      ? 'bg-primary text-white border-primary border' 
                      : 'border border-gray-200 text-gray-600 hover:border-primary/50'}
                  `}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">De</label>
              <input
                type="date"
                value={currentParams.date_from || ''}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => updateFilter('date_from', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Até</label>
              <input
                type="date"
                value={currentParams.date_to || ''}
                min={currentParams.date_from || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateFilter('date_to', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Faixa de preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Faixa de preço</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                min={0}
                step={10}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Mín R$"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <input
                type="number"
                min={0}
                step={10}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder={`Máx R$ ${priceRange.max}`}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Preços de R$ {priceRange.min} a R$ {priceRange.max} disponíveis
          </p>
        </div>
      </div>
    </div>
  )
}
