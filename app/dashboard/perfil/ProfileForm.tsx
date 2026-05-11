'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Check, X, Camera, Image as ImageIcon } from 'lucide-react'
import { OrganizerProfile } from '@/types'
import { updateOrganizerProfile, checkUsernameAvailable } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/client'

export function ProfileForm({ organizer, userId }: { organizer: OrganizerProfile, userId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Username check
  const [username, setUsername] = useState(organizer.username || '')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  // Files
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(organizer.avatar_url || '')
  const [coverUrl, setCoverUrl] = useState(organizer.cover_url || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  // Debounced username check
  useEffect(() => {
    if (username === organizer.username) {
      setUsernameAvailable(null)
      return
    }

    if (!username || username.length < 3 || !/^[a-z0-9-]+$/.test(username)) {
      setUsernameAvailable(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true)
      const res = await checkUsernameAvailable(username)
      setUsernameAvailable(res.available)
      setIsCheckingUsername(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [username, organizer.username])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'O arquivo não pode ter mais de 5MB' })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    if (type === 'avatar') {
      setAvatarFile(file)
      setAvatarUrl(previewUrl)
    } else {
      setCoverFile(file)
      setCoverUrl(previewUrl)
    }
  }

  const uploadImage = async (file: File, bucket: string) => {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}` // Cache busting
    const filePath = bucket === 'avatars' ? fileName : `${userId}/cover-${Date.now()}.${fileExt}`

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (usernameAvailable === false) {
      setMessage({ type: 'error', text: 'Por favor, escolha um username válido e disponível.' })
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData(e.currentTarget)
      
      // Upload files if selected
      if (avatarFile) {
        const url = await uploadImage(avatarFile, 'avatars')
        formData.set('avatar_url', url)
      } else {
        formData.set('avatar_url', organizer.avatar_url || '')
      }
      
      if (coverFile) {
        const url = await uploadImage(coverFile, 'covers')
        formData.set('cover_url', url)
      } else {
        formData.set('cover_url', organizer.cover_url || '')
      }

      const result = await updateOrganizerProfile(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Ocorreu um erro ao salvar o perfil.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Preview */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Preview</h3>
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center overflow-hidden relative shrink-0 border border-gray-200">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{organizer.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900">{organizer.name}</p>
            <p className="text-sm text-gray-500">@{username || 'username'}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Identidade */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Identidade</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do organizador *</label>
            <input 
              type="text" 
              name="name"
              defaultValue={organizer.name}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username (URL)</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
              <span className="bg-gray-50 px-4 py-2 text-gray-500 text-sm border-r border-gray-300 flex items-center">
                ticketflow.com/organizadores/
              </span>
              <input 
                type="text" 
                name="username"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                placeholder="seu-nome"
                className="w-full px-4 py-2 outline-none"
              />
              <div className="pr-3 flex items-center justify-center w-10">
                {isCheckingUsername ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : 
                  usernameAvailable === true ? <Check className="w-4 h-4 text-green-500" /> : 
                  usernameAvailable === false ? <X className="w-4 h-4 text-red-500" /> : null
                }
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Apenas minúsculas, números, pontos, hífens e underlines.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Sobre você)</label>
            <textarea 
              name="bio"
              defaultValue={organizer.bio || ''}
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Imagens */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto de perfil</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative border border-gray-200 shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => handleFileChange(e, 'avatar')} />
              <button 
                type="button" 
                onClick={() => avatarInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
              >
                Alterar foto
              </button>
              <p className="text-xs text-gray-500 mt-2">JPG, PNG ou WebP. Máximo 2MB.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagem de capa</h2>
          <div className="space-y-4">
            <div className="w-full aspect-[3/1] rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden relative border border-gray-200">
              {coverUrl ? (
                <Image src={coverUrl} alt="Cover" fill className="object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <input type="file" ref={coverInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => handleFileChange(e, 'cover')} />
              <button 
                type="button" 
                onClick={() => coverInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
              >
                Alterar capa
              </button>
              <p className="text-xs text-gray-500">1500×500px. Máx 5MB.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Localização e contato</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input type="text" name="city" defaultValue={organizer.city || ''} className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
            <input type="text" name="state" defaultValue={organizer.state || ''} maxLength={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <input type="url" name="website" defaultValue={organizer.website || ''} placeholder="https://seusite.com" className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input type="text" name="instagram" defaultValue={organizer.instagram || ''} placeholder="@seuinstagram" className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            <input type="text" name="facebook" defaultValue={organizer.facebook || ''} placeholder="URL ou nome" className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input type="text" name="whatsapp" defaultValue={organizer.whatsapp || ''} placeholder="Ex: 11999999999" className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 bg-white md:bg-transparent border-t md:border-0 border-gray-200 z-50">
        <button 
          type="submit" 
          disabled={isLoading || usernameAvailable === false}
          className="w-full md:w-auto bg-primary text-white rounded-xl px-8 py-3 font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isLoading ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
