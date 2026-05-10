'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { EventSearchParams } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import SearchFilters from './SearchFilters'
import { useSearchParams } from 'next/navigation'

interface MobileFilterDrawerProps {
  cities: string[]
  priceRange: { min: number; max: number }
  currentParams: EventSearchParams
  totalResults: number
}

export default function MobileFilterDrawer({ cities, priceRange, currentParams, totalResults }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()

  const activeFiltersCount = Array.from(searchParams.keys()).filter(key => key !== 'sort' && key !== 'page').length

  return (
    <div className="lg:hidden w-full mb-4">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs ml-1">
                {activeFiltersCount}
              </span>
            )}
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col h-full bg-gray-50">
          <SheetHeader className="p-5 border-b border-gray-200 bg-white">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-5">
            {/* We can re-use SearchFilters, but maybe hide its internal border/shadow since it's in a drawer */}
            <div className="[&>div]:border-none [&>div]:shadow-none [&>div]:p-0 [&>div]:bg-transparent">
              <SearchFilters 
                cities={cities} 
                priceRange={priceRange} 
                currentParams={currentParams} 
              />
            </div>
          </div>

          <div className="p-5 border-t border-gray-200 bg-white">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-primary text-white rounded-xl py-3 font-medium hover:bg-primary-hover transition-colors"
            >
              Ver {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
