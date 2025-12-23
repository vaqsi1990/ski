import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: {
      createdAt?: { gte?: Date; lte?: Date }
    } = {}

    if (startDate) {
      dateFilter.createdAt = { gte: new Date(startDate) }
    }
    if (endDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        lte: new Date(endDate),
      }
    }

    const [
      totalRevenue,
      confirmedRevenue,
      totalBookings,
      bookingsByStatus,
      bookingsByMonth,
      topProducts,
    ] = await Promise.all([
      // Total revenue (all confirmed and completed bookings)
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          ...dateFilter,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
        },
      }),

      // Confirmed bookings revenue
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          ...dateFilter,
          status: BookingStatus.CONFIRMED,
        },
      }),

      // Total bookings count
      prisma.booking.count({
        where: dateFilter,
      }),

      // Bookings by status
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
        where: dateFilter,
      }),

      // Bookings by month (last 12 months) - simplified approach
      (async () => {
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
        
        const whereClause: {
          createdAt?: { gte?: Date; lte?: Date }
        } = {
          createdAt: {
            gte: startDate ? new Date(startDate) : twelveMonthsAgo,
          },
        }
        
        if (endDate) {
          whereClause.createdAt = {
            ...whereClause.createdAt,
            lte: new Date(endDate),
          }
        }
        
        const bookings = await prisma.booking.findMany({
          where: whereClause,
          select: { createdAt: true },
        })
        
        // Group by month
        const monthMap = new Map<string, number>()
        bookings.forEach((booking) => {
          const month = booking.createdAt.toISOString().substring(0, 7) // YYYY-MM
          monthMap.set(month, (monthMap.get(month) || 0) + 1)
        })
        
        return Array.from(monthMap.entries())
          .map(([month, count]) => ({ month, count: BigInt(count) }))
          .sort((a, b) => b.month.localeCompare(a.month))
          .slice(0, 12)
      })(),

      // Top products by bookings
      prisma.product.findMany({
        take: 10,
        include: {
          _count: {
            select: { bookingProducts: true },
          },
        },
        orderBy: {
          bookingProducts: {
            _count: 'desc',
          },
        },
      }),
    ])

    return NextResponse.json({
      revenue: {
        total: totalRevenue._sum.totalPrice ?? 0,
        confirmed: confirmedRevenue._sum.totalPrice ?? 0,
      },
      bookings: {
        total: totalBookings,
        byStatus: bookingsByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        byMonth: bookingsByMonth.map((item) => ({
          month: item.month,
          count: Number(item.count),
        })),
      },
      topProducts: topProducts.map((product) => ({
        id: product.id,
        type: product.type,
        price: product.price,
        size: product.size,
        bookingsCount: product._count.bookingProducts,
      })),
    })
  } catch (error) {
    console.error('Failed to load reports', error)
    return NextResponse.json({ message: 'Failed to load reports' }, { status: 500 })
  }
}

