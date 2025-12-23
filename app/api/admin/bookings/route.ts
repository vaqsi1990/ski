import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'
import type { Prisma } from '@/app/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Prisma.BookingWhereInput = {}
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ])

    const formattedBookings = bookings.map((booking) => {
      const equipmentList = booking.products
        .map((bp) => `${bp.product.type}${bp.product.size ? ` (${bp.product.size})` : ''}`)
        .join(', ')
      return {
        id: booking.id,
        customer: `${booking.firstName} ${booking.lastName}`,
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phoneNumber: booking.phoneNumber,
        personalId: booking.personalId,
        equipment: equipmentList || '—',
        productIds: booking.products.map((bp) => bp.productId),
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      }
    })

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to load bookings', error)
    return NextResponse.json({ message: 'Failed to load bookings' }, { status: 500 })
  }
}

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
      startDate,
      endDate,
      totalPrice,
      status = BookingStatus.PENDING,
    } = body

    // Support both old format (single productId) and new format (productIds array)
    const productIdArray = productIds || (body.productId ? [body.productId] : [])

    if (!productIdArray || productIdArray.length === 0 || !firstName || !lastName || !phoneNumber || !email || !startDate || !endDate || !totalPrice) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const booking = await prisma.booking.create({
      data: {
        firstName,
        lastName,
        phoneNumber,
        email,
        personalId: personalId || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: parseFloat(totalPrice),
        status: status as BookingStatus,
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
      customer: `${booking.firstName} ${booking.lastName}`,
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phoneNumber: booking.phoneNumber,
      personalId: booking.personalId,
      equipment: equipmentList || '—',
      productIds: booking.products.map((bp) => bp.productId),
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    })
  } catch (error) {
    console.error('Failed to create booking', error)
    return NextResponse.json({ message: 'Failed to create booking' }, { status: 500 })
  }
}

