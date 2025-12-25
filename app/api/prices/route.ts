import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const prices = await prisma.priceList.findMany({
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Failed to load prices', error)
    return NextResponse.json({ message: 'Failed to load prices' }, { status: 500 })
  }
}

