import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

const MAX_DAYS_RANGE = 93

function getDayBounds(year: number, month: number, day: number) {
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
  return { start, end }
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (dateFrom && dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      const from = new Date(dateFrom + 'T00:00:00.000Z')
      const to = new Date(dateTo + 'T23:59:59.999Z')
      if (from.getTime() > to.getTime()) {
        return NextResponse.json({ message: 'dateFrom must be before dateTo' }, { status: 400 })
      }
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1
      if (daysDiff > MAX_DAYS_RANGE) {
        return NextResponse.json({ message: `Date range must not exceed ${MAX_DAYS_RANGE} days` }, { status: 400 })
      }
      const dates: Record<string, number> = {}
      const current = new Date(from)
      while (current <= to) {
        const y = current.getUTCFullYear()
        const m = current.getUTCMonth() + 1
        const d = current.getUTCDate()
        const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const { start, end } = getDayBounds(y, m, d)
        const [bookingCount, lessonSum] = await Promise.all([
          prisma.booking.count({
            where: {
              status: { not: BookingStatus.CANCELLED },
              startDate: { lte: end },
              endDate: { gte: start },
            },
          }),
          prisma.lesson.aggregate({
            _sum: { numberOfPeople: true },
            where: {
              status: { not: 'CANCELLED' },
              date: { gte: start, lte: end },
            },
          }),
        ])
        dates[dateKey] = bookingCount + (lessonSum._sum.numberOfPeople ?? 0)
        current.setUTCDate(current.getUTCDate() + 1)
      }
      return NextResponse.json({ dateFrom, dateTo, dates })
    }

    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10)
    if (month < 1 || month > 12 || !Number.isFinite(year)) {
      return NextResponse.json({ message: 'Invalid year or month' }, { status: 400 })
    }

    const days = daysInMonth(year, month)
    const dates: Record<string, number> = {}

    for (let day = 1; day <= days; day++) {
      const { start, end } = getDayBounds(year, month, day)
      const [bookingCount, lessonSum] = await Promise.all([
        prisma.booking.count({
          where: {
            status: { not: BookingStatus.CANCELLED },
            startDate: { lte: end },
            endDate: { gte: start },
          },
        }),
        prisma.lesson.aggregate({
          _sum: { numberOfPeople: true },
          where: {
            status: { not: 'CANCELLED' },
            date: { gte: start, lte: end },
          },
        }),
      ])
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      dates[dateKey] = bookingCount + (lessonSum._sum.numberOfPeople ?? 0)
    }

    return NextResponse.json({ year, month, dates })
  } catch (error) {
    console.error('Failed to load guests calendar', error)
    return NextResponse.json({ message: 'Failed to load guests calendar' }, { status: 500 })
  }
}
