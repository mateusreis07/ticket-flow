'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, MoreVertical, Search, Filter, Download, UserPlus, Upload, Send, Trash2, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CourtesyListModal } from '@/components/courtesy/CourtesyListModal'
import { CourtesyEntryModal } from '@/components/courtesy/CourtesyEntryModal'
import { ImportCSVModal } from '@/components/courtesy/ImportCSVModal'
import { deleteCourtesyList, cancelCourtesyEntry, issueAllPending } from '@/lib/actions/courtesy'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const listTypeConfig = {
  vip: { label: 'VIP', emoji: '⭐', style: 'bg-amber-100 text-amber-700' },
  press: { label: 'Imprensa', emoji: '📰', style: 'bg-blue-100 text-blue-700' },
  staff: { label: 'Staff', emoji: '🎪', style: 'bg-purple-100 text-purple-700' },
  sponsor: { label: 'Patrocinadores', emoji: '🤝', style: 'bg-green-100 text-green-700' },
  guest: { label: 'Convidados', emoji: '🎟', style: 'bg-pink-100 text-pink-700' },
  courtesy: { label: 'Cortesia', emoji: '🎁', style: 'bg-primary/10 text-primary' },
}

export function CourtesyListsClient({ initialLists, eventId, ticketTypes }: { initialLists: any[], eventId: string, ticketTypes: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [openLists, setOpenLists] = useState<Record<string, boolean>>({})
  const [entriesCache, setEntriesCache] = useState<Record<string, any[]>>({})
  
  // Modals state
  const [listModalOpen, setListModalOpen] = useState(false)
  const [activeList, setActiveList] = useState<any>(null)
  
  const [entryModalOpen, setEntryModalOpen] = useState(false)
  const [activeEntryListId, setActiveEntryListId] = useState<string>('')
  const [activeEntry, setActiveEntry] = useState<any>(null)
  
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Handlers
  const toggleList = async (listId: string) => {
    const isNowOpen = !openLists[listId]
    setOpenLists(prev => ({ ...prev, [listId]: isNowOpen }))
    
    if (isNowOpen && !entriesCache[listId]) {
      loadEntries(listId)
    }
  }

  const loadEntries = async (listId: string) => {
    const { data } = await supabase
      .from('courtesy_entries')
      .select('*, ticket_types(name)')
      .eq('list_id', listId)
      .order('created_at', { ascending: false })
      
    if (data) {
      setEntriesCache(prev => ({ ...prev, [listId]: data }))
    }
  }

  // Effect to reload entries if initialLists changes (e.g. after a server action)
  useEffect(() => {
    // Para atualizar contadores ou recarregar listas abertas silenciosamente
    Object.keys(openLists).forEach(id => {
      if (openLists[id]) loadEntries(id)
    })
  }, [initialLists])

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return
    const res = await deleteCourtesyList(listId, eventId)
    if (res.success) toast.success('Lista excluída com sucesso.')
    else toast.error(res.error)
  }

  const handleIssueEntry = async (entryId: string) => {
    toast.loading('Emitindo ingresso...', { id: 'issue' })
    const res = await fetch('/api/courtesy/issue', {
      method: 'POST',
      body: JSON.stringify({ entryId }),
      headers: { 'Content-Type': 'application/json' }
    })
    const result = await res.json()
    if (result.success) {
      toast.success('Ingresso emitido e enviado!', { id: 'issue' })
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao emitir', { id: 'issue' })
    }
  }

  const handleIssueAll = async (listId: string) => {
    toast.loading('Emitindo ingressos pendentes...', { id: 'issue-all' })
    const res = await issueAllPending(listId, eventId)
    if (res.success) {
      toast.success(`${res.issued} ingressos emitidos!`, { id: 'issue-all' })
    } else {
      toast.error(res.error || 'Erro ao emitir em lote', { id: 'issue-all' })
    }
  }

  const handleRevoke = async (entryId: string) => {
    if (!confirm('Isto invalidará os ingressos emitidos. Continuar?')) return
    toast.loading('Revogando...', { id: 'revoke' })
    const res = await fetch('/api/courtesy/revoke', {
      method: 'POST',
      body: JSON.stringify({ entryId }),
      headers: { 'Content-Type': 'application/json' }
    })
    const result = await res.json()
    if (result.success) {
      toast.success('Entrada revogada!', { id: 'revoke' })
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao revogar', { id: 'revoke' })
    }
  }

  const handleCancel = async (entryId: string) => {
     if (!confirm('Cancelar esta entrada?')) return
     const res = await cancelCourtesyEntry(entryId, eventId)
     if (res.success) toast.success('Cancelado com sucesso.')
     else toast.error(res.error)
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md font-medium">Pendente</span>
      case 'sent': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-medium">Enviado</span>
      case 'confirmed': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md font-medium">Confirmado</span>
      case 'cancelled': return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md font-medium">Cancelado</span>
      case 'expired': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-md font-medium">Expirado</span>
      default: return null
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4 -mt-16">
        <Button onClick={() => { setActiveList(null); setListModalOpen(true); }} className="bg-primary hover:bg-primary-dark shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova lista
        </Button>
      </div>

      <div className="space-y-4">
        {initialLists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nenhuma lista criada</h3>
            <p className="text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
              Crie listas VIP, de imprensa ou cortesia para organizar seus convidados especiais.
            </p>
            <Button onClick={() => { setActiveList(null); setListModalOpen(true); }} className="bg-primary hover:bg-primary-dark">
              Criar primeira lista
            </Button>
          </div>
        ) : (
          initialLists.map((list) => {
            const isOpen = openLists[list.id]
            const config = listTypeConfig[list.list_type as keyof typeof listTypeConfig] || listTypeConfig.courtesy
            const progress = list.total_entries > 0 ? ((list.sent_count + list.confirmed_count) / list.total_entries) * 100 : 0
            
            return (
              <div key={list.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200">
                {/* Cabeçalho do Card */}
                <div 
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50"
                  onClick={() => toggleList(list.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex h-12 w-12 rounded-xl border border-gray-100 bg-white shadow-sm items-center justify-center text-2xl">
                      {config.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.style}`}>
                          {config.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900">{list.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {list.total_entries} convidados · {list.total_tickets} ingressos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress Mini */}
                    <div className="hidden md:flex flex-col items-end mr-4">
                      <span className="text-xs font-medium text-gray-500 mb-1">
                        {list.sent_count + list.confirmed_count} / {list.total_entries} emitidos
                      </span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors outline-none">
                          <MoreVertical className="h-5 w-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-white border border-gray-100 shadow-2xl z-[100] rounded-xl p-2">
                          <DropdownMenuItem onClick={() => { setActiveEntryListId(list.id); setActiveEntry(null); setEntryModalOpen(true); }} className="flex items-center px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                            <UserPlus className="mr-3 h-4 w-4 text-gray-400" /> 
                            <span className="font-medium text-gray-700">Adicionar convidado</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setActiveEntryListId(list.id); setImportModalOpen(true); }} className="flex items-center px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                            <Upload className="mr-3 h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">Importar CSV</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleIssueAll(list.id)} disabled={list.pending_count === 0} className="flex items-center px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">
                            <Send className="mr-3 h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">Emitir pendentes ({list.pending_count})</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2 border-t border-gray-100" />
                          <DropdownMenuItem onClick={() => { setActiveList(list); setListModalOpen(true); }} className="flex items-center px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                            <Edit className="mr-3 h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">Editar lista</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteList(list.id)} className="flex items-center px-3 py-2.5 text-sm cursor-pointer hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                            <Trash2 className="mr-3 h-4 w-4" />
                            <span className="font-bold">Excluir lista</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="text-gray-400">
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/30 p-5">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input placeholder="Buscar por nome ou e-mail..." className="pl-9 h-9 text-sm" />
                        </div>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                          <Filter className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto font-medium" 
                          onClick={() => { setActiveEntryListId(list.id); setActiveEntry(null); setEntryModalOpen(true); }}
                        >
                          <UserPlus className="mr-2 h-4 w-4 text-gray-500" /> Novo
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 shrink-0"
                          onClick={() => { setActiveEntryListId(list.id); setImportModalOpen(true); }}
                        >
                          CSV
                        </Button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                          <tr>
                            <th className="px-4 py-3">Convidado</th>
                            <th className="px-4 py-3">Ingresso</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {entriesCache[list.id] === undefined ? (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-500"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                          ) : entriesCache[list.id].length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhum convidado nesta lista.</td></tr>
                          ) : (
                            entriesCache[list.id].map(entry => (
                              <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{entry.guest_name}</div>
                                  <div className="text-xs text-gray-500">{entry.guest_email}</div>
                                  {entry.guest_phone && <div className="text-[10px] text-gray-400 mt-0.5">{entry.guest_phone}</div>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-900 font-medium">{entry.ticket_types?.name}</span>
                                    {entry.quantity > 1 && (
                                      <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                        {entry.quantity}x
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {getStatusBadge(entry.status)}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                  {entry.status === 'pending' && (
                                    <>
                                      <button onClick={() => handleIssueEntry(entry.id)} className="text-primary hover:text-primary-dark font-medium text-xs px-2">Emitir</button>
                                      <button onClick={() => { setActiveEntryListId(list.id); setActiveEntry(entry); setEntryModalOpen(true); }} className="text-gray-500 hover:text-gray-900 font-medium text-xs px-2">Editar</button>
                                      <button onClick={() => handleCancel(entry.id)} className="text-red-500 hover:text-red-700 font-medium text-xs px-2">Cancelar</button>
                                    </>
                                  )}
                                  {entry.status === 'sent' && (
                                    <>
                                      <button onClick={() => handleIssueEntry(entry.id)} className="text-gray-500 hover:text-gray-900 font-medium text-xs px-2">Reenviar</button>
                                      <button onClick={() => handleRevoke(entry.id)} className="text-red-500 hover:text-red-700 font-medium text-xs px-2">Revogar</button>
                                    </>
                                  )}
                                  {entry.status === 'confirmed' && (
                                    <button onClick={() => handleRevoke(entry.id)} className="text-red-500 hover:text-red-700 font-medium text-xs px-2">Revogar</button>
                                  )}
                                  {(entry.status === 'cancelled' || entry.status === 'expired') && (
                                    <button onClick={() => { setActiveEntryListId(list.id); setActiveEntry(entry); setEntryModalOpen(true); }} className="text-primary hover:text-primary-dark font-medium text-xs px-2">Reativar</button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <CourtesyListModal 
        key={`list-modal-${listModalOpen}-${activeList?.id || 'new'}`}
        isOpen={listModalOpen} 
        onClose={() => setListModalOpen(false)} 
        eventId={eventId} 
        list={activeList} 
      />

      <CourtesyEntryModal
        key={`entry-modal-${entryModalOpen}-${activeEntry?.id || 'new'}`}
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        listId={activeEntryListId}
        eventId={eventId}
        ticketTypes={ticketTypes}
        entry={activeEntry}
      />

      <ImportCSVModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        listId={activeEntryListId}
        eventId={eventId}
      />
    </>
  )
}

function Gift(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}
