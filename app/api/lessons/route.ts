import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LessonStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

// Get pricing from database
async function getPricing() {
  try {
    const pricing = await prisma.lessonPricing.findMany({
      orderBy: [
        { numberOfPeople: 'asc' },
        { duration: 'asc' },
      ],
    })

    // Convert to matrix format for easier use
    const pricingMatrix: Record<number, Record<number, number>> = {}
    pricing.forEach((p: { numberOfPeople: number; duration: number; price: number }) => {
      if (!pricingMatrix[p.numberOfPeople]) {
        pricingMatrix[p.numberOfPeople] = {}
      }
      pricingMatrix[p.numberOfPeople][p.duration] = p.price
    })

    // Fallback to default pricing if database is empty
    if (Object.keys(pricingMatrix).length === 0) {
      return {
        1: { 1: 120, 2: 200, 3: 270 },
        2: { 1: 200, 2: 360, 3: 480 },
        3: { 1: 270, 2: 480, 3: 720 },
        4: { 1: 400, 2: 640, 3: 960 },
      }
    }

    return pricingMatrix
  } catch (error) {
    console.error('Failed to fetch pricing from database, using defaults', error)
    // Fallback to default pricing
    return {
      1: { 1: 120, 2: 200, 3: 270 },
      2: { 1: 200, 2: 360, 3: 480 },
      3: { 1: 270, 2: 480, 3: 720 },
      4: { 1: 400, 2: 640, 3: 960 },
    }
  }
}

export async function GET() {
  const pricing = await getPricing()
  return NextResponse.json({ pricing })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      numberOfPeople,
      duration,
      level,
      lessonType,
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
    if (!numberOfPeople || !duration || !level || !lessonType || !date || !startTime || !language || 
        !firstName || !lastName || !phoneNumber || !email || !personalId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Validate lessonType
    if (!['SKI', 'SNOWBOARD'].includes(lessonType)) {
      return NextResponse.json({ message: 'Lesson type must be SKI or SNOWBOARD' }, { status: 400 })
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

    // Get pricing from database
    const PRICING = await getPricing()
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
        lessonType,
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
        lessonType: lesson.lessonType,
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

