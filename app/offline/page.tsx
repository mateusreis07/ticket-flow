'use client'

import { WifiOff, CheckCircle, XCircle } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 text-center">
      <WifiOff className="h-16 w-16 text-gray-300 mb-6" />
      <h1 className="text-2xl font-bold text-gray-900">Sem conexão</h1>
      <p className="text-gray-500 mt-2 max-w-sm">
        Verifique sua internet e tente novamente.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="mt-6 bg-primary text-white rounded-xl px-6 py-3 font-medium hover:bg-primary-hover transition-colors"
      >
        Tentar novamente
      </button>

      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-sm w-full text-left">
        <p className="text-sm font-semibold text-gray-700 mb-4">O que você pode fazer offline:</p>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-gray-600">Ver ingressos já carregados</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-gray-600">Acessar QR Codes salvos</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span className="text-gray-400">Comprar novos ingressos (requer conexão)</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span className="text-gray-400">Buscar eventos (requer conexão)</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
