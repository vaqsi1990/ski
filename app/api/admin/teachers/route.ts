import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: [{ firstname: 'asc' }, { lastname: 'asc' }],
      include: {
        _count: { select: { lessons: true } },
      },
    })
    return NextResponse.json({
      teachers: teachers.map((t) => ({
        id: t.id,
        firstname: t.firstname,
        lastname: t.lastname,
        lessonsCount: t._count.lessons,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch teachers', error)
    return NextResponse.json({ message: 'Failed to fetch teachers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstname, lastname } = body

    if (!firstname?.trim() || !lastname?.trim()) {
      return NextResponse.json({ message: 'First name and last name are required' }, { status: 400 })
    }

    const teacher = await prisma.teacher.create({
      data: {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
      },
    })

    return NextResponse.json({
      id: teacher.id,
      firstname: teacher.firstname,
      lastname: teacher.lastname,
      createdAt: teacher.createdAt.toISOString(),
      updatedAt: teacher.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to create teacher', error)
    return NextResponse.json({ message: 'Failed to create teacher' }, { status: 500 })
  }
}
