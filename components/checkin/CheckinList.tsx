'use client'

import { useMemo } from 'react'
import { CheckinListItem } from '@/types'
import { Search, Download } from 'lucide-react'
import CheckinListItemCard from './CheckinListItemCard'

interface Props {
  items: CheckinListItem[]
  searchQuery: string
  onSearchChange: (q: string) => void
  filterType: 'all' | 'pending' | 'done'
  onFilterChange: (f: 'all' | 'pending' | 'done') => void
  selectedTicketType: string
  onTicketTypeChange: (t: string) => void
  onCheckin: (item: CheckinListItem, method: 'manual_list' | 'manual_override') => void
  isOnline: boolean
  lastDownloadedAt: string | null
  onDownloadList: () => void
}

export default function CheckinList({
  items,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  selectedTicketType,
  onTicketTypeChange,
  onCheckin,
  isOnline,
  lastDownloadedAt,
  onDownloadList
}: Props) {
  
  const ticketTypes = useMemo(() => {
    const types = new Set(items.map(i => i.ticket_type_name))
    return Array.from(types)
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!item.buyer_name.toLowerCase().includes(q) &&
            !item.buyer_email.toLowerCase().includes(q) &&
            !item.qr_code.toLowerCase().includes(q)) {
          return false
        }
      }
      
      // 2. Status
      if (filterType === 'pending' && item.is_used) return false
      if (filterType === 'done' && !item.is_used) return false

      // 3. Type
      if (selectedTicketType !== 'all' && item.ticket_type_name !== selectedTicketType) return false

      return true
    })
  }, [items, searchQuery, filterType, selectedTicketType])

  const counts = useMemo(() => {
    const pending = items.filter(i => !i.is_used).length
    const done = items.filter(i => i.is_used).length
    return { pending, done, total: items.length }
  }, [items])

  const timeAgo = (dateStr: string) => {
    const minDiff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (minDiff < 1) return 'agora mesmo'
    if (minDiff < 60) return `há ${minDiff} min`
    return `há ${Math.floor(minDiff/60)} h`
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER DE BUSCA E FILTROS */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail..."
            className="pl-10 w-full rounded-xl border border-gray-200 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
          <button
            onClick={() => onFilterChange('all')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${filterType === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
          >
            Todos ({counts.total})
          </button>
          <button
            onClick={() => onFilterChange('pending')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${filterType === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-50 text-amber-600/70 border-amber-100 hover:bg-amber-100'}`}
          >
            Pendentes ({counts.pending})
          </button>
          <button
            onClick={() => onFilterChange('done')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${filterType === 'done' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-green-50 text-green-600/70 border-green-100 hover:bg-green-100'}`}
          >
            Confirmados ({counts.done})
          </button>

          <div className="w-px bg-gray-200 mx-1 flex-shrink-0" />

          <select
            value={selectedTicketType}
            onChange={(e) => onTicketTypeChange(e.target.value)}
            className="flex-shrink-0 text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 outline-none"
          >
            <option value="all">Todos os tipos</option>
            {ticketTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {lastDownloadedAt && (
          <div className="mt-2 text-[10px] text-gray-400">
            Lista atualizada {timeAgo(lastDownloadedAt)}
            {items.length === 0 && (
              <div className="mt-1 text-xs">
                Nenhum participante encontrado. <button onClick={onDownloadList} className="text-primary font-medium underline">Baixar agora</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 font-medium border-b border-gray-100">
        {filteredItems.length} participante(s) encontrado(s) {filteredItems.length !== items.length && `de ${items.length} total`}
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Lista não baixada</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Clique em "Atualizar lista" no menu superior para baixar os participantes deste evento para uso offline.
            </p>
            <button
              onClick={onDownloadList}
              className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Baixar Lista
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-500 text-sm">
            Nenhum participante encontrado com os filtros atuais.
          </div>
        ) : (
          <div>
            {filteredItems.map(item => (
              <CheckinListItemCard
                key={item.ticket_id}
                item={item}
                onCheckin={onCheckin}
                isOnline={isOnline}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
