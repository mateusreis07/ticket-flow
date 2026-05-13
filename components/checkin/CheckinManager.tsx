'use client'

import { useState, useEffect, useCallback } from 'react'
import { Event, CheckinSession, CheckinListItem, OfflineCheckinAction } from '@/types'
import { 
  getCheckinList, saveCheckinList, updateCheckinItem, 
  getOfflineActions, saveOfflineAction, clearOfflineActions, getListMetadata 
} from '@/lib/checkin-db'
import CheckinList from './CheckinList'
import ScannerWrapper from './ScannerWrapper'
import { WifiOff, Loader2, Download, List, QrCode, CheckCircle2, ChevronLeft, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  event: Event
  overview: any
  activeSession: CheckinSession | null
}

export default function CheckinManager({ event, overview, activeSession }: Props) {
  const router = useRouter()
  
  const [session, setSession] = useState<CheckinSession | null>(activeSession)
  const [listItems, setListItems] = useState<CheckinListItem[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'done'>('all')
  const [selectedTicketType, setSelectedTicketType] = useState('all')
  
  const [isOnline, setIsOnline] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const [offlineActions, setOfflineActions] = useState<OfflineCheckinAction[]>([])
  const [lastDownloadedAt, setLastDownloadedAt] = useState<string | null>(null)
  
  const [showScanner, setShowScanner] = useState(false)
  const [recentCheckins, setRecentCheckins] = useState<CheckinListItem[]>([])

  // Online status listener
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync effect
  useEffect(() => {
    if (isOnline && offlineActions.length > 0 && !isSyncing) {
      handleSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, offlineActions.length])

  // Init
  useEffect(() => {
    // Load local data
    const loadLocalData = async () => {
      const cached = await getCheckinList(event.id)
      if (cached) setListItems(cached)
      
      const meta = await getListMetadata(event.id)
      if (meta) setLastDownloadedAt(meta.downloadedAt)
      
      if (activeSession) {
        const actions = await getOfflineActions(activeSession.id)
        setOfflineActions(actions)
      }
    }
    loadLocalData()

    // Create session if online and no session
    if (navigator.onLine && !activeSession) {
      fetch('/api/checkin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, deviceInfo: navigator.userAgent })
      })
      .then(r => r.json())
      .then(d => {
        if (d.session) setSession(d.session)
      })
      .catch(console.error)
    }
  }, [event.id, activeSession])

  const handleDownloadList = async () => {
    if (!isOnline) {
      alert('Você precisa estar online para baixar a lista.')
      return
    }
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/checkin/list?eventId=${event.id}`)
      if (!res.ok) throw new Error('Falha ao baixar')
      const data = await res.json()
      
      await saveCheckinList(event.id, data)
      setListItems(data)
      setLastDownloadedAt(new Date().toISOString())
      // Opcional: mostrar toast
    } catch (err) {
      console.error(err)
      alert('Erro ao baixar a lista de participantes.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSync = useCallback(async () => {
    if (offlineActions.length === 0 || !session || isSyncing) return
    
    setIsSyncing(true)
    try {
      const res = await fetch('/api/checkin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, actions: offlineActions })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        if (data.failed > 0) {
          console.error('Falhas de sincronização:', data.details)
          alert(`Atenção: ${data.failed} check-in(s) não puderam ser sincronizados devido a um erro no servidor. Verifique o console.`)
          // Não limpa da fila as ações que falharam (precisamos remover só as que deram certo,
          // mas para simplificar agora, se houver falha, não vamos limpar o cache)
        } else {
          await clearOfflineActions(session.id)
          setOfflineActions([])
        }
        // Sempre recarrega para obter estado real
        handleDownloadList()
      } else {
        throw new Error(data.error || 'Erro na requisição')
      }
    } catch (err) {
      console.error('Falha no sync:', err)
      alert('Houve um erro ao tentar sincronizar o check-in offline.')
    } finally {
      setIsSyncing(false)
    }
  }, [offlineActions, session, isSyncing])

  const onCheckin = async (item: CheckinListItem, method: 'manual_list' | 'manual_override') => {
    if (!session) {
      alert('Sessão de check-in não iniciada. Verifique sua conexão.')
      return
    }

    const timestamp = new Date().toISOString()
    
    // 1. Otimista UI
    const updatedItem = { ...item, is_used: true, used_at: timestamp, checkin_method: method }
    
    // Atualizar estado
    setListItems(prev => prev.map(i => i.ticket_id === item.ticket_id ? updatedItem : i))
    setRecentCheckins(prev => [updatedItem, ...prev].slice(0, 5))
    
    // Atualizar IndexedDB
    await updateCheckinItem(event.id, item.ticket_id, updatedItem)

    // 2. Persistir
    if (isOnline) {
      try {
        const res = await fetch('/api/checkin/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: item.ticket_id,
            sessionId: session.id,
            eventId: event.id,
            method
          })
        })
        const data = await res.json()
        if (!res.ok || (data.result !== 'success' && data.result !== 'manual_override')) {
          // Reverter se falhou e não foi not_found (já que list item existe)
          setListItems(prev => prev.map(i => i.ticket_id === item.ticket_id ? item : i))
          alert(`Erro: ${data.message || 'Falha na validação'}`)
        }
      } catch (err) {
        // Se a rede caiu bem na hora, salvar como offline
        saveActionForSync(item, method, timestamp)
      }
    } else {
      saveActionForSync(item, method, timestamp)
    }
  }

  const saveActionForSync = async (item: CheckinListItem, method: string, timestamp: string) => {
    if (!session) return
    const action: OfflineCheckinAction = {
      localId: Math.random().toString(36).substring(7),
      ticketId: item.ticket_id,
      qrCode: item.qr_code,
      buyerName: item.buyer_name,
      ticketTypeName: item.ticket_type_name,
      result: method === 'manual_override' ? 'manual_override' : 'success',
      timestamp,
      synced: false
    }
    await saveOfflineAction(session.id, action)
    setOfflineActions(prev => [...prev, action])
  }

  const onScanSuccess = async (qrCode: string) => {
    if (!session) return
    
    const item = listItems.find(i => i.qr_code === qrCode)
    
    if (item) {
      if (item.is_used) {
        alert(`INGRESSO JÁ UTILIZADO! - ${item.buyer_name}`)
      } else {
        await onCheckin(item, 'qr_scanner' as any)
        alert(`SUCESSO - ${item.buyer_name} liberado!`)
      }
    } else {
      // Se não tá na lista local, tentar online se possível
      if (isOnline) {
        try {
          const res = await fetch('/api/checkin/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrCode, sessionId: session.id, eventId: event.id, method: 'qr_scanner' })
          })
          const data = await res.json()
          alert(data.message)
          if (data.result === 'success') {
            handleDownloadList() // atualizar lista
          }
        } catch (e) {
          alert('Erro ao validar online.')
        }
      } else {
        alert('INGRESSO NÃO ENCONTRADO NA LISTA LOCAL!')
      }
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden relative">
      
      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-900 text-xs font-medium text-center py-2 px-4 flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Modo offline — sincronização pendente quando a rede voltar</span>
          {offlineActions.length > 0 && (
            <span className="bg-amber-600 text-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">{offlineActions.length} envios</span>
          )}
        </div>
      )}

      {isSyncing && (
        <div className="bg-blue-500 text-white text-xs font-medium text-center py-2 px-4 flex items-center justify-center gap-2 z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          Sincronizando {offlineActions.length} check-ins...
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 z-40">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <Link href="/dashboard/checkin" className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 mb-2">
              <ChevronLeft className="w-3 h-3 mr-1" /> Eventos
            </Link>
            <h2 className="font-bold text-gray-900 truncate">{event.title}</h2>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href={`/dashboard/checkin/${event.id}/relatorio`}
              className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Relatório</span>
            </Link>
            <button
              onClick={handleDownloadList}
              disabled={!isOnline || isDownloading}
              className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Download className="w-4 h-4 text-gray-500" />}
              <span className="hidden sm:inline">Atualizar lista</span>
            </button>
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-primary-hover"
            >
              {showScanner ? (
                <><List className="w-4 h-4" /> <span className="hidden sm:inline">Ver Lista</span></>
              ) : (
                <><QrCode className="w-4 h-4" /> <span className="hidden sm:inline">Scanner QR</span></>
              )}
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-50 rounded-xl p-2 text-center flex flex-col justify-center">
            <span className="text-lg font-bold text-gray-900 leading-none">{listItems.length || overview.total_tickets}</span>
            <span className="text-[10px] text-gray-500 uppercase mt-1">Total</span>
          </div>
          <div className="bg-green-50 rounded-xl p-2 text-center flex flex-col justify-center">
            <span className="text-lg font-bold text-green-600 leading-none">
              {listItems.filter(i => i.is_used).length}
            </span>
            <span className="text-[10px] text-gray-500 uppercase mt-1">In</span>
          </div>
          <div className="bg-amber-50 rounded-xl p-2 text-center flex flex-col justify-center">
            <span className="text-lg font-bold text-amber-600 leading-none">
              {listItems.filter(i => !i.is_used).length}
            </span>
            <span className="text-[10px] text-gray-500 uppercase mt-1">Out</span>
          </div>
          <div className="bg-primary-light/30 rounded-xl p-2 text-center flex flex-col justify-center border border-primary/10">
            <span className="text-lg font-bold text-primary leading-none">
              {listItems.length > 0 ? Math.round((listItems.filter(i => i.is_used).length / listItems.length) * 100) : 0}%
            </span>
            <span className="text-[10px] text-primary uppercase mt-1">Check-in</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden">
        {showScanner ? (
          <div className="h-full bg-black relative">
             <ScannerWrapper onScanSuccess={onScanSuccess} />
             <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
                    Aponte a câmera para o QR Code
                </span>
             </div>
          </div>
        ) : (
          <CheckinList
            items={listItems}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterChange={setFilterType}
            selectedTicketType={selectedTicketType}
            onTicketTypeChange={setSelectedTicketType}
            onCheckin={onCheckin}
            isOnline={isOnline}
            lastDownloadedAt={lastDownloadedAt}
            onDownloadList={handleDownloadList}
          />
        )}
      </div>

      {/* RECENT BOTTOM SHEET */}
      {recentCheckins.length > 0 && !showScanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Últimos acessos liberados</p>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {recentCheckins.map((item, i) => (
              <div key={item.ticket_id + i} className="flex-shrink-0 flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                <CheckCircle2 className="text-green-500 w-4 h-4" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{item.buyer_name.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-500">{item.ticket_type_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
