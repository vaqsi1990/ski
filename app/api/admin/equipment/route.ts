import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ProductType } from '@/app/generated/prisma/enums'
import type { Prisma } from '@/app/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {}
    if (type && Object.values(ProductType).includes(type as ProductType)) {
      where.type = type as ProductType
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    const formattedProducts = products.map((product) => ({
      id: product.id,
      type: product.type,
      images: product.images,
      title: product.title,
      price: product.price,
      size: product.size,
      bookingsCount: product._count.bookings,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to load equipment', error)
    return NextResponse.json({ message: 'Failed to load equipment' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, images, title, price, size } = body

    if (!type || !title || price === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (!Object.values(ProductType).includes(type)) {
      return NextResponse.json({ message: 'Invalid product type' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        type: type as ProductType,
        images: Array.isArray(images) ? images : images ? [images] : [],
        title,
        price: parseFloat(price),
        size: type === ProductType.OTHER && size ? size : null,
      },
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
      size: product.size,
      bookingsCount: product._count.bookings,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
  } catch (error) {
    console.error('Failed to create equipment', error)
    return NextResponse.json({ message: 'Failed to create equipment' }, { status: 500 })
  }
}

