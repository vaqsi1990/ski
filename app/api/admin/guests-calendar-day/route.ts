import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

function getDayBounds(year: number, month: number, day: number) {
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
  return { start, end }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ message: 'Invalid or missing date (expected YYYY-MM-DD)' }, { status: 400 })
    }

    const [yearStr, monthStr, dayStr] = date.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return NextResponse.json({ message: 'Invalid date' }, { status: 400 })
    }

    const { start, end } = getDayBounds(year, month, day)

    const [bookings, lessons] = await Promise.all([
      prisma.booking.findMany({
        where: {
          status: { not: BookingStatus.CANCELLED },
          startDate: { lte: end },
          endDate: { gte: start },
        },
        orderBy: { startDate: 'asc' },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.lesson.findMany({
        where: {
          status: { not: 'CANCELLED' },
          date: { gte: start, lte: end },
        },
        orderBy: { startTime: 'asc' },
        include: { teacher: true },
      }),
    ])

    const bookingItems = bookings.map((booking) => {
      const equipmentList = booking.products
        .map((bp) => `${bp.product.type.replace(/_/g, ' ')}${bp.product.size ? ` (${bp.product.size})` : ''}`)
        .join(', ')

      return {
        id: booking.id,
        type: 'booking' as const,
        customer: `${booking.firstName} ${booking.lastName}`,
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phoneNumber: booking.phoneNumber,
        personalId: booking.personalId,
        numberOfPeople: booking.numberOfPeople ? parseInt(booking.numberOfPeople, 10) || null : null,
        equipment: equipmentList || '—',
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      }
    })

    const lessonItems = lessons.map((lesson) => {
      const lessonTypeLabel = lesson.lessonType === 'SKI' ? 'Ski' : 'Snowboard'
      const levelLabel =
        lesson.level === 'BEGINNER' ? 'Beginner' : lesson.level === 'INTERMEDIATE' ? 'Intermediate' : 'Expert'
      const teacherName = lesson.teacher ? `${lesson.teacher.firstname} ${lesson.teacher.lastname}` : null

      return {
        id: lesson.id,
        type: 'lesson' as const,
        customer: `${lesson.firstName} ${lesson.lastName}`,
        firstName: lesson.firstName,
        lastName: lesson.lastName,
        email: lesson.email,
        phoneNumber: lesson.phoneNumber,
        personalId: lesson.personalId,
        numberOfPeople: lesson.numberOfPeople,
        duration: lesson.duration,
        lessonType: lesson.lessonType,
        level: lesson.level,
        language: lesson.language,
        teacherId: lesson.teacherId,
        teacherName,
        description: `${lessonTypeLabel} (${levelLabel}, ${lesson.numberOfPeople} ${
          lesson.numberOfPeople === 1 ? 'person' : 'people'
        }, ${lesson.duration}h)`,
        date: lesson.date,
        startTime: lesson.startTime,
        status: lesson.status,
        totalPrice: lesson.totalPrice,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      }
    })

    const totalBookingGuests = bookingItems.reduce((sum, b) => sum + (b.numberOfPeople || 0), 0)
    const totalLessonGuests = lessonItems.reduce((sum, l) => sum + (l.numberOfPeople || 0), 0)

    return NextResponse.json({
      date,
      summary: {
        totalGuests: totalBookingGuests + totalLessonGuests,
        bookingGuests: totalBookingGuests,
        lessonGuests: totalLessonGuests,
        bookingsCount: bookingItems.length,
        lessonsCount: lessonItems.length,
      },
      bookings: bookingItems,
      lessons: lessonItems,
    })
  } catch (error) {
    console.error('Failed to load guests calendar day details', error)
    return NextResponse.json({ message: 'Failed to load guests calendar day details' }, { status: 500 })
  }
}

