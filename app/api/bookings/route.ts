import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      productId,
      firstName,
      lastName,
      phoneNumber,
      email,
      personalId,
      numberOfPeople,
      startDate,
      endDate,
      totalPrice,
    } = body

    if (!productId || !firstName || !lastName || !phoneNumber || !email || !startDate || !endDate || !totalPrice || !numberOfPeople) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
      return NextResponse.json({ message: 'End date must be after start date' }, { status: 400 })
    }
    
    // Validate booking period (max 2 weeks / 14 days)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 14) {
      return NextResponse.json({ message: 'Booking period cannot exceed 2 weeks (14 days)' }, { status: 400 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const booking = await prisma.booking.create({
      data: {
        productId,
        firstName,
        lastName,
        phoneNumber,
        email,
        personalId: personalId || '',
        numberOfPeople: numberOfPeople || null,
        startDate: start,
        endDate: end,
        totalPrice: parseFloat(totalPrice),
        status: BookingStatus.PENDING,
      },
      include: { product: true },
    })

    return NextResponse.json({
      id: booking.id,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        customer: `${booking.firstName} ${booking.lastName}`,
        equipment: booking.product ? `${booking.product.type}${booking.product.size ? ` (${booking.product.size})` : ''}` : '—',
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        status: booking.status,
      },
    })
  } catch (error) {
    console.error('Failed to create booking', error)
    return NextResponse.json({ message: 'Failed to create booking' }, { status: 500 })
  }
}

