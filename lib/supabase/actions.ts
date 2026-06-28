'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPath = formData.get('redirectPath') as string

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const rlResult = await checkRateLimit('auth', ip)
  if (!rlResult.success) {
    return {
      error: rlResult.reason === 'redis_unavailable'
        ? 'Serviço temporariamente indisponível.'
        : `Muitas tentativas. Aguarde ${rlResult.retryAfter} segundos.`
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  // Busca o profile para saber a role
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Se houver redirectPath válido (começando com /), vai pra lá
    if (redirectPath && redirectPath.startsWith('/')) {
      redirect(redirectPath)
    }

    // Senão, vai para a rota padrão da role
    if (profile?.role === 'organizer') {
      redirect('/dashboard')
    } else {
      redirect('/meus-ingressos')
    }
  }
}

export async function signUp(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'buyer',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Conta criada! Verifique seu e-mail para confirmar.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient()
  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!
  
  const callbackUrl = new URL('/auth/callback', origin)
  
  if (redirectTo) {
    callbackUrl.searchParams.set('next', redirectTo)
  } else {
    callbackUrl.searchParams.set('next', '/meus-ingressos')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('OAuth error:', error.message)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

