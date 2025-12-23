import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LessonStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

// Pricing matrix based on numberOfPeople and duration
const PRICING: Record<number, Record<number, number>> = {
  1: { 1: 120, 2: 200, 3: 270 },
  2: { 1: 200, 2: 360, 3: 480 },
  3: { 1: 270, 2: 480, 3: 720 },
  4: { 1: 400, 2: 640, 3: 960 },
}

export function GET() {
  return NextResponse.json({ pricing: PRICING })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      numberOfPeople,
      duration,
      level,
      date,
      startTime,
      language,
      firstName,
      lastName,
      phoneNumber,
      email,
      personalId,
    } = body

    // Validate required fields
    if (!numberOfPeople || !duration || !level || !date || !startTime || !language || 
        !firstName || !lastName || !phoneNumber || !email || !personalId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Validate numberOfPeople (1-4)
    const people = parseInt(numberOfPeople)
    if (people < 1 || people > 4) {
      return NextResponse.json({ message: 'Number of people must be between 1 and 4' }, { status: 400 })
    }

    // Validate duration (1, 2, or 3 hours)
    const hours = parseInt(duration)
    if (![1, 2, 3].includes(hours)) {
      return NextResponse.json({ message: 'Duration must be 1, 2, or 3 hours' }, { status: 400 })
    }

    // Validate time (10:00 to 16:00)
    const [hour] = startTime.split(':').map(Number)
    if (hour < 10 || hour >= 16) {
      return NextResponse.json({ message: 'Start time must be between 10:00 and 16:00' }, { status: 400 })
    }

    // Calculate price
    const price = PRICING[people]?.[hours]
    if (!price) {
      return NextResponse.json({ message: 'Invalid pricing combination' }, { status: 400 })
    }

    // Validate date
    const lessonDate = new Date(date)
    if (isNaN(lessonDate.getTime())) {
      return NextResponse.json({ message: 'Invalid date' }, { status: 400 })
    }

    // Check if date is in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (lessonDate < today) {
      return NextResponse.json({ message: 'Date cannot be in the past' }, { status: 400 })
    }

    const lesson = await prisma.lesson.create({
      data: {
        numberOfPeople: people,
        duration: hours,
        level,
        date: lessonDate,
        startTime,
        language,
        firstName,
        lastName,
        phoneNumber,
        email,
        personalId,
        totalPrice: price,
        status: LessonStatus.PENDING,
      },
    })

    return NextResponse.json({
      id: lesson.id,
      message: 'Lesson booking created successfully',
      lesson: {
        id: lesson.id,
        customer: `${lesson.firstName} ${lesson.lastName}`,
        numberOfPeople: lesson.numberOfPeople,
        duration: lesson.duration,
        level: lesson.level,
        date: lesson.date,
        startTime: lesson.startTime,
        language: lesson.language,
        totalPrice: lesson.totalPrice,
        status: lesson.status,
      },
    })
  } catch (error) {
    console.error('Failed to create lesson booking', error)
    return NextResponse.json({ message: 'Failed to create lesson booking' }, { status: 500 })
  }
}

