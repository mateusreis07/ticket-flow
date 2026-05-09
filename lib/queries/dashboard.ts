import { supabaseAdmin } from '@/lib/supabase/admin'
import { OverviewMetrics, SalesDataPoint, TopEvent, RecentOrder } from '@/types'

export async function getOverviewMetrics(organizerId: string): Promise<OverviewMetrics> {
  const [
    { count: totalEvents },
    { count: publishedEvents },
    { data: paidOrders },
    { count: pendingOrders },
    { data: nextEvent }
  ] = await Promise.all([
    supabaseAdmin.from('events').select('*', { count: 'exact', head: true }).eq('organizer_id', organizerId),
    supabaseAdmin.from('events').select('*', { count: 'exact', head: true }).eq('organizer_id', organizerId).eq('status', 'published'),
    supabaseAdmin.from('orders').select('total_amount, events!inner(organizer_id), order_items(quantity)').eq('events.organizer_id', organizerId).eq('status', 'paid'),
    supabaseAdmin.from('orders').select('*, events!inner(organizer_id)', { count: 'exact', head: true }).eq('events.organizer_id', organizerId).eq('status', 'pending'),
    supabaseAdmin.from('events').select('id, title, event_date, event_time, location, city').eq('organizer_id', organizerId).eq('status', 'published').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date', { ascending: true }).limit(1).single()
  ])

  let totalTicketsSold = 0
  let totalRevenue = 0

  if (paidOrders) {
    paidOrders.forEach((order: any) => {
      totalRevenue += Number(order.total_amount) || 0
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          totalTicketsSold += Number(item.quantity) || 0
        })
      }
    })
  }

  return {
    totalEvents: totalEvents || 0,
    publishedEvents: publishedEvents || 0,
    totalTicketsSold,
    totalRevenue,
    pendingOrders: pendingOrders || 0,
    nextEvent: nextEvent || null
  }
}

export async function getSalesOverTime(organizerId: string, days: number = 30): Promise<SalesDataPoint[]> {
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - days)
  const pastDateString = pastDate.toISOString().split('T')[0]

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('created_at, total_amount, id, events!inner(organizer_id)')
    .eq('events.organizer_id', organizerId)
    .eq('status', 'paid')
    .gte('created_at', pastDateString)

  const grouped = (orders || []).reduce((acc: any, order) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { orders: new Set(), revenue: 0 }
    }
    acc[date].orders.add(order.id)
    acc[date].revenue += Number(order.total_amount)
    return acc
  }, {})

  const result: SalesDataPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    
    result.push({
      date: dateStr,
      orders: grouped[dateStr]?.orders.size || 0,
      revenue: grouped[dateStr]?.revenue || 0
    })
  }

  return result
}

export async function getTopEvents(organizerId: string): Promise<TopEvent[]> {
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, event_date, status, city, state, orders(status, total_amount, order_items(quantity)), ticket_types(quantity_total)')
    .eq('organizer_id', organizerId)

  const mappedEvents = (events || []).map((e: any) => {
    let tickets_sold = 0
    let tickets_total = 0
    let revenue = 0
    
    if (e.ticket_types) {
      e.ticket_types.forEach((tt: any) => {
        tickets_total += Number(tt.quantity_total) || 0
      })
    }

    if (e.orders) {
      e.orders.forEach((o: any) => {
        if (o.status === 'paid') {
          revenue += Number(o.total_amount) || 0
          if (o.order_items) {
            o.order_items.forEach((item: any) => {
              tickets_sold += Number(item.quantity) || 0
            })
          }
        }
      })
    }

    return {
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      status: e.status,
      city: e.city,
      state: e.state,
      tickets_sold,
      tickets_total,
      revenue
    }
  })

  return mappedEvents.sort((a, b) => b.tickets_sold - a.tickets_sold).slice(0, 5)
}

export async function getRecentOrders(organizerId: string, limit: number = 10): Promise<RecentOrder[]> {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      total_amount,
      status,
      created_at,
      events!inner(title, organizer_id),
      profiles!buyer_id(name, email),
      order_items(id, quantity)
    `)
    .eq('events.organizer_id', organizerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (orders || []).map((o: any) => {
    const event = Array.isArray(o.events) ? o.events[0] : o.events
    const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles
    const items = o.order_items || []
    
    return {
      id: o.id,
      total_amount: Number(o.total_amount) || 0,
      status: o.status,
      created_at: o.created_at,
      event_title: event?.title || '',
      buyer_name: profile?.name || '',
      buyer_email: profile?.email || '',
      items_count: items.length,
      tickets_count: items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)
    }
  })
}

export async function getEventDetails(eventId: string, organizerId: string) {
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('organizer_id', organizerId)
    .single()

  if (eventError || !event) return null

  // Distribuição de vendas por tipo de ingresso
  const { data: ticketTypes } = await supabaseAdmin
    .from('ticket_types')
    .select('id, name, price, quantity_total')
    .eq('event_id', eventId)

  // Pedidos e itens para obter vendas e receita reais
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 30)
  const pastDateString = pastDate.toISOString().split('T')[0]

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('created_at, total_amount, id, status, order_items(quantity, ticket_type_id, ticket_types(name)), profiles!buyer_id(name, email)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  const salesData: SalesDataPoint[] = []
  const groupedSales = (orders || []).filter(o => o.status === 'paid' && o.created_at >= pastDateString).reduce((acc: any, order) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { orders: new Set(), revenue: 0 }
    }
    acc[date].orders.add(order.id)
    acc[date].revenue += Number(order.total_amount)
    return acc
  }, {})

  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    salesData.push({
      date: dateStr,
      orders: groupedSales[dateStr]?.orders.size || 0,
      revenue: groupedSales[dateStr]?.revenue || 0
    })
  }

  // Montar ticketTypes com vendas reais
  let eventTotalTicketsSold = 0
  let eventTotalRevenue = 0
  
  const enrichedTicketTypes = (ticketTypes || []).map((tt: any) => {
    let sold = 0
    let rev = 0
    if (orders) {
      orders.filter(o => o.status === 'paid').forEach((o: any) => {
        if (o.order_items) {
          o.order_items.forEach((item: any) => {
            if (item.ticket_type_id === tt.id) {
              sold += Number(item.quantity) || 0
              rev += (Number(item.quantity) || 0) * (Number(tt.price) || 0)
            }
          })
        }
      })
    }
    eventTotalTicketsSold += sold
    eventTotalRevenue += rev
    
    return {
      name: tt.name,
      price: tt.price,
      quantity_sold: sold,
      quantity_total: tt.quantity_total,
      revenue: rev
    }
  })

  event.total_tickets_sold = eventTotalTicketsSold
  event.revenue = eventTotalRevenue

  const recentOrders = (orders || []).slice(0, 50).map((o: any) => {
    const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles
    const items = o.order_items || []
    
    const ticketTypesBought = items.map((i: any) => {
      const typeName = Array.isArray(i.ticket_types) ? i.ticket_types[0]?.name : i.ticket_types?.name
      return `${i.quantity}x ${typeName}`
    }).join(', ')

    return {
      id: o.id,
      buyer_name: profile?.name || '',
      buyer_email: profile?.email || '',
      ticket_types: ticketTypesBought,
      total_amount: o.total_amount,
      created_at: o.created_at,
      status: o.status
    }
  })

  return {
    event,
    ticketTypes: enrichedTicketTypes,
    salesData,
    recentOrders
  }
}
