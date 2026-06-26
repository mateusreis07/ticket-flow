import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config'

import * as Sentry from '@sentry/nextjs'

export async function GET() {
  let dbStatus = 'error'
  
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('events').select('id').limit(1)
    
    if (!error) {
      dbStatus = 'ok'
    }
  } catch (err) {
    console.error('Health check DB error:', err)
  }

  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: config.app.isTestMode ? 'test' : 'production',
    services: {
      database: dbStatus,
      sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'not_configured',
    },
    version: process.env.npm_package_version ?? '1.0.0',
  }

  if (dbStatus === 'error') {
    Sentry.captureMessage('Health check: database connection failed', 'error')
    healthData.status = 'degraded'
  }

  return NextResponse.json(healthData, { status: healthData.status === 'ok' ? 200 : 503 })
}
