'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUp } from '@/lib/supabase/actions'
import { Ticket, Check, User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function CadastroPage() {
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || ''

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = (data: RegisterForm) => {
    setErrorMsg(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('password', data.password)
      
      const result = await signUp(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else if (result?.success) {
        setSuccessEmail(data.email)
      }
    })
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      {/* Coluna Esquerda - Desktop */}
      <div className="hidden md:flex bg-primary h-full flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-2xl">
          <Ticket className="h-8 w-8 text-white" />
          <span>TicketFlow</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Conectando pessoas a experiências incríveis.
          </h1>
          <p className="mt-4 text-primary-light text-lg">
            Mais de 1.000 eventos acontecem na plataforma todo mês.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium">Ingressos digitais com QR Code</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium">Dashboard para organizadores</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium">Pagamento seguro via Stripe</span>
          </div>
        </div>
      </div>

      {/* Coluna Direita - Formulário */}
      <div className="flex items-center justify-center p-8 bg-white min-h-screen md:min-h-0">
        <div className="w-full max-w-sm mx-auto">
          
          {successEmail ? (
            <div className="text-center py-10 animate-fade-in">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta criada com sucesso!</h2>
              <p className="text-gray-500 mb-8">
                Enviamos um e-mail de confirmação para <span className="font-medium text-gray-900">{successEmail}</span>.
                Verifique sua caixa de entrada para ativar sua conta.
              </p>
              <Link href={`/auth/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`} className="text-primary font-medium hover:underline">
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Crie sua conta</h2>
                <p className="text-gray-500 text-sm mt-1">Comece a usar o TicketFlow hoje mesmo</p>
              </div>

              {errorMsg && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all ${
                        errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                      }`}
                      placeholder="João da Silva"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all ${
                        errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                      }`}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none transition-all ${
                        errors.password ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none transition-all ${
                        errors.confirmPassword ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-primary text-white rounded-lg py-2.5 mt-4 font-medium hover:bg-primary-hover transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta grátis'
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link href={`/auth/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`} className="text-primary font-medium hover:underline">
                  Entre aqui
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
