'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HeaderSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  // Não mostrar na homepage, pois lá já tem a busca principal grande
  if (pathname === '/') return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar eventos..."
        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all"
      />
    </form>
  )
}
