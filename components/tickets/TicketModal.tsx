'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TicketWithDetails } from '@/types'
import { CalendarDays, MapPin, ShieldCheck, Ticket, CheckCircle2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { formatDateTime, formatDate } from '@/lib/utils/format'

interface TicketModalProps {
  ticket: TicketWithDetails
  isOpen: boolean
  onClose: () => void
}

export function TicketModal({ ticket, isOpen, onClose }: TicketModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white p-0 overflow-hidden rounded-2xl max-w-sm w-[90vw] mx-auto border-0">
        
        {/* Cabeçalho do modal */}
        <div className="bg-primary p-6 text-white">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-white" />
            <span className="font-semibold text-sm">TicketFlow</span>
          </div>
          
          <h2 className="font-bold text-lg mt-3 leading-tight">
            {ticket.event_title}
          </h2>
          
          <div className="mt-3 space-y-1.5 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{formatDateTime(ticket.event_date, ticket.event_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{ticket.location}, {ticket.city}</span>
            </div>
          </div>
        </div>

        {/* Corpo central */}
        <div className="p-6 flex flex-col items-center">
          
          <div className="bg-primary-light text-primary font-semibold rounded-full px-5 py-2 text-base mb-6 text-center">
            {ticket.ticket_type_name}
          </div>

          <div className="relative">
            {!ticket.is_used ? (
              <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-gray-100 flex flex-col items-center">
                <QRCodeSVG
                  value={ticket.qr_code}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#111827"
                />
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Apresente este código na entrada do evento
                </p>
                <p className="font-mono text-xs text-gray-400 mt-1">
                  #{ticket.qr_code.slice(-8).toUpperCase()}
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-gray-100 opacity-30 flex flex-col items-center">
                  <QRCodeSVG
                    value={ticket.qr_code}
                    size={200}
                    level="H"
                    includeMargin={false}
                    fgColor="#111827"
                  />
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Apresente este código na entrada do evento
                  </p>
                  <p className="font-mono text-xs text-gray-400 mt-1">
                    #{ticket.qr_code.slice(-8).toUpperCase()}
                  </p>
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-gray-500" />
                  <p className="font-semibold text-gray-600 mt-2 text-center">
                    Ingresso utilizado
                  </p>
                  {ticket.used_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Validado em {formatDate(ticket.used_at, "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do modal */}
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-semibold uppercase">
                {ticket.buyer_name?.substring(0, 2) || ticket.buyer_email?.substring(0, 2) || 'US'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {ticket.buyer_name || 'Comprador'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {ticket.buyer_email}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <p className="text-xs text-gray-400">
              Ingresso verificado e seguro • TicketFlow
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Fechar
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
