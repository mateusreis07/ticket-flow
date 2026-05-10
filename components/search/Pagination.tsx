'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { EventSearchParams } from '@/types'

interface PaginationProps {
  currentPage: number
  totalPages: number
  searchParams: EventSearchParams
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentSearchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const params = new URLSearchParams(currentSearchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderPageNumbers = () => {
    const pages = []
    
    // Simple logic: if totalPages <= 7, show all
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Complex logic with ellipses
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      pages.push(totalPages)
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span key={`ellipsis-${index}`} className="text-gray-400 w-10 text-center flex items-center justify-center">
            ...
          </span>
        )
      }
      
      const isCurrent = page === currentPage
      
      return (
        <button
          key={`page-${page}`}
          onClick={() => goToPage(page as number)}
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
            ${isCurrent 
              ? 'bg-primary text-white' 
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}
          `}
        >
          {page}
        </button>
      )
    })
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Página anterior"
      >
        ←
      </button>
      
      {renderPageNumbers()}
      
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Próxima página"
      >
        →
      </button>
    </div>
  )
}
