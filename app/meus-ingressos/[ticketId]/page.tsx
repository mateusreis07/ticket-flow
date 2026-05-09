import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Ticket as TicketIcon, ChevronLeft, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { formatDateTime, formatDate } from '@/lib/utils/format'
import { TicketWithDetails } from '@/types'

export default async function TicketFullscreenPage({ params }: { params: { ticketId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=/meus-ingressos/${params.ticketId}`)
  }

  const { data: ticket, error } = await supabase
    .from('tickets_with_details')
    .select('*')
    .eq('id', params.ticketId)
    .eq('buyer_id', user.id)
    .single()

  if (error || !ticket) {
    notFound()
  }

  const t = ticket as TicketWithDetails

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Topo */}
      <div className="bg-primary p-5 text-white">
        <Link 
          href="/meus-ingressos" 
          className="text-white/70 text-sm flex items-center gap-1 hover:text-white transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Meus ingressos
        </Link>
        
        <div className="mt-4 flex items-center justify-center gap-2">
          <TicketIcon className="h-6 w-6" />
          <span className="font-bold text-xl">TicketFlow</span>
        </div>
      </div>

      {/* Corpo principal */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        
        <h1 className="text-2xl font-bold text-gray-900 leading-tight max-w-xs mx-auto">
          {t.event_title}
        </h1>

        <div className="mt-3 text-gray-500 text-sm">
          <span>{formatDateTime(t.event_date, t.event_time)}</span>
          <span> &bull; {t.city}/{t.state}</span>
        </div>

        <div className="mt-4 bg-primary text-white font-semibold rounded-full px-6 py-2.5 text-base shadow-sm">
          {t.ticket_type_name}
        </div>

        <div className="mt-8">
          {!t.is_used ? (
            <div className="flex flex-col items-center">
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
                <QRCodeSVG
                  value={t.qr_code}
                  size={240}
                  level="H"
                  includeMargin={false}
                  fgColor="#111827"
                />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Mostre este QR Code para o fiscal na entrada
              </p>
              <p className="font-mono text-xs text-gray-400 mt-2">
                #{t.qr_code.slice(-8).toUpperCase()}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-14 w-14 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-600 mt-4">
                Este ingresso já foi utilizado
              </h2>
              {t.used_at && (
                <p className="text-sm text-gray-400 mt-1">
                  Validado em {formatDate(t.used_at, "dd/MM/yyyy HH:mm")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="border-t border-gray-100 p-5 bg-gray-50/50">
        <div className="text-center">
          <p className="font-medium text-gray-900 text-sm truncate">
            {t.buyer_name || 'Comprador'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {t.buyer_email}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          <p className="text-xs text-gray-400">
            Ingresso autêntico • TicketFlow
          </p>
        </div>
      </div>

    </div>
  )
}
