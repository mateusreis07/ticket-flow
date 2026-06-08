import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { LogOut, LayoutDashboard, Ticket, Settings as SettingsIcon } from 'lucide-react'
import { redirect } from 'next/navigation'
import HeaderSearch from '@/components/search/HeaderSearch'
import NotificationBell from '@/components/notifications/NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('name, role, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-xl hover:opacity-80 active:scale-95 transition-all">
          <Ticket className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">TicketFlow</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <HeaderSearch />
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {profile?.role === 'organizer' ? (
                <Link href="/dashboard" className="text-gray-600 hover:text-primary active:scale-95 transition-all flex items-center gap-2 text-sm font-medium px-2 py-1 rounded-lg hover:bg-primary/5">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link href="/meus-ingressos" className="text-gray-600 hover:text-primary active:scale-95 transition-all flex items-center gap-2 text-sm font-medium px-2 py-1 rounded-lg hover:bg-primary/5">
                    <Ticket className="h-4 w-4" />
                    <span className="hidden sm:inline">Meus ingressos</span>
                  </Link>
                  <Link href="/meus-organizadores" className="text-gray-600 hover:text-primary active:scale-95 transition-all flex items-center gap-2 text-sm font-medium px-2 py-1 rounded-lg hover:bg-primary/5">
                    <span className="hidden sm:inline">Organizadores</span>
                  </Link>
                </>
              )}

              {/* 🔔 Sino de notificações */}
              <NotificationBell userId={user.id} />

              {/* Avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="relative h-9 w-9 bg-primary-light text-primary border border-primary/10 hover:ring-2 hover:ring-primary/20 active:scale-90 transition-all overflow-hidden">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt={profile.name || 'User'} 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <AvatarFallback className="font-semibold text-xs">
                        {profile?.name ? getInitials(profile.name) : user.email?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-xl">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{profile?.name || 'Usuário'}</span>
                        <span className="text-xs text-gray-500 font-normal">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <Link 
                      href={profile?.role === 'organizer' ? "/dashboard/configuracoes" : "/configuracoes"} 
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <SettingsIcon className="h-4 w-4 text-gray-500" />
                      Configurações
                    </Link>

                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <form action={signOut} className="w-full">
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-red-50 transition-colors w-full text-left">
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-4 py-2 active:scale-95 transition-all text-sm font-medium">
                  Entrar
                </button>
              </Link>
              <Link href="/auth/cadastro">
                <button className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-hover hover:shadow-md active:scale-95 transition-all text-sm font-medium shadow-sm">
                  Cadastrar
                </button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
