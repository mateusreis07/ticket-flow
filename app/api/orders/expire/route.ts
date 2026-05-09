import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cancelExpiredOrder } from '@/lib/actions/orders'

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = req.headers.get('authorization')
    const xCronSecret = req.headers.get('x-cron-secret')
    
    const isVercelCron = authHeader === `Bearer ${cronSecret}`
    const isManual = xCronSecret === cronSecret
    
    if (!isVercelCron && !isManual) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: expiredOrders, error } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())

    if (error) throw error

    let cancelledCount = 0

    if (expiredOrders && expiredOrders.length > 0) {
      for (const order of expiredOrders) {
        try {
          await cancelExpiredOrder(order.id)
          cancelledCount++
        } catch (e) {
          console.error(`Erro ao cancelar pedido expirado ${order.id}:`, e)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      cancelled: cancelledCount 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro na rotina de expiração de pedidos:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
