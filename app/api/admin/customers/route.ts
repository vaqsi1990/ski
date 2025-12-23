import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get unique customers from bookings
    const bookings = await prisma.booking.findMany({
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        personalId: true,
      },
      distinct: ['email'],
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Get total count of unique customers
    const allBookings = await prisma.booking.findMany({
      select: { email: true },
      distinct: ['email'],
    })
    const total = allBookings.length

    // Get booking counts for each customer
    const customersWithStats = await Promise.all(
      bookings.map(async (booking) => {
        const customerBookings = await prisma.booking.findMany({
          where: { email: booking.email },
          select: {
            id: true,
            status: true,
            totalPrice: true,
            createdAt: true,
          },
        })

        const totalSpent = customerBookings.reduce((sum, b) => sum + b.totalPrice, 0)
        const bookingsCount = customerBookings.length

        return {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phoneNumber: booking.phoneNumber,
          personalId: booking.personalId,
          bookingsCount,
          totalSpent,
          lastBooking: customerBookings[0]?.createdAt || null,
        }
      }),
    )

    return NextResponse.json({
      customers: customersWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to load customers', error)
    return NextResponse.json({ message: 'Failed to load customers' }, { status: 500 })
  }
}

