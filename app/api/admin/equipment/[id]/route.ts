import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ProductType } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: product.id,
      type: product.type,
      images: product.images,
      title: product.title,
      price: product.price,
      bookingsCount: product._count.bookings,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
  } catch (error) {
    console.error('Failed to load product', error)
    return NextResponse.json({ message: 'Failed to load product' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: {
      type?: ProductType
      images?: string[]
      title?: string
      price?: number
    } = {}

    if (body.type && Object.values(ProductType).includes(body.type)) {
      updateData.type = body.type as ProductType
    }
    if (body.images !== undefined) {
      updateData.images = Array.isArray(body.images) ? body.images : [body.images]
    }
    if (body.title) updateData.title = body.title
    if (body.price !== undefined) updateData.price = parseFloat(body.price)

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    return NextResponse.json({
      id: product.id,
      type: product.type,
      images: product.images,
      title: product.title,
      price: product.price,
      bookingsCount: product._count.bookings,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
  } catch (error) {
    console.error('Failed to update product', error)
    return NextResponse.json({ message: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Failed to delete product', error)
    return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 })
  }
}

