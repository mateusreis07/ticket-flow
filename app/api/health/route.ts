import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config'

export async function GET() {
  let dbStatus = 'error'
  
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('events').select('id').limit(1)
    
    if (!error) {
      dbStatus = 'ok'
    }
  } catch (err) {
    console.error('Health check DB error:', err)
  }

  const isHealthy = dbStatus === 'ok'

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      mode: config.app.isTestMode ? 'test' : 'production',
      services: {
        database: dbStatus,
      }
    },
    { status: isHealthy ? 200 : 503 }
  )
}
