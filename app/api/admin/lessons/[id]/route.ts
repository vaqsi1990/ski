import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LessonStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: {
      status?: LessonStatus
    } = {}

    if (body.status && Object.values(LessonStatus).includes(body.status)) {
      updateData.status = body.status as LessonStatus
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      id: lesson.id,
      status: lesson.status,
      message: 'Lesson status updated successfully',
    })
  } catch (error) {
    console.error('Failed to update lesson', error)
    return NextResponse.json({ message: 'Failed to update lesson' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.lesson.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Failed to delete lesson', error)
    return NextResponse.json({ message: 'Failed to delete lesson' }, { status: 500 })
  }
}

