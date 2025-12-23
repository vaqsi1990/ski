import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'
import type { Prisma } from '@/app/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [totalBookings, activeRentals, revenue, totalProducts, recentBookings] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      }),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
        },
      }),
      prisma.product.count(),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { product: true },
      }),
    ])

    const bookings = recentBookings.map((booking: Prisma.BookingGetPayload<{ include: { product: true } }>) => ({
      id: booking.id,
      customer: `${booking.firstName} ${booking.lastName}`,
      equipment: booking.product?.title ?? '—',
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
    }))

    return NextResponse.json({
      stats: {
        totalBookings,
        activeRentals,
        totalRevenue: revenue._sum.totalPrice ?? 0,
        totalProducts,
      },
      bookings,
    })
  } catch (error) {
    console.error('Failed to load admin overview', error)
    return NextResponse.json({ message: 'Failed to load admin overview' }, { status: 500 })
  }
}

