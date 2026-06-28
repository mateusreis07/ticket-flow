import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

import * as Sentry from '@sentry/nextjs'

const PROTECTED_ROUTES = ['/dashboard', '/meus-ingressos']

export async function middleware(request: NextRequest) {
  try {
    const { supabaseResponse, user } = await updateSession(request)

    const pathname = request.nextUrl.pathname
    const isProtected = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    )

    if (isProtected && !user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Redireciona por role nas rotas protegidas
    if (isProtected && user) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {}
          },
        }
      )

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (pathname.startsWith('/dashboard') && profile?.role !== 'organizer') {
        return NextResponse.redirect(new URL('/meus-ingressos', request.url))
      }

      if (pathname.startsWith('/meus-ingressos') && profile?.role === 'organizer') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Add Rate Limit for API routes
    if (pathname.startsWith('/api/')) {
      const excluded = ['/api/health', '/api/webhooks', '/api/sentry-test']
      if (!excluded.some(r => pathname.startsWith(r))) {
        const { checkRateLimit, getIdentifier } = await import('@/lib/rate-limit')
        const identifier = getIdentifier(request as any)
        const rlResult = await checkRateLimit('api', identifier)
        if (!rlResult.success) {
          return new NextResponse(
            JSON.stringify({ error: 'Too many requests' }),
            {
              status: rlResult.reason === 'redis_unavailable' ? 503 : 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(rlResult.retryAfter ?? 60),
              }
            }
          )
        }
      }
    }

    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
    supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
    supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')

    return supabaseResponse
  } catch (error) {
    Sentry.captureException(error, {
      tags: { location: 'middleware' },
      extra: {
        pathname: request.nextUrl.pathname,
      },
    })
    
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
