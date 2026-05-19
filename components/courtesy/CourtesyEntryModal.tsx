'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { addCourtesyEntry, updateCourtesyEntry } from '@/lib/actions/courtesy'
import { CourtesyEntry, TicketType } from '@/types'
import { Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CourtesyEntryModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  eventId: string
  ticketTypes: TicketType[]
  entry?: CourtesyEntry
}

export function CourtesyEntryModal({ isOpen, onClose, listId, eventId, ticketTypes, entry }: CourtesyEntryModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sendImmediately, setSendImmediately] = useState(!entry)
  const [selectedTicketType, setSelectedTicketType] = useState<string>(entry?.ticket_type_id || ticketTypes[0]?.id || '')

  async function action(formData: FormData) {
    setLoading(true)
    // Ensure the select value is in the form data
    if (!formData.has('ticket_type_id')) {
        formData.append('ticket_type_id', selectedTicketType)
    }
    
    try {
      const result = entry 
        ? await updateCourtesyEntry(entry.id, eventId, formData)
        : await addCourtesyEntry(listId, eventId, formData)

      if (result.success) {
        const createdEntry = (result as any).entry
        if (!entry && sendImmediately && createdEntry) {
          // Disparar emissão
          toast.loading('Emitindo ingresso...', { id: 'issue' })
          const res = await fetch('/api/courtesy/issue', {
            method: 'POST',
            body: JSON.stringify({ entryId: createdEntry.id }),
            headers: { 'Content-Type': 'application/json' }
          })
          const issueResult = await res.json()
          if (issueResult.success) {
            toast.success('Ingresso emitido e enviado por e-mail!', { id: 'issue' })
          } else {
            toast.error(`Salvo, mas erro ao emitir: ${issueResult.error}`, { id: 'issue' })
          }
          router.refresh()
        } else {
          toast.success(entry ? 'Convidado atualizado!' : 'Convidado adicionado à lista!')
        }
        onClose()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const defaultDate = entry?.expires_at ? new Date(entry.expires_at).toISOString().slice(0, 16) : ''

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-none shadow-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-gray-900">{entry ? 'Editar convidado' : 'Adicionar convidado'}</DialogTitle>
          <DialogDescription className="text-gray-500">
            Insira os dados do convidado e o tipo de ingresso que ele receberá.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900 border-b pb-2">Dados do convidado</h4>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_name" className="text-sm font-semibold text-gray-700">Nome completo *</Label>
                <Input id="guest_name" name="guest_name" required defaultValue={entry?.guest_name} className="rounded-xl border-gray-200 h-11 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest_email" className="text-sm font-semibold text-gray-700">E-mail *</Label>
                <Input id="guest_email" name="guest_email" type="email" required defaultValue={entry?.guest_email} className="rounded-xl border-gray-200 h-11 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_phone" className="text-sm font-semibold text-gray-700">Telefone (Opcional)</Label>
                <Input id="guest_phone" name="guest_phone" defaultValue={entry?.guest_phone || ''} className="rounded-xl border-gray-200 h-11 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest_document" className="text-sm font-semibold text-gray-700">Documento (Opcional)</Label>
                <Input id="guest_document" name="guest_document" placeholder="CPF/RG" defaultValue={entry?.guest_document || ''} className="rounded-xl border-gray-200 h-11 focus:ring-primary/20" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900 border-b pb-2">Ingresso</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3 space-y-2">
                <Label htmlFor="ticket_type_id" className="text-sm font-semibold text-gray-700">Tipo de ingresso *</Label>
                <div className="relative">
                  <select 
                    id="ticket_type_id"
                    name="ticket_type_id" 
                    value={selectedTicketType} 
                    onChange={(e) => setSelectedTicketType(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 h-11 px-4 bg-white focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer text-sm text-gray-900"
                  >
                    <option value="" disabled>Selecione um ingresso</option>
                    {ticketTypes.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.price === 0 ? '(Cortesia)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">Quantidade *</Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  min="1" 
                  max="100" 
                  required 
                  defaultValue={entry?.quantity || 1}
                  className="rounded-xl border-gray-200 h-11 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at" className="text-sm font-semibold text-gray-700">Data de expiração (Opcional)</Label>
              <Input id="expires_at" name="expires_at" type="datetime-local" defaultValue={defaultDate} className="rounded-xl border-gray-200 h-11 focus:ring-primary/20" />
              <p className="text-[11px] text-gray-500 ml-1">Se não for emitido até esta data, será expirado.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-semibold text-gray-700">Mensagem pessoal (Opcional)</Label>
              <Textarea 
                id="note" 
                name="note" 
                placeholder="Esta mensagem aparecerá no e-mail do convidado..." 
                maxLength={300}
                defaultValue={entry?.note || ''}
                className="rounded-xl border-gray-200 focus:ring-primary/20 resize-none min-h-[100px]"
              />
            </div>
          </div>

          {!entry && (
            <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 p-4 bg-gray-50/50 shadow-sm">
              <div className="space-y-0.5">
                <Label htmlFor="send-now" className="text-sm font-bold text-gray-900 cursor-pointer">Enviar agora</Label>
                <p className="text-xs text-gray-500">
                  {sendImmediately 
                    ? "O convidado receberá o ingresso por e-mail." 
                    : "Ingresso ficará pendente para emissão manual."}
                </p>
              </div>
              <Switch 
                id="send-now"
                checked={sendImmediately} 
                onCheckedChange={setSendImmediately}
                className="data-[checked]:bg-primary"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              disabled={loading}
              className="rounded-xl text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8 shadow-lg shadow-primary/20"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!entry && sendImmediately ? 'Salvar e emitir' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
