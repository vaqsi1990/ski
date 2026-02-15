import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: [{ firstname: 'asc' }, { lastname: 'asc' }],
    })
    return NextResponse.json({
      teachers: teachers.map((t) => ({
        id: t.id,
        firstname: t.firstname,
        lastname: t.lastname,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch teachers', error)
    return NextResponse.json({ message: 'Failed to fetch teachers' }, { status: 500 })
  }
}
