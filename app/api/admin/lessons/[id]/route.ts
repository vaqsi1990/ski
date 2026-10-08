import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LessonStatus } from '@/app/generated/prisma/enums'
import { lessonRecipientsFromJson, sendLessonBookingEmail } from '@/lib/booking-email'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: {
      status?: LessonStatus
      teacher?: { connect: { id: string } } | { disconnect: true }
    } = {}

    if (body.status && Object.values(LessonStatus).includes(body.status)) {
      updateData.status = body.status as LessonStatus
    }

    if (body.teacherId !== undefined) {
      if (body.teacherId === null || body.teacherId === '') {
        updateData.teacher = { disconnect: true }
      } else {
        const teacher = await prisma.teacher.findUnique({ where: { id: body.teacherId } })
        if (!teacher) {
          return NextResponse.json({ message: 'Invalid teacher' }, { status: 400 })
        }
        updateData.teacher = { connect: { id: body.teacherId } }
      }
    }

    const existing = await prisma.lesson.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Lesson not found' }, { status: 404 })
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
      include: { teacher: true },
    })

    if (existing.status !== LessonStatus.CONFIRMED && lesson.status === LessonStatus.CONFIRMED) {
      await sendLessonBookingEmail({
        locale: lesson.locale,
        bookingId: lesson.id,
        status: lesson.status,
        recipients: lessonRecipientsFromJson(lesson.participants, {
          firstName: lesson.firstName,
          lastName: lesson.lastName,
          email: lesson.email,
          phoneNumber: lesson.phoneNumber,
        }),
        lessonType: lesson.lessonType,
        level: lesson.level,
        language: lesson.language,
        date: lesson.date,
        startTime: lesson.startTime,
        duration: lesson.duration,
        numberOfPeople: lesson.numberOfPeople,
        totalPrice: lesson.totalPrice,
        teacherName: lesson.teacher ? `${lesson.teacher.firstname} ${lesson.teacher.lastname}` : null,
      })
    }

    return NextResponse.json({
      id: lesson.id,
      status: lesson.status,
      teacherId: lesson.teacherId,
      teacher: lesson.teacher ? { id: lesson.teacher.id, firstname: lesson.teacher.firstname, lastname: lesson.teacher.lastname } : null,
      message: 'Lesson updated successfully',
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

