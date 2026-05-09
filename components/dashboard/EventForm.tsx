'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, Rocket, X } from 'lucide-react'
import Image from 'next/image'
import { Switch } from '@/components/ui/switch'
import { uploadEventCover } from '@/lib/actions/events'

const eventSchema = z.object({
  title: z.string().min(5, 'O nome deve ter no mínimo 5 caracteres'),
  description: z.string().optional(),
  location: z.string().min(3, 'O local deve ter no mínimo 3 caracteres'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  event_date: z.string().min(1, 'Informe a data do evento'),
  event_time: z.string().min(1, 'Informe o horário'),
})

type EventFormValues = z.infer<typeof eventSchema>

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

interface EventFormProps {
  initialValues?: any
  onSubmitAction: (formData: FormData) => Promise<any>
  submitLabel?: string
}

export default function EventForm({ initialValues, onSubmitAction, submitLabel = "Publicar evento" }: EventFormProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(initialValues?.cover_image_url || null)
  const [publishImmediately, setPublishImmediately] = useState(initialValues?.status === 'published' || initialValues === undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish'>('publish')

  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      location: initialValues?.location || '',
      city: initialValues?.city || '',
      state: initialValues?.state || '',
      event_date: initialValues?.event_date || '',
      event_time: initialValues?.event_time || '',
    }
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB')
        return
      }
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setCoverFile(null)
    setCoverPreview(null)
  }

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })

      const finalAction = submitAction === 'draft' ? 'draft' : (publishImmediately ? 'publish' : 'draft')
      formData.append('action', finalAction)

      let coverUrl = initialValues?.cover_image_url || ''
      
      if (coverFile) {
        try {
          const uploadData = new FormData()
          uploadData.append('file', coverFile)
          coverUrl = await uploadEventCover(uploadData)
        } catch (error) {
          console.error("Erro no uploadEventCover:", error)
          alert('Erro ao fazer upload da imagem. Veja o console para mais detalhes.')
          setIsSubmitting(false)
          return
        }
      } else if (!coverPreview) {
        coverUrl = ''
      }
      
      formData.append('cover_image_url', coverUrl)

      await onSubmitAction(formData)
      
    } catch (error) {
      console.error(error)
      alert('Ocorreu um erro ao salvar o evento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-8">
      {/* Coluna principal */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informações básicas</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do evento *</label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                placeholder="Ex: Rock in Belém 2026"
              />
              {errors.title && <span className="text-red-500 text-xs mt-1 block">{errors.title.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                placeholder="Conte sobre o seu evento..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Data e local</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do evento *</label>
                <input
                  type="date"
                  {...register('event_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
                {errors.event_date && <span className="text-red-500 text-xs mt-1 block">{errors.event_date.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário *</label>
                <input
                  type="time"
                  {...register('event_time')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
                {errors.event_time && <span className="text-red-500 text-xs mt-1 block">{errors.event_time.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local / Nome do espaço *</label>
              <input
                type="text"
                {...register('location')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                placeholder="Ex: Hangar Centro de Convenções"
              />
              {errors.location && <span className="text-red-500 text-xs mt-1 block">{errors.location.message}</span>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Ex: Belém"
                />
                {errors.city && <span className="text-red-500 text-xs mt-1 block">{errors.city.message}</span>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select
                  {...register('state')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                >
                  <option value="">UF</option>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                {errors.state && <span className="text-red-500 text-xs mt-1 block">{errors.state.message}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna lateral */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Imagem de capa</h2>
          
          {!coverPreview ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary/50 cursor-pointer transition-colors bg-gray-50/50">
              <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Clique ou arraste a imagem</span>
              <span className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</span>
              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageChange} />
            </label>
          ) : (
            <div className="relative">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-200">
                <Image src={coverPreview} alt="Capa" fill className="object-cover" />
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Publicação</h2>
          
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="publish" className="text-sm font-medium text-gray-700 cursor-pointer">
              Publicar imediatamente
            </label>
            <Switch 
              id="publish" 
              checked={publishImmediately} 
              onCheckedChange={setPublishImmediately} 
            />
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Se desativado, o evento será salvo como rascunho e não ficará visível ao público.
          </p>

          <div className="space-y-3">
            <button
              type="submit"
              onClick={() => setSubmitAction('draft')}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
            >
              Salvar rascunho
            </button>
            <button
              type="submit"
              onClick={() => setSubmitAction('publish')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors text-sm disabled:opacity-50 shadow-sm"
            >
              <Rocket className="h-4 w-4" />
              {isSubmitting ? 'Processando...' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
