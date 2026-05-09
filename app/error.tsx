'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Global Error Boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Algo deu errado</h2>
        <p className="text-gray-500 mb-8">
          Ocorreu um erro inesperado. Já registramos o problema para que nossa equipe possa investigar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  )
}
