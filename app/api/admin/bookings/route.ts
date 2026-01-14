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

    const lessonWhere: any = {}
    if (status) {
      lessonWhere.status = status
    }

    const [bookings, totalBookings, lessons, totalLessons] = await Promise.all([
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
      prisma.lesson.findMany({
        where: lessonWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lesson.count({ where: lessonWhere }),
    ])

    const formattedBookings = bookings.map((booking) => {
      const equipmentList = booking.products
        .map((bp) => `${bp.product.type.replace(/_/g, ' ')}${bp.product.size ? ` (${bp.product.size})` : ''}`)
        .join(', ')
      return {
        id: booking.id,
        type: 'booking',
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

    const formattedLessons = lessons.map((lesson) => {
      const lessonTypeLabel = lesson.lessonType === 'SKI' ? 'Ski' : 'Snowboard'
      const levelLabel = lesson.level === 'BEGINNER' ? 'Beginner' : lesson.level === 'INTERMEDIATE' ? 'Intermediate' : 'Expert'
      return {
        id: lesson.id,
        type: 'lesson',
        customer: `${lesson.firstName} ${lesson.lastName}`,
        firstName: lesson.firstName,
        lastName: lesson.lastName,
        email: lesson.email,
        phoneNumber: lesson.phoneNumber,
        personalId: lesson.personalId,
        equipment: `${lessonTypeLabel} Lesson (${levelLabel}, ${lesson.numberOfPeople} ${lesson.numberOfPeople === 1 ? 'person' : 'people'}, ${lesson.duration}h)`,
        productIds: [],
        startDate: lesson.date,
        endDate: lesson.date,
        status: lesson.status,
        totalPrice: lesson.totalPrice,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      }
    })

    // Combine and sort by createdAt (most recent first)
    const allBookings = [...formattedBookings, ...formattedLessons].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      bookings: allBookings,
      pagination: {
        total: totalBookings + totalLessons,
        page,
        limit,
        totalPages: Math.ceil((totalBookings + totalLessons) / limit),
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

    if (!productIdArray || productIdArray.length === 0 || !firstName || !lastName || !phoneNumber || !email || !personalId || !startDate || !endDate || !totalPrice) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const booking = await prisma.booking.create({
      data: {
        firstName,
        lastName,
        phoneNumber,
        email,
        personalId,
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
      .map((bp) => `${bp.product.type.replace(/_/g, ' ')}${bp.product.size ? ` (${bp.product.size})` : ''}`)
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

