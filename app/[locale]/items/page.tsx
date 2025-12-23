'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { ProductType } from '@/app/generated/prisma/enums'

type Product = {
  id: string
  type: string
  images: string[]
  title: string
  price: number
  size?: string | null
  createdAt: string
  updatedAt: string
}

const ItemsPage = () => {
  const t = useTranslations('equipment')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = type ? `/api/products?type=${type}` : '/api/products'
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load products')
        const json = await response.json()
        setProducts(json.products || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [type])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale || 'ka-GE', { style: 'currency', currency: 'GEL' }).format(amount)

  const getTypeLabel = (productType: string) => {
    switch (productType) {
      case ProductType.SKI:
        return t('items.skis.name')
      case ProductType.SNOWBOARD:
        return t('items.snowboards.name')
      case ProductType.OTHER:
        return t('items.accessories.name')
      default:
        return productType
    }
  }

  const getPageTitle = () => {
    if (type === ProductType.SKI) return t('items.skis.name')
    if (type === ProductType.SNOWBOARD) return t('items.snowboards.name')
    if (type === ProductType.OTHER) return t('items.accessories.name')
    return t('title')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants = (index: number) => ({
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
  })

  return (
    <div className="min-h-screen bg-[#FFFAFA] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
        >
          {getPageTitle()}
        </motion.h1>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-black text-[16px]">{t('loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-600 text-[16px]">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-black text-[16px]">{t('empty')}</p>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    variants={cardVariants(index)}
                    whileHover={{ scale: 1.03, y: -5 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Product Image with Overlay */}
                    <div className="relative h-80 md:h-96 w-full bg-gray-100 group">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {/* Dark Overlay for better text readability */}
                          <motion.div
                            initial={{ opacity: 0.7 }}
                            whileHover={{ opacity: 0.85 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"
                          />
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Text Content Overlay */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="absolute inset-0 flex flex-col justify-end items-start text-left p-6"
                      >
                        {/* Type Badge */}
                        <div className="mb-3">
                          <span className="inline-block px-3 py-1 bg-orange-500/90 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                            {getTypeLabel(product.type)}
                          </span>
                        </div>
                        {/* Size Badge for OTHER products */}
                        {/* Product Title */}
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                          {product.title}
                        </h3>
                        {product.type === ProductType.OTHER && product.size && (
                          <div className="mb-3">
                            <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-[14px] font-semibold backdrop-blur-sm border border-white/30">
                              {t('size')}: {product.size}
                            </span>
                          </div>
                        )}
                        {/* Price */}
                        <p className="text-2xl font-bold text-orange-400 drop-shadow-md mb-4">
                          {formatCurrency(product.price)}
                        </p>
                        {/* Booking Button */}
                        <Link
                          href={`/?productId=${product.id}`}
                          className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          დაჯავშნა
                        </Link>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ItemsPage
