import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch all bookings and lessons
    const [bookings, lessons] = await Promise.all([
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.lesson.findMany({
        orderBy: { createdAt: 'desc' },
        include: { teacher: true },
      }),
    ])

    // Format bookings data
    const formattedBookings = bookings.map((booking) => {
      const equipmentList = booking.products
        .map((bp) => `${bp.product.type.replace(/_/g, ' ')}${bp.product.size ? ` (${bp.product.size})` : ''}`)
        .join(', ')

      return {
        'First Name': booking.firstName,
        'Last Name': booking.lastName,
        'Email': booking.email,
        'Phone': booking.phoneNumber,
        'Personal ID': booking.personalId || '',
        'Equipment': equipmentList || '—',
        'Start Date': new Date(booking.startDate).toLocaleDateString(),
        'End Date': new Date(booking.endDate).toLocaleDateString(),
        'Total Price': booking.totalPrice,
      }
    })

    // Format lessons data
    const formattedLessons = lessons.map((lesson) => {
      const lessonTypeLabel = lesson.lessonType === 'SKI' ? 'Ski' : 'Snowboard'
      const levelLabel = lesson.level === 'BEGINNER' ? 'Beginner' : lesson.level === 'INTERMEDIATE' ? 'Intermediate' : 'Expert'
      const equipment = `${lessonTypeLabel} Lesson (${levelLabel}, ${lesson.numberOfPeople} ${lesson.numberOfPeople === 1 ? 'person' : 'people'}, ${lesson.duration}h)`
      const teacherName = lesson.teacher ? `${lesson.teacher.firstname} ${lesson.teacher.lastname}` : ''

      return {
        'First Name': lesson.firstName,
        'Last Name': lesson.lastName,
        'Email': lesson.email,
        'Phone': lesson.phoneNumber,
        'Personal ID': lesson.personalId || '',
        'Teacher': teacherName,
        'Equipment': equipment,
        'Start Date': new Date(lesson.date).toLocaleDateString(),
        'End Date': new Date(lesson.date).toLocaleDateString(),
        'Total Price': lesson.totalPrice,
      }
    })

    // Combine all data
    const allData = [...formattedBookings, ...formattedLessons]

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(allData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]
    const filename = `bookings_${date}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export bookings', error)
    return NextResponse.json({ message: 'Failed to export bookings' }, { status: 500 })
  }
}
