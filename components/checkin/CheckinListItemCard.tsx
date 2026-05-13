'use client'

import { useState } from 'react'
import { CheckinListItem } from '@/types'
import { CheckCircle2, Circle, MoreVertical, QrCode, Ticket } from 'lucide-react'

interface Props {
  item: CheckinListItem
  onCheckin: (item: CheckinListItem, method: 'manual_list' | 'manual_override') => void
  isOnline: boolean
}

export default function CheckinListItemCard({ item, onCheckin, isOnline }: Props) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleCheckinClick = () => {
    setIsProcessing(true)
    onCheckin(item, 'manual_list')
    // We don't need to set processing to false here if the parent handles the optimistic UI update quickly,
    // but just in case, we unset it after a short delay or if it fails
    setTimeout(() => setIsProcessing(false), 500)
  }

  const handleOverride = () => {
    if (confirm('Tem certeza que deseja forçar um novo check-in para este ingresso que já foi utilizado?')) {
      onCheckin(item, 'manual_override')
      setShowMenu(false)
    }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.is_used ? 'bg-green-50/30' : ''}`}>
      
      {/* Indicador de Status */}
      <div className="flex-shrink-0">
        {item.is_used ? (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Circle className="w-5 h-5 text-gray-300" />
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0 relative">
        <p className="font-semibold text-gray-900 text-sm truncate">{item.buyer_name}</p>
        
        <div className="flex items-center gap-2 mt-0.5">
          <span className="bg-primary-light text-primary text-xs rounded-full px-2 py-0.5 font-medium">
            {item.ticket_type_name}
          </span>
          {item.is_used && item.used_at && (
            <span className="text-xs text-green-600 font-medium truncate">
              ✓ {new Date(item.used_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{item.buyer_email}</p>
      </div>

      {/* Ação Principal */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {item.is_used ? (
          <div className="text-right">
            <span className="text-xs text-green-600 font-medium block">Confirmado</span>
            {item.checkin_method === 'manual_override' && (
              <span className="text-[10px] text-amber-500 block">Override</span>
            )}
          </div>
        ) : (
          <button
            onClick={handleCheckinClick}
            disabled={isProcessing}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {isProcessing ? '...' : 'Check-in'}
          </button>
        )}

        {/* Menu Expandido */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { alert(`QR Code: ${item.qr_code}`); setShowMenu(false); }}
                >
                  <QrCode className="w-4 h-4 text-gray-400" />
                  Ver ingresso
                </button>
                {item.is_used && (
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                    onClick={handleOverride}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Forçar check-in
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
