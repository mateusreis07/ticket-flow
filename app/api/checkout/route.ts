import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  return NextResponse.json(
    { 
      error: 'Este endpoint foi substituído pelo Mercado Pago. Use /api/checkout/card ou /api/checkout/pix' 
    },
    { status: 410 }
  )
}
