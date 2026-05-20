'use client'

import { PaymentMethod } from '@/types'
import { CreditCard, Check, Zap, Info } from 'lucide-react'

type Props = {
  selectedMethod: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  totalAmount: number
}

export function PaymentMethodSelector({ selectedMethod, onMethodChange, totalAmount }: Props) {
  return (
    <div className="mb-6">
      <label className="text-sm font-medium text-gray-700 mb-3 block">
        Forma de pagamento
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Cartão */}
        <div
          onClick={() => onMethodChange('card')}
          className={`relative rounded-2xl p-4 cursor-pointer transition-all ${
            selectedMethod === 'card'
              ? 'border-2 border-primary bg-primary-light/30'
              : 'border border-gray-200 bg-white hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <CreditCard className="text-gray-600 w-5 h-5" />
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                selectedMethod === 'card'
                  ? 'bg-primary'
                  : 'border-2 border-gray-300'
              }`}
            >
              {selectedMethod === 'card' && <Check className="text-white w-3 h-3" />}
            </div>
          </div>
          <p className="font-semibold text-gray-900 text-sm">Cartão de crédito</p>
          <p className="text-xs text-gray-500 mt-0.5">Aprovação imediata</p>
          
          <div className="flex gap-1 mt-3 flex-wrap">
            <span className="bg-gray-100 text-gray-500 text-[10px] rounded px-1.5 py-0.5 font-medium">Visa</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] rounded px-1.5 py-0.5 font-medium">Master</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] rounded px-1.5 py-0.5 font-medium">Amex</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] rounded px-1.5 py-0.5 font-medium">Elo</span>
          </div>
        </div>

        {/* PIX */}
        <div
          onClick={() => onMethodChange('pix')}
          className={`relative rounded-2xl p-4 cursor-pointer transition-all ${
            selectedMethod === 'pix'
              ? 'border-2 border-primary bg-primary-light/30'
              : 'border border-gray-200 bg-white hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 4L12 2L14.5 4L12 6Z" fill="#32BCAD"/>
              <path d="M20 9.5L22 12L20 14.5L18 12Z" fill="#32BCAD"/>
              <path d="M14.5 20L12 22L9.5 20L12 18Z" fill="#32BCAD"/>
              <path d="M4 14.5L2 12L4 9.5L6 12Z" fill="#32BCAD"/>
              <path d="M12 6L18 12L12 18L6 12Z" fill="none" stroke="#32BCAD" strokeWidth="1.5"/>
            </svg>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                selectedMethod === 'pix'
                  ? 'bg-primary'
                  : 'border-2 border-gray-300'
              }`}
            >
              {selectedMethod === 'pix' && <Check className="text-white w-3 h-3" />}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">Pix</p>
            <span className="bg-green-100 text-green-700 text-[10px] rounded-full px-2 py-0.5 font-medium">
              Grátis
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">Pague com QR Code · 30 min</p>

          <div className="flex items-center gap-1 mt-3">
            <Zap className="text-green-500 w-3 h-3" />
            <p className="text-[10px] text-green-600 font-medium">Confirmação em segundos</p>
          </div>
        </div>
      </div>

      {selectedMethod === 'pix' && totalAmount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-3 flex items-start gap-2">
          <Info className="text-blue-400 w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-600">
            O QR Code Pix expira em 30 minutos após a geração. Seu ingresso é liberado automaticamente após o pagamento.
          </p>
        </div>
      )}
    </div>
  )
}
