import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Building2, ShoppingBag, Ticket } from 'lucide-react'
import { selectRole } from '@/lib/actions/auth'

export default async function EscolherPapelPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, needs_role_selection, avatar_url, name')
    .eq('id', user.id)
    .single()

  if (profile && !profile.needs_role_selection) {
    redirect('/')
  }

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Usuário'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          {profile?.avatar_url ? (
            <div className="relative w-16 h-16 mx-auto mb-4 border-2 border-gray-100 rounded-full overflow-hidden">
              <Image 
                src={profile.avatar_url} 
                alt="Sua foto de perfil" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName}!</h1>
          <p className="text-gray-500 mt-1">Você está quase lá! Como vai usar o TicketFlow?</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <form action={selectRole}>
            <input type="hidden" name="role" value="buyer" />
            <button type="submit" className="w-full text-left">
              <div className="border-2 border-gray-200 rounded-2xl p-5 hover:border-primary hover:bg-primary-light/30 transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <ShoppingBag className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-base">Quero comprar ingressos</p>
                    <p className="text-sm text-gray-500 mt-1">Explore eventos, compre ingressos digitais e acesse tudo pelo celular.</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">Ingressos digitais</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">QR Code</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">Histórico de compras</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </form>

          <form action={selectRole}>
            <input type="hidden" name="role" value="organizer" />
            <button type="submit" className="w-full text-left">
              <div className="border-2 border-gray-200 rounded-2xl p-5 hover:border-primary hover:bg-primary-light/30 transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <Building2 className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-base">Quero criar e vender eventos</p>
                    <p className="text-sm text-gray-500 mt-1">Crie eventos, venda ingressos, gerencie check-in e acompanhe suas vendas.</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">Dashboard</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">Scanner QR</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">Relatórios</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">Cupons</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">Você pode alterar isso depois nas configurações.</p>
        </div>
      </div>
    </div>
  )
}
