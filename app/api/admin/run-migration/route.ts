import { NextResponse } from 'next/server'
import { Client } from 'pg'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    
    // Drop constraint
    await client.query('ALTER TABLE push_notifications DROP CONSTRAINT IF EXISTS push_notifications_type_check;')
    
    // Create new constraint
    await client.query(`
      ALTER TABLE push_notifications 
      ADD CONSTRAINT push_notifications_type_check 
      CHECK (type IN (
        'order_confirmed', 
        'event_reminder', 
        'event_cancelled', 
        'ticket_transferred', 
        'new_event', 
        'promotional', 
        'checkin_milestone', 
        'courtesy_ticket'
      ));
    `)
    
    return NextResponse.json({ success: true, message: 'Constraint updated successfully' })
  } catch (err: any) {
    console.error('Migration error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
