import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.lessonPricing.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Lesson pricing deleted successfully' })
  } catch (error) {
    console.error('Failed to delete lesson pricing', error)
    return NextResponse.json({ message: 'Failed to delete lesson pricing' }, { status: 500 })
  }
}

