'use client'

import { useState } from 'react'
import { TicketWithDetails } from '@/types'
import { CheckCircle2, QrCode } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import { TicketModal } from './TicketModal'

interface TicketListItemProps {
  ticket: TicketWithDetails
  isPast?: boolean
}

export function TicketListItem({ ticket, isPast }: TicketListItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        
        {/* Lado esquerdo */}
        <div className="flex items-center gap-3">
          {ticket.is_used ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-[18px] w-[18px] text-gray-400" />
            </div>
          ) : ticket.order_status === 'pending' ? (
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <QrCode className="h-[18px] w-[18px] text-amber-500 opacity-50" />
            </div>
          ) : !isPast ? (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <QrCode className="h-[18px] w-[18px] text-green-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <QrCode className="h-[18px] w-[18px] text-gray-400" />
            </div>
          )}

          <div>
            <p className="font-medium text-gray-900 text-sm flex items-center gap-2">
              {ticket.ticket_type_name}
              {ticket.is_courtesy && (
                <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                  🎁 CORTESIA
                </span>
              )}
            </p>
            
            {ticket.is_used ? (
              <p className="text-xs text-gray-400 mt-0.5">
                Utilizado em {formatDate(ticket.used_at || new Date().toISOString(), "dd/MM/yyyy HH:mm")}
              </p>
            ) : ticket.order_status === 'pending' ? (
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                Pagamento em análise
              </p>
            ) : !isPast ? (
              <p className="text-xs text-green-600 font-medium mt-0.5">
                Válido • Apresente o QR Code na entrada
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">
                Evento encerrado
              </p>
            )}
          </div>
        </div>

        {/* Lado direito */}
        <div>
          {!isPast && !ticket.is_used ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="border border-primary text-primary text-sm font-medium rounded-lg px-4 py-2 hover:bg-primary-light transition-colors focus:ring-2 focus:ring-primary/20 outline-none"
            >
              Ver ingresso
            </button>
          ) : ticket.is_used ? (
            <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-3 py-1 font-medium">
              Utilizado
            </span>
          ) : null}
        </div>
      </div>

      <TicketModal
        ticket={ticket}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
