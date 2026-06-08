import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  
  if (error) {
    const errorDescription = searchParams.get('error_description') ?? error
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      // Se houver next válido, redireciona para lá
      if (next && next.startsWith('/') && next !== '/') {
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      // Redireciona com base na role
      if (profile?.role === 'organizer') {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      return NextResponse.redirect(`${origin}/meus-ingressos`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
