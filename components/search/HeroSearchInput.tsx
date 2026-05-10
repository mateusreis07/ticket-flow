'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface HeroSearchInputProps {
  initialQuery?: string
}

export default function HeroSearchInput({ initialQuery = '' }: HeroSearchInputProps) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push('/busca')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="shadow-lg rounded-2xl border border-gray-200 flex items-center overflow-hidden bg-white max-w-2xl mx-auto">
      <Search className="h-5 w-5 text-gray-400 ml-5 flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar eventos, artistas, cidades..."
        className="flex-1 px-4 py-4 text-base outline-none text-gray-800"
      />
      <button
        onClick={handleSearch}
        className="bg-primary text-white px-6 py-4 font-medium hover:bg-primary-hover transition-colors"
      >
        Buscar
      </button>
    </div>
  )
}
