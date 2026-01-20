import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      lessons: lessons.map((lesson) => {
        // Format lesson.date as a plain calendar date using UTC components.
        // The Prisma field is @db.Date (no time); when Prisma reads it, it creates a Date object
        // that represents midnight in the server's local timezone. To avoid timezone shifts,
        // we use UTC methods to extract the date components, ensuring the calendar date is preserved.
        const year = lesson.date.getUTCFullYear()
        const month = String(lesson.date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(lesson.date.getUTCDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`

        return {
          id: lesson.id,
          customer: `${lesson.firstName} ${lesson.lastName}`,
          firstName: lesson.firstName,
          lastName: lesson.lastName,
          email: lesson.email,
          phoneNumber: lesson.phoneNumber,
          personalId: lesson.personalId,
          numberOfPeople: lesson.numberOfPeople,
          duration: lesson.duration,
          level: lesson.level,
          lessonType: lesson.lessonType,
          date: dateString,
          startTime: lesson.startTime,
          language: lesson.language,
          status: lesson.status,
          totalPrice: lesson.totalPrice,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        }
      }),
    })
  } catch (error) {
    console.error('Failed to fetch lessons', error)
    return NextResponse.json({ message: 'Failed to fetch lessons' }, { status: 500 })
  }
}
