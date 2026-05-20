'use client'

import { useState, useEffect } from 'react'
import { PixPaymentData } from '@/types'
import { Clock, Timer, Copy, Check, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
  pixData: PixPaymentData
  orderId: string
  totalAmount: number
  onPaymentConfirmed: () => void
  onCancel: () => void
}

export function PixPaymentDisplay({ pixData, orderId, totalAmount, onPaymentConfirmed, onCancel }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'confirmed' | 'expired'>('waiting')
  const [isChecking, setIsChecking] = useState(false)

  // Countdown timer
  useEffect(() => {
    const calcTimeLeft = () => {
      const diff = new Date(pixData.expiresAt).getTime() - new Date().getTime()
      return Math.max(0, Math.floor(diff / 1000))
    }

    setTimeLeft(calcTimeLeft())

    const timer = setInterval(() => {
      const left = calcTimeLeft()
      setTimeLeft(left)
      if (left <= 0) {
        setPaymentStatus('expired')
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [pixData.expiresAt])

  // Polling de status a cada 4 segundos
  useEffect(() => {
    if (paymentStatus !== 'waiting') return

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/pix/status?orderId=${orderId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'paid') {
            setPaymentStatus('confirmed')
            setTimeout(onPaymentConfirmed, 2000)
          } else if (data.status === 'expired' || data.status === 'cancelled') {
            setPaymentStatus('expired')
          }
        }
      } catch (e) {
        console.error('Erro ao checar status:', e)
      }
    }

    const interval = setInterval(checkStatus, 4000)
    return () => clearInterval(interval)
  }, [paymentStatus, orderId, onPaymentConfirmed])

  const handleManualCheck = async () => {
    setIsChecking(true)
    try {
      const res = await fetch(`/api/checkout/pix/status?orderId=${orderId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'paid') {
          setPaymentStatus('confirmed')
          setTimeout(onPaymentConfirmed, 2000)
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          setPaymentStatus('expired')
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsChecking(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.copyPaste)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const secs = (timeLeft % 60).toString().padStart(2, '0')

  if (paymentStatus === 'confirmed') {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-green-500 w-12 h-12" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Pix confirmado!</h3>
        <p className="text-gray-500 mt-2">Processando seu ingresso...</p>
        <Loader2 className="animate-spin text-primary mt-6 w-6 h-6 mx-auto" />
      </div>
    )
  }

  if (paymentStatus === 'expired') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="text-red-400 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">QR Code expirado</h3>
        <p className="text-gray-500 mt-2 text-sm">
          O tempo para pagamento esgotou. Nenhuma cobrança foi realizada.
        </p>
        <button
          onClick={onCancel}
          className="bg-primary hover:bg-primary-hover text-white rounded-xl px-6 py-3 mt-6 font-medium transition-colors"
        >
          Gerar novo QR Code Pix
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto text-center">
      {/* Badge Aguardando */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-center justify-center gap-2">
        <Clock className="animate-pulse text-amber-500 w-4 h-4" />
        <span className="text-sm font-medium text-amber-700">Aguardando pagamento Pix</span>
      </div>

      {/* QR Code */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 inline-block shadow-sm mb-4">
        {pixData.qrCodeBase64 ? (
          <img
            src={`data:image/png;base64,${pixData.qrCodeBase64}`}
            width={200}
            height={200}
            alt="QR Code Pix"
            style={{ display: 'block' }}
          />
        ) : (
          <QRCodeSVG value={pixData.copyPaste} size={200} level="H" />
        )}
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <Timer className="w-4 h-4 text-gray-500" />
        {timeLeft > 300 ? (
          <div className="flex items-baseline">
            <span className="text-amber-600 font-mono font-bold text-lg">{mins}:{secs}</span>
            <span className="text-gray-400 text-xs ml-1 font-medium">restantes</span>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-red-600 font-mono font-bold animate-pulse text-sm">ATENÇÃO — expira em {mins}:{secs}</span>
          </div>
        )}
      </div>

      {/* Copia e Cola */}
      <div className="text-left mb-5">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Código Pix copia e cola:
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={pixData.copyPaste}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono text-gray-600 cursor-pointer truncate"
          />
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 rounded-xl px-4 py-3 transition-all flex items-center gap-1.5 ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-xs font-bold">Copiado!</span>
              </>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Como Pagar */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left mb-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Como pagar:</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-light text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <p className="text-xs text-gray-600 leading-tight">Abra o app do seu banco ou carteira digital</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-light text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <p className="text-xs text-gray-600 leading-tight">Escolha pagar via Pix</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-light text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <p className="text-xs text-gray-600 leading-tight">Escaneie o QR Code ou cole o código acima</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-light text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
            <p className="text-xs text-gray-600 leading-tight">Confirme o valor de <strong className="font-semibold">{formatCurrency(totalAmount)}</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-light text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">5</div>
            <p className="text-xs text-gray-600 leading-tight">Pronto! Seu ingresso será liberado automaticamente</p>
          </div>
        </div>
      </div>

      {/* Logos */}
      <div className="text-center mb-5">
        <p className="text-[11px] text-gray-400 mb-2">Funciona em todos os bancos</p>
        <div className="flex justify-center gap-1.5 flex-wrap">
          {['Nubank', 'Itaú', 'Bradesco', 'Caixa', 'BB', 'Inter', 'Santander', 'C6 Bank', '+ todos'].map((bank) => (
            <span key={bank} className="bg-gray-100 text-gray-500 text-[10px] rounded px-1.5 py-0.5 font-medium">
              {bank}
            </span>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className="w-full border-2 border-primary text-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Verificando...' : 'Já paguei — verificar agora'}
        </button>
        
        <button
          onClick={onCancel}
          className="w-full text-gray-400 text-sm py-2 hover:text-red-500 transition-colors font-medium"
        >
          Cancelar e voltar
        </button>
      </div>
    </div>
  )
}
