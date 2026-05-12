'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CalendarPlus, 
  List, 
  BarChart3, 
  Settings, 
  LogOut,
  ScanLine,
  Tag
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  profile: any
}

export default function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { name: 'Visão geral', href: '/dashboard', icon: LayoutDashboard, disabled: false },
    { name: 'Criar evento', href: '/dashboard/eventos/criar', icon: CalendarPlus, disabled: false },
    { name: 'Meus eventos', href: '/dashboard/eventos', icon: List, disabled: false },
    { name: 'Cupons', href: '/dashboard/cupons', icon: Tag, disabled: false },
    { name: 'Validar entradas', href: '/dashboard/scanner', icon: ScanLine, disabled: false, isScanner: true },
    { name: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3, disabled: true },
    { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings, disabled: false },
  ]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] md:min-h-screen">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-50 border-r border-gray-200 sticky top-0 h-[calc(100vh-4rem)] md:h-screen">
        <div className="px-4 pt-6 pb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            if (item.disabled) {
              return (
                <div key={item.name} className="flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="bg-gray-200 text-gray-500 text-[10px] uppercase font-bold rounded px-1.5 py-0.5">Em breve</span>
                </div>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg transition-colors text-sm ${
                  isActive 
                    ? item.isScanner ? 'bg-primary text-white font-medium shadow-sm' : 'bg-primary-light text-primary font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${isActive ? (item.isScanner ? 'text-white' : 'text-primary') : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.isScanner && (
                  <span className={`${isActive ? 'bg-white text-primary' : 'bg-primary text-white'} text-[10px] font-bold rounded px-1.5 py-0.5 uppercase`}>
                    Novo
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-gray-900 truncate">{profile?.name}</span>
              <span className="text-xs text-gray-500 truncate">{profile?.email}</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
