'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCourtesyList, updateCourtesyList } from '@/lib/actions/courtesy'
import { CourtesyList, CourtesyListType } from '@/types'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CourtesyListModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  list?: CourtesyList
}

const listTypes: { id: CourtesyListType; label: string; emoji: string }[] = [
  { id: 'courtesy', label: 'Cortesia', emoji: '🎁' },
  { id: 'vip', label: 'VIP', emoji: '⭐' },
  { id: 'press', label: 'Imprensa', emoji: '📰' },
  { id: 'staff', label: 'Staff', emoji: '🎪' },
  { id: 'sponsor', label: 'Patrocinador', emoji: '🤝' },
  { id: 'guest', label: 'Convidado', emoji: '🎟' },
]

export function CourtesyListModal({ isOpen, onClose, eventId, list }: CourtesyListModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<CourtesyListType>(list?.list_type || 'courtesy')
  
  // Atualiza o tipo selecionado quando o modal abre ou a lista muda
  useEffect(() => {
    if (isOpen) {
      setSelectedType(list?.list_type || 'courtesy')
    }
  }, [isOpen, list])

  async function action(formData: FormData) {
    setLoading(true)
    formData.append('list_type', selectedType)
    
    try {
      const result = list 
        ? await updateCourtesyList(list.id, eventId, formData)
        : await createCourtesyList(eventId, formData)

      if (result.success) {
        toast.success(list ? 'Lista atualizada!' : 'Lista criada com sucesso!')
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-none shadow-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {list ? 'Editar lista' : 'Nova lista de cortesia'}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Nome da lista</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Lista VIP, Imprensa, Staff..."
              defaultValue={list?.name}
              className="rounded-xl border-gray-200 focus:border-primary/50 focus:ring-primary/20 h-11"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Tipo</Label>
            <div className="grid grid-cols-2 gap-3">
              {listTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm transition-all duration-200 text-left ${
                    selectedType === type.id
                      ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                      : 'border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50/50'
                  }`}
                >
                  <span className="text-xl grayscale-[0.5] group-hover:grayscale-0">{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Notas internas sobre esta lista..."
              defaultValue={list?.description || ''}
              rows={2}
              className="rounded-xl border-gray-200 focus:border-primary/50 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_entries" className="text-sm font-semibold text-gray-700">Limite de convidados (Opcional)</Label>
            <Input
              id="max_entries"
              name="max_entries"
              type="number"
              min="1"
              placeholder="Sem limite"
              defaultValue={list?.max_entries || ''}
              className="rounded-xl border-gray-200 focus:border-primary/50 focus:ring-primary/20 h-11"
            />
            <p className="text-[11px] text-gray-500 ml-1">Deixe em branco para lista ilimitada.</p>
          </div>

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
              {list ? 'Salvar alterações' : 'Criar lista'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
