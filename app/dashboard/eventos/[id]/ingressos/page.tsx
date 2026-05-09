import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus, ChevronLeft, Trash2, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createTicketType, deleteTicketType } from '@/lib/actions/ticket-types'

export default async function ManageTicketsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: event } = await supabase.from('events').select('title, id').eq('id', params.id).eq('organizer_id', user.id).single()
  if (!event) notFound()

  const { data: tickets } = await supabase.from('ticket_types').select('*').eq('event_id', params.id).order('price', { ascending: true })

  const saveTicket = async (fd: FormData): Promise<void> => {
    'use server'
    await createTicketType(params.id, fd)
  }

  const handleDelete = async (ticketId: string): Promise<void> => {
    'use server'
    await deleteTicketType(ticketId)
  }

  return (
    <div className="space-y-8">
      <nav className="flex items-center justify-between">
        <Link href="/dashboard/eventos" className="flex items-center gap-1 text-gray-500 hover:text-primary transition-colors font-medium text-sm">
          <ChevronLeft className="h-4 w-4" /> Voltar ao evento
        </Link>
        <span className="text-xs text-gray-400">ID do Evento: {event.id}</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ingressos: {event.title}</h1>
        
        <Dialog>
          <DialogTrigger className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-md cursor-pointer">
            <Plus className="h-5 w-5" /> Adicionar
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-gray-100">
            <DialogHeader><DialogTitle className="text-xl font-bold text-gray-900">Novo tipo de ingresso</DialogTitle></DialogHeader>
            <form action={saveTicket} className="space-y-5 pt-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nome do ingresso</label>
                <input name="name" placeholder="Ex: Pista, VIP" className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Preço (R$)</label>
                  <input name="price" type="number" step="0.01" min="0" placeholder="0,00" className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Qtd. Disponível</label>
                  <input name="quantity_total" type="number" min="1" placeholder="100" className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" required />
                </div>
              </div>
              <input type="hidden" name="is_active" value="true" />
              <button className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-4">Salvar ingresso</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets?.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{t.name}</h3>
                <p className="text-2xl font-black text-primary mt-1">R$ {t.price.toFixed(2)}</p>
              </div>
              <form action={handleDelete.bind(null, t.id)}>
                <button type="submit" className="p-2 text-gray-300 hover:text-red-600 transition-colors bg-gray-50 rounded-lg hover:bg-red-50">
                  <Trash2 className="h-5 w-5" />
                </button>
              </form>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                <span>Vendas</span>
                <span>{t.quantity_sold}/{t.quantity_total}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(t.quantity_sold / t.quantity_total) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
        {(!tickets || tickets.length === 0) && (
          <div className="col-span-2 text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
            <Info className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium">Nenhum ingresso criado para este evento.</p>
            <p className="text-gray-400 text-sm mt-1">Clique no botão "Adicionar" acima para criar os primeiros ingressos.</p>
          </div>
        )}
      </div>
    </div>
  )
}
