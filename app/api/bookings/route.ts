import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      productIds, // Changed from productId to productIds (array)
      firstName,
      lastName,
      phoneNumber,
      email,
      personalId,
      numberOfPeople,
      startDate,
      endDate,
      startTime,
      duration,
      totalPrice,
    } = body

    // Support both old format (single productId) and new format (productIds array)
    const productIdArray = productIds || (body.productId ? [body.productId] : [])

    if (!productIdArray || productIdArray.length === 0 || !firstName || !lastName || !phoneNumber || !email || !startDate || !endDate || !totalPrice) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Default numberOfPeople to '1' if not provided
    const finalNumberOfPeople = numberOfPeople || '1'

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

    // Check if all products exist
    const products = await prisma.product.findMany({
      where: { id: { in: productIdArray } },
    })

    if (products.length !== productIdArray.length) {
      return NextResponse.json({ message: 'One or more products not found' }, { status: 404 })
    }

    // Create booking with multiple products
    const booking = await prisma.booking.create({
      data: {
        firstName,
        lastName,
        phoneNumber,
        email,
        personalId: personalId || '',
        numberOfPeople: finalNumberOfPeople || null,
        startDate: start,
        endDate: end,
        startTime: startTime || null,
        duration: duration ? parseInt(duration) : null,
        totalPrice: parseFloat(totalPrice),
        status: BookingStatus.PENDING,
        products: {
          create: productIdArray.map((productId: string) => ({
            productId,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    })

    const equipmentList = booking.products
      .map((bp) => `${bp.product.type}${bp.product.size ? ` (${bp.product.size})` : ''}`)
      .join(', ')

    return NextResponse.json({
      id: booking.id,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        customer: `${booking.firstName} ${booking.lastName}`,
        equipment: equipmentList || '—',
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

