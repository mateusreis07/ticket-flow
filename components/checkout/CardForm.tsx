'use client'

import { useEffect, useRef, useState } from 'react'
import { CardInstallment } from '@/types'
import { formatCurrency } from '@/lib/utils/format'
import { Loader2, Lock, ShieldCheck, HelpCircle, CreditCard } from 'lucide-react'

interface CardFormProps {
  orderId: string
  totalAmount: number
  onSuccess: (orderId: string) => void
  onError: (message: string) => void
}

export function CardForm({ orderId, totalAmount, onSuccess, onError }: CardFormProps) {
  const mpRef = useRef<any>(null)
  const binRef = useRef<string>('')

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cpf, setCpf] = useState('')
  const [installments, setInstallments] = useState(1)
  
  const [availableInstallments, setAvailableInstallments] = useState<CardInstallment[]>([])
  const [selectedInstallment, setSelectedInstallment] = useState<CardInstallment | null>(null)
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cardBrand, setCardBrand] = useState<string | null>(null)

  useEffect(() => {
    const initMP = () => {
      if (window.MercadoPago) {
        mpRef.current = new window.MercadoPago(
          process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
          { locale: 'pt-BR' }
        )
      }
    }

    if (!window.MercadoPago) {
      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.onload = initMP
      document.body.appendChild(script)
    } else {
      initMP()
    }
  }, [])

  // Detect bin
  useEffect(() => {
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length >= 6) {
      const bin = digits.slice(0, 6)
      if (bin !== binRef.current) {
        binRef.current = bin
        fetchInstallments(bin)
      }
    } else if (digits.length < 6 && binRef.current !== '') {
      binRef.current = ''
      setAvailableInstallments([])
      setSelectedInstallment(null)
      setCardBrand(null)
    }
  }, [cardNumber, totalAmount])

  const fetchInstallments = async (bin: string) => {
    setIsLoadingInstallments(true)
    try {
      const res = await fetch(`/api/checkout/installments?amount=${totalAmount}&bin=${bin}`)
      const data = await res.json()
      
      if (data.success && data.installments.length > 0) {
        setAvailableInstallments(data.installments)
        setInstallments(1)
        setSelectedInstallment(data.installments[0])
      }

      if (mpRef.current) {
        const methods = await mpRef.current.getPaymentMethods({ bin })
        if (methods.results && methods.results.length > 0) {
          setCardBrand(methods.results[0].id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingInstallments(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`
    }
    return v
  }

  const formatCpf = (value: string) => {
    const v = value.replace(/\D/g, '')
    return v.replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const validateCPF = (cpfValue: string) => {
    const cleanCpf = cpfValue.replace(/\D/g, '')
    if (cleanCpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cleanCpf)) return false
    
    let sum = 0
    let remainder
    for (let i = 1; i <= 9; i++) sum += parseInt(cleanCpf.substring(i-1, i)) * (11 - i)
    remainder = (sum * 10) % 11
    if ((remainder === 10) || (remainder === 11)) remainder = 0
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false
    
    sum = 0
    for (let i = 1; i <= 10; i++) sum += parseInt(cleanCpf.substring(i-1, i)) * (12 - i)
    remainder = (sum * 10) % 11
    if ((remainder === 10) || (remainder === 11)) remainder = 0
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false
    
    return true
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (cardNumber.replace(/\D/g, '').length < 14) {
      newErrors.cardNumber = 'Número inválido'
    }
    
    if (cardName.trim().split(' ').length < 2) {
      newErrors.cardName = 'Nome completo'
    }
    
    if (cardExpiry.length !== 5) {
      newErrors.cardExpiry = 'Data inválida'
    }
    
    if (cardCvv.length < 3) {
      newErrors.cardCvv = 'CVV inválido'
    }
    
    if (!validateCPF(cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !mpRef.current) return
    
    setIsProcessing(true)
    
    try {
      const [month, year] = cardExpiry.split('/')
      
      const tokenData = await mpRef.current.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName,
        cardExpirationMonth: month,
        cardExpirationYear: '20' + year,
        securityCode: cardCvv,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, ''),
      })
      
      if (tokenData.error) {
        onError('Verifique os dados do cartão informados')
        setIsProcessing(false)
        return
      }
      
      const response = await fetch('/api/checkout/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          token: tokenData.id,
          installments,
          paymentMethodId: cardBrand ?? 'visa',
          cpf: cpf.replace(/\D/g, ''),
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        onSuccess(result.orderId)
      } else if (result.pending) {
        onSuccess(result.orderId) // redirecionar, a página de sucesso trata o pending
      } else {
        onError(result.error)
      }
    } catch (error) {
      onError('Erro inesperado. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getBrandText = (brand: string | null) => {
    if (!brand) return null
    if (brand === 'visa') return 'VISA'
    if (brand === 'master') return 'MASTERCARD'
    if (brand === 'elo') return 'ELO'
    if (brand === 'amex') return 'AMEX'
    return brand.toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Número do cartão</label>
        <div className="relative mt-1">
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <div className="absolute right-3 top-3.5 text-gray-400 font-bold text-xs">
            {getBrandText(cardBrand) ?? <CreditCard className="w-5 h-5 text-gray-300" />}
          </div>
        </div>
        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Nome impresso no cartão</label>
        <input
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          placeholder="NOME SOBRENOME"
          autoComplete="cc-name"
          className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
        {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Validade</label>
          <input
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            maxLength={5}
            inputMode="numeric"
            className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">CVV</label>
          <div className="relative mt-1">
            <input
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              maxLength={4}
              inputMode="numeric"
              type="password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <HelpCircle className="w-4 h-4 text-gray-300 absolute right-3 top-3.5" title="3 ou 4 dígitos no verso do cartão" />
          </div>
          {errors.cardCvv && <p className="text-red-500 text-xs mt-1">{errors.cardCvv}</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">CPF do titular</label>
        <input
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          placeholder="000.000.000-00"
          maxLength={14}
          inputMode="numeric"
          className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
        {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
        <p className="text-xs text-gray-400 mt-1">Necessário para processar o pagamento</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Número de parcelas</label>
        {isLoadingInstallments ? (
          <div className="w-full h-11 bg-gray-100 animate-pulse rounded-xl mt-1"></div>
        ) : cardNumber.replace(/\D/g, '').length < 6 ? (
          <select disabled className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 text-sm opacity-50 cursor-not-allowed">
            <option>Digite o número do cartão primeiro</option>
          </select>
        ) : availableInstallments.length > 0 ? (
          <div>
            <select
              value={installments}
              onChange={(e) => {
                const val = Number(e.target.value)
                setInstallments(val)
                const option = availableInstallments.find(i => i.quantity === val)
                if (option) setSelectedInstallment(option)
              }}
              className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              {availableInstallments.map(inst => (
                <option key={inst.quantity} value={inst.quantity}>
                  {inst.label}
                </option>
              ))}
            </select>
            {selectedInstallment && installments > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                Total: {formatCurrency(selectedInstallment.totalAmount)}
                {selectedInstallment.totalAmount > totalAmount ? ' (com juros do cartão)' : ''}
              </p>
            )}
          </div>
        ) : (
          <select disabled className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 text-sm opacity-50 cursor-not-allowed">
            <option>Nenhuma opção disponível</option>
          </select>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Valor</span>
          <span className="font-medium">{formatCurrency(totalAmount)}</span>
        </div>
        {installments > 1 && selectedInstallment && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{installments}x de</span>
            <span className="text-primary font-semibold">{formatCurrency(selectedInstallment.amount)}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isProcessing}
        className="w-full bg-primary text-white rounded-xl py-4 font-semibold text-base hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
      >
        {isProcessing ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
        ) : (
          <><Lock className="w-5 h-5" /> Pagar {formatCurrency(selectedInstallment?.totalAmount ?? totalAmount)}</>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 mt-2">
        <ShieldCheck className="text-green-500 w-4 h-4" />
        <p className="text-xs text-gray-400">Seus dados são criptografados pelo Mercado Pago</p>
      </div>
    </div>
  )
}
