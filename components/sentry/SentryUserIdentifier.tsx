'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SentryUserIdentifier() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const identifyUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email ?? undefined,
        })
      } else {
        Sentry.setUser(null)
      }
    }

    identifyUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        Sentry.setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
        })
      } else {
        Sentry.setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
