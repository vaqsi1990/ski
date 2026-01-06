import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'
import type { Prisma } from '@/app/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [totalBookings, activeRentals, revenue, totalProducts, recentBookings, totalLessons, activeLessons, lessonsRevenue, recentLessons] = await Promise.all([
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
        take: 5,
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.lesson.count(),
      prisma.lesson.count({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      }),
      prisma.lesson.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      }),
      prisma.lesson.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    const bookings = recentBookings.map((booking) => {
      const equipmentList = booking.products
        .map((bp) => `${bp.product.type.replace(/_/g, ' ')}${bp.product.size ? ` (${bp.product.size})` : ''}`)
        .join(', ')
      return {
        id: booking.id,
        type: 'booking',
        customer: `${booking.firstName} ${booking.lastName}`,
        phoneNumber: booking.phoneNumber,
        equipment: equipmentList || '—',
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt,
      }
    })

    const lessons = recentLessons.map((lesson) => {
      const lessonTypeLabel = lesson.lessonType === 'SKI' ? 'Ski' : 'Snowboard'
      const levelLabel = lesson.level === 'BEGINNER' ? 'Beginner' : lesson.level === 'INTERMEDIATE' ? 'Intermediate' : 'Expert'
      return {
        id: lesson.id,
        type: 'lesson',
        customer: `${lesson.firstName} ${lesson.lastName}`,
        phoneNumber: lesson.phoneNumber,
        equipment: `${lessonTypeLabel} Lesson (${levelLabel}, ${lesson.numberOfPeople} ${lesson.numberOfPeople === 1 ? 'person' : 'people'})`,
        startDate: lesson.date,
        endDate: lesson.date,
        status: lesson.status,
        totalPrice: lesson.totalPrice,
        createdAt: lesson.createdAt,
      }
    })

    // Combine and sort by createdAt (most recent first)
    const allBookings = [...bookings, ...lessons].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    }).slice(0, 8)

    return NextResponse.json({
      stats: {
        totalBookings: totalBookings + totalLessons,
        activeRentals: activeRentals + activeLessons,
        totalRevenue: (revenue._sum.totalPrice ?? 0) + (lessonsRevenue._sum.totalPrice ?? 0),
        totalProducts,
      },
      bookings: allBookings,
    })
  } catch (error) {
    console.error('Failed to load admin overview', error)
    return NextResponse.json({ message: 'Failed to load admin overview' }, { status: 500 })
  }
}

