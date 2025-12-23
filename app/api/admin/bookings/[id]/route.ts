import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: booking.id,
      customer: `${booking.firstName} ${booking.lastName}`,
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phoneNumber: booking.phoneNumber,
      personalId: booking.personalId,
      equipment: booking.product?.title ?? '—',
      productId: booking.productId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    })
  } catch (error) {
    console.error('Failed to load booking', error)
    return NextResponse.json({ message: 'Failed to load booking' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: {
      status?: BookingStatus
      firstName?: string
      lastName?: string
      email?: string
      phoneNumber?: string
      startDate?: Date
      endDate?: Date
      totalPrice?: number
    } = {}

    if (body.status && Object.values(BookingStatus).includes(body.status)) {
      updateData.status = body.status as BookingStatus
    }
    if (body.firstName) updateData.firstName = body.firstName
    if (body.lastName) updateData.lastName = body.lastName
    if (body.email) updateData.email = body.email
    if (body.phoneNumber) updateData.phoneNumber = body.phoneNumber
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate) updateData.endDate = new Date(body.endDate)
    if (body.totalPrice !== undefined) updateData.totalPrice = parseFloat(body.totalPrice)

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { product: true },
    })

    return NextResponse.json({
      id: booking.id,
      customer: `${booking.firstName} ${booking.lastName}`,
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phoneNumber: booking.phoneNumber,
      personalId: booking.personalId,
      equipment: booking.product?.title ?? '—',
      productId: booking.productId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    })
  } catch (error) {
    console.error('Failed to update booking', error)
    return NextResponse.json({ message: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.booking.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Failed to delete booking', error)
    return NextResponse.json({ message: 'Failed to delete booking' }, { status: 500 })
  }
}

