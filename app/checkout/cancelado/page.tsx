'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, CreditCard } from 'lucide-react'
import { Suspense } from 'react'

function CanceladoContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 max-w-md w-full text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
        <XCircle className="h-10 w-10 text-red-400" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento não concluído</h1>
      <p className="text-gray-500 leading-relaxed">
        Você saiu da página de pagamento. Nenhuma cobrança foi realizada e seus ingressos ainda estão reservados.
      </p>

      {/* Se veio com orderId, pode tentar novamente no mesmo pedido */}
      {orderId ? (
        <div className="mt-8 space-y-3">
          <Link
            href={`/checkout/${orderId}`}
            className="flex items-center justify-center gap-2 bg-primary text-white w-full rounded-xl py-3 font-semibold hover:bg-primary-hover transition-colors"
          >
            <CreditCard className="h-5 w-5" />
            Tentar pagar novamente
          </Link>
          <Link
            href="/"
            className="block border border-gray-200 text-gray-600 w-full rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar e buscar outros eventos
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="block bg-primary text-white w-full rounded-xl py-3 font-medium hover:bg-primary-hover transition-colors"
          >
            Buscar eventos
          </Link>
          <button
            onClick={() => window.history.back()}
            className="block w-full border border-gray-200 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6">
        Atenção: Os ingressos reservados expiram em 30 minutos se o pagamento não for concluído.
      </p>
    </div>
  )
}

export default function CanceladoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="bg-white rounded-2xl p-10 max-w-md w-full" />}>
        <CanceladoContent />
      </Suspense>
    </div>
  )
}
