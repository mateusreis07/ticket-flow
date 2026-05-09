import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-8xl font-black text-gray-200 mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h2>
        <p className="text-gray-500 mb-8">
          A página que você está procurando pode ter sido removida, teve seu nome alterado ou está temporariamente indisponível.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm w-full sm:w-auto"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
