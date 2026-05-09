import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Simples in-memory rate limit store
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 30 // 30 scans per minute

  let record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs }
    rateLimitMap.set(ip, record)
    return true
  }

  record.count++
  if (record.count > maxRequests) {
    return false
  }
  
  return true
}

async function handleVerify(req: Request, qrCode: string) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 1. Buscar o ticket pelo qr_code usando o supabaseAdmin para ter acesso aos dados relacionados (perfis)
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        events (
          title,
          event_date,
          organizer_id
        ),
        ticket_types (
          name
        ),
        profiles!buyer_id (
          name,
          email
        )
      `)
      .eq('qr_code', qrCode)
      .single()

    const logVerification = (valid: boolean, reason?: string) => {
      console.log(JSON.stringify({
        event: 'ticket_scan',
        qrCode: qrCode ? qrCode.slice(-8) : null,
        valid,
        reason: reason ?? null,
        organizerId: user.id,
        timestamp: new Date().toISOString(),
      }))
    }

    // 2. Se não encontrado
    if (error || !ticket) {
      logVerification(false, 'Ingresso não encontrado')
      return NextResponse.json({
        valid: false,
        reason: 'Ingresso não encontrado'
      }, { status: 404 })
    }

    const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events
    const ticketType = Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types
    const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles

    // 3. Verificar se o organizador logado é dono do evento
    if (event.organizer_id !== user.id) {
      logVerification(false, 'Você não tem permissão para validar este ingresso')
      return NextResponse.json({
        valid: false,
        reason: 'Você não tem permissão para validar este ingresso'
      }, { status: 403 })
    }

    // 4. Se is_used = true
    if (ticket.is_used) {
      logVerification(false, 'Ingresso já utilizado')
      return NextResponse.json({
        valid: false,
        reason: 'Ingresso já utilizado',
        used_at: ticket.used_at,
        ticket: { 
          buyer_name: profile.name, 
          ticket_type_name: ticketType.name, 
          event_title: event.title 
        }
      })
    }

    // 5. Se evento já passou (event_date < hoje)
    const eventDate = new Date(event.event_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (eventDate < today) {
      logVerification(false, 'Este evento já encerrou')
      return NextResponse.json({
        valid: false,
        reason: 'Este evento já encerrou'
      })
    }

    // 6. Tudo ok, marcar como utilizado
    const now = new Date().toISOString()
    
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({ is_used: true, used_at: now })
      .eq('qr_code', qrCode)
      .eq('is_used', false)

    if (updateError) {
      logVerification(false, 'Erro ao marcar ingresso como utilizado')
      throw updateError
    }

    logVerification(true)

    // 7. Retornar sucesso
    return NextResponse.json({
      valid: true,
      message: 'Entrada liberada!',
      ticket: {
        id: ticket.id,
        buyer_name: profile.name,
        buyer_email: profile.email,
        ticket_type_name: ticketType.name,
        event_title: event.title,
        event_date: event.event_date,
        used_at: now
      }
    })

  } catch (error: any) {
    console.error('Erro ao verificar ingresso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { qrCode: string } }
) {
  return handleVerify(req, params.qrCode)
}

export async function POST(
  req: Request,
  { params }: { params: { qrCode: string } } // params type mantido caso a rota ainda seja dynamique mas leremos do body
) {
  try {
    const body = await req.json()
    const qrCode = body.qrCode || params.qrCode
    
    if (!qrCode) {
      return NextResponse.json({ error: 'QR Code não fornecido' }, { status: 400 })
    }

    return handleVerify(req, qrCode)
  } catch (e) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
}
