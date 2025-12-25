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

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { prices } = body

    if (!Array.isArray(prices)) {
      return NextResponse.json({ message: 'Prices must be an array' }, { status: 400 })
    }

    // Update or create each price
    const results = await Promise.all(
      prices.map(async (price: { itemKey: string; type: string; includes: string; price: string }) => {
        return prisma.priceList.upsert({
          where: { itemKey: price.itemKey },
          update: {
            type: price.type,
            includes: price.includes,
            price: price.price,
          },
          create: {
            itemKey: price.itemKey,
            type: price.type,
            includes: price.includes,
            price: price.price,
          },
        })
      })
    )

    return NextResponse.json({ prices: results })
  } catch (error) {
    console.error('Failed to update prices', error)
    return NextResponse.json({ message: 'Failed to update prices' }, { status: 500 })
  }
}

