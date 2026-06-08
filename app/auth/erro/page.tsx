import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface ErroAuthPageProps {
  searchParams: {
    error?: string
    error_description?: string
  }
}

export default function ErroAuthPage({ searchParams }: ErroAuthPageProps) {
  const error = searchParams.error
  const description = searchParams.error_description

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 text-center">
          Erro ao entrar com Google
        </h1>
        
        <p className="text-gray-500 mt-2 text-sm text-center max-w-xs">
          {description || 'Não foi possível completar o login com sua conta do Google. Por favor, tente novamente.'}
        </p>
        
        {error && (
          <p className="text-xs text-gray-400 mt-4 font-mono bg-gray-50 p-2 rounded w-full text-center truncate">
            {error}
          </p>
        )}
        
        <div className="flex flex-col w-full gap-3 mt-8">
          <Link 
            href="/auth/login" 
            className="w-full bg-primary text-white rounded-xl px-6 py-3 font-medium text-center hover:bg-primary-hover transition-colors"
          >
            Tentar novamente
          </Link>
          <Link 
            href="/auth/login" 
            className="w-full border border-gray-200 text-gray-700 rounded-xl px-6 py-3 font-medium text-center hover:bg-gray-50 transition-colors"
          >
            Entrar com e-mail
          </Link>
        </div>
      </div>
    </div>
  )
}
