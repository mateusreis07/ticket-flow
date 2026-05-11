import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, User, Mail, Bell } from 'lucide-react'
import PushManager from '@/components/notifications/PushManager'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/dashboard/configuracoes')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      {/* Seção Conta */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Conta
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
            <p className="text-sm font-medium text-gray-900">{profile?.name ?? '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Mail className="h-3 w-3" /> E-mail
            </label>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de conta</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
              {profile?.role === 'organizer' ? 'Organizador' : 'Comprador'}
            </span>
          </div>
        </div>
      </section>

      {/* Seção Notificações */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notificações push
        </h2>
        <PushManager userId={user.id} />
        <p className="text-xs text-gray-400 mt-3">
          As notificações são enviadas para este dispositivo quando você tem ingressos confirmados
          ou eventos próximos. Você pode desativar a qualquer momento.
        </p>
      </section>
    </div>
  )
}
