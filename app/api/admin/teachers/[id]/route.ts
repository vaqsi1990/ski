import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { firstname, lastname } = body

    const updateData: { firstname?: string; lastname?: string } = {}
    if (firstname !== undefined) updateData.firstname = String(firstname).trim()
    if (lastname !== undefined) updateData.lastname = String(lastname).trim()

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      id: teacher.id,
      firstname: teacher.firstname,
      lastname: teacher.lastname,
      updatedAt: teacher.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to update teacher', error)
    return NextResponse.json({ message: 'Failed to update teacher' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.teacher.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    console.error('Failed to delete teacher', error)
    return NextResponse.json({ message: 'Failed to delete teacher' }, { status: 500 })
  }
}
