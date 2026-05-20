'use client'

import { formatCurrency } from '@/lib/utils/format'
import { Loader2, ShieldCheck } from 'lucide-react'

type Props = {
  orderId: string
  totalAmount: number
  isLoading: boolean
  onClick: () => void
}

export function PixButton({ orderId, totalAmount, isLoading, onClick }: Props) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full rounded-xl py-4 font-semibold text-base transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-white hover:brightness-110 flex items-center justify-center gap-3"
        style={{ backgroundColor: '#32BCAD' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" />
            <span>Gerando QR Code...</span>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 4L12 2L14.5 4L12 6Z" fill="white"/>
              <path d="M20 9.5L22 12L20 14.5L18 12Z" fill="white"/>
              <path d="M14.5 20L12 22L9.5 20L12 18Z" fill="white"/>
              <path d="M4 14.5L2 12L4 9.5L6 12Z" fill="white"/>
              <path d="M12 6L18 12L12 18L6 12Z" fill="none" stroke="white" strokeWidth="1.5"/>
            </svg>
            <div className="text-left flex flex-col leading-tight">
              <span className="font-bold text-sm">Gerar QR Code Pix</span>
              <span className="text-xs font-medium opacity-90">{formatCurrency(totalAmount)}</span>
            </div>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 mt-3">
        <ShieldCheck className="text-green-500 w-3 h-3" />
        <p className="text-[11px] text-gray-400 font-medium">Processado com segurança pelo Mercado Pago</p>
      </div>
    </div>
  )
}
