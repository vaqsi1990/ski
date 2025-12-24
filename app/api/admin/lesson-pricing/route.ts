import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pricing = await prisma.lessonPricing.findMany({
      orderBy: [
        { numberOfPeople: 'asc' },
        { duration: 'asc' },
      ],
    })

    // Convert to matrix format for easier use
    const pricingMatrix: Record<number, Record<number, number>> = {}
    pricing.forEach((p: { numberOfPeople: number; duration: number; price: number }) => {
      if (!pricingMatrix[p.numberOfPeople]) {
        pricingMatrix[p.numberOfPeople] = {}
      }
      pricingMatrix[p.numberOfPeople][p.duration] = p.price
    })

    return NextResponse.json({ pricing: pricingMatrix, items: pricing })
  } catch (error) {
    console.error('Failed to fetch lesson pricing', error)
    return NextResponse.json({ message: 'Failed to fetch lesson pricing' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { numberOfPeople, duration, price } = body

    if (!numberOfPeople || !duration || price === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const people = parseInt(numberOfPeople)
    const hours = parseInt(duration)
    const priceValue = parseFloat(price)

    if (people < 1 || people > 4) {
      return NextResponse.json({ message: 'Number of people must be between 1 and 4' }, { status: 400 })
    }

    if (![1, 2, 3].includes(hours)) {
      return NextResponse.json({ message: 'Duration must be 1, 2, or 3 hours' }, { status: 400 })
    }

    if (priceValue <= 0) {
      return NextResponse.json({ message: 'Price must be greater than 0' }, { status: 400 })
    }

    const pricing = await prisma.lessonPricing.upsert({
      where: {
        numberOfPeople_duration: {
          numberOfPeople: people,
          duration: hours,
        },
      },
      update: {
        price: priceValue,
      },
      create: {
        numberOfPeople: people,
        duration: hours,
        price: priceValue,
      },
    })

    return NextResponse.json({ pricing, message: 'Lesson pricing updated successfully' })
  } catch (error) {
    console.error('Failed to update lesson pricing', error)
    return NextResponse.json({ message: 'Failed to update lesson pricing' }, { status: 500 })
  }
}

