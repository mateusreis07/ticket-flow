import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstallments } from '@/lib/mercadopago'
import { formatCurrency } from '@/lib/utils/format'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const amountStr = searchParams.get('amount')
    const bin = searchParams.get('bin')

    if (!amountStr || !bin || bin.length !== 6) {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Valor inválido' }, { status: 400 })
    }

    const installments = await getInstallments(amount, bin)
    
    return NextResponse.json({ success: true, installments })
  } catch (error: any) {
    console.error('Erro ao buscar parcelas:', error)
    
    const amountStr = new URL(req.url).searchParams.get('amount')
    const amount = Number(amountStr) || 0
    
    // Retorna fallback seguro se falhar
    return NextResponse.json({
      success: true,
      installments: [{
        quantity: 1,
        amount,
        totalAmount: amount,
        label: '1x de ' + formatCurrency(amount) + ' sem juros'
      }]
    })
  }
}
