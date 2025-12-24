import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ProductType, ProductSize } from '@/app/generated/prisma/enums'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookingProducts: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: product.id,
      type: product.type,
      price: product.price,
      size: product.size,
      standard: product.standard,
      professional: product.professional,
      description: product.description,
      bookingsCount: product._count.bookingProducts,
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
      price?: number
      size?: ProductSize | null
      standard?: boolean
      professional?: boolean
      description?: string | null
    } = {}

    if (body.type && Object.values(ProductType).includes(body.type)) {
      updateData.type = body.type as ProductType
    }
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    
    const sizeRequiringTypes: ProductType[] = [ProductType.ADULT_CLOTH]
    if (body.size !== undefined) {
      const productType = (body.type || updateData.type) as ProductType
      const shouldHaveSize = productType && sizeRequiringTypes.includes(productType)
      if (shouldHaveSize && body.size && Object.values(ProductSize).includes(body.size)) {
        updateData.size = body.size as ProductSize
      } else {
        updateData.size = null
      }
    }
    
    if (body.standard !== undefined) updateData.standard = body.standard === true
    if (body.professional !== undefined) updateData.professional = body.professional === true
    if (body.description !== undefined) updateData.description = body.description || null

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { bookingProducts: true },
        },
      },
    })

    return NextResponse.json({
      id: product.id,
      type: product.type,
      price: product.price,
      size: product.size,
      standard: product.standard,
      professional: product.professional,
      description: product.description,
      bookingsCount: product._count.bookingProducts,
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

