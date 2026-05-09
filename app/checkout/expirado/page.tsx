'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function ExpiradoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 max-w-md w-full text-center">
        
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido expirado</h1>
        <p className="text-gray-500">
          O tempo para finalizar sua compra esgotou e os ingressos foram liberados para outros compradores.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 text-left">
          <p className="text-sm text-amber-700 leading-relaxed">
            Isso acontece para garantir que os ingressos fiquem disponíveis para todos. Você pode tentar novamente!
          </p>
        </div>

        <div className="mt-8">
          <button onClick={() => window.history.length > 2 ? window.history.go(-2) : window.location.href = '/'} className="block w-full bg-primary text-white rounded-xl py-3 font-medium hover:bg-primary-hover transition-colors">
            Selecionar ingressos novamente
          </button>
        </div>
      </div>
    </div>
  )
}
