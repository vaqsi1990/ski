'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { ProductType } from '@/app/generated/prisma/enums'
import Equipment from '@/components/Equipment'
import Prices from '@/components/Prices'

type Product = {
  id: string
  type: string
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
      case ProductType.SKI_BOOTS:
        return t('items.skiBoots.name')
      case ProductType.SNOWBOARD_BOOTS:
        return t('items.snowboardBoots.name')
      case ProductType.ADULT_CLOTH:
        return t('items.adultCloth.name')
      case ProductType.CHILD_CLOTH:
        return t('items.childCloth.name')
      case ProductType.ADULT_SKI_SET:
        return t('items.adultSkiSet.name')
      case ProductType.CHILD_SKI_SET:
        return t('items.childSkiSet.name')
      case ProductType.CHILD_SNOWBOARD_SET:
        return t('items.childSnowboardSet.name')
      case ProductType.ADULT_SNOWBOARD_SET:
        return t('items.adultSnowboardSet.name')
      case ProductType.ACCESSORY:
        return t('items.accessories.name')
      default:
        return productType
    }
  }

  const getPageTitle = () => {
    if (type === ProductType.SKI) return t('items.skis.name')
    if (type === ProductType.SNOWBOARD) return t('items.snowboards.name')
    if (type === ProductType.SKI_BOOTS) return t('items.skiBoots.name')
    if (type === ProductType.SNOWBOARD_BOOTS) return t('items.snowboardBoots.name')
    if (type === ProductType.ADULT_CLOTH) return t('items.adultCloth.name')
    if (type === ProductType.CHILD_CLOTH) return t('items.childCloth.name')
    if (type === ProductType.ADULT_SKI_SET) return t('items.adultSkiSet.name')
    if (type === ProductType.CHILD_SKI_SET) return t('items.childSkiSet.name')
    if (type === ProductType.CHILD_SNOWBOARD_SET) return t('items.childSnowboardSet.name')
    if (type === ProductType.ADULT_SNOWBOARD_SET) return t('items.adultSnowboardSet.name')
    if (type === ProductType.ACCESSORY) return t('items.accessories.name')
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
    <div className="min-h-screen bg-[#FFFAFA]">
      {/* Show Equipment component when no specific type is selected */}
      {!type && <Equipment />}
      
      {/* Show Prices component when no specific type is selected */}
      {!type && <Prices />}
      
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title - only show when type is selected */}
          {type && (
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
            >
              {getPageTitle()}
            </motion.h1>
          )}

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

          {/* Products Grid - only show when type is selected */}
          {type && !loading && !error && (
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
                      {/* Product Card Content */}
                      <div className="relative h-80 md:h-96 w-full bg-gradient-to-br from-gray-100 to-gray-200 group p-6 flex flex-col justify-between">
                        {/* Type Badge */}
                        <div>
                          <span className="inline-block px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                            {getTypeLabel(product.type)}
                          </span>
                          {(product.type === ProductType.ADULT_CLOTH || product.type === ProductType.CHILD_CLOTH || product.type === ProductType.ACCESSORY) && product.size && (
                            <div className="mt-2">
                              <span className="inline-block px-3 py-1 bg-white/80 text-gray-800 rounded-full text-[14px] font-semibold border border-gray-300">
                                {t('size')}: {product.size}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Price and Booking Button */}
                        <div className="flex flex-col items-start">
                          <p className="text-2xl font-bold text-orange-500 mb-4">
                            {formatCurrency(product.price)}
                          </p>
                          <Link
                            href={`/booking?productId=${product.id}`}
                            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            {t('book')}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}

          {/* Loading State - only show when type is selected */}
          {type && loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-black text-[16px]">{t('loading')}</p>
            </div>
          )}

          {/* Error State - only show when type is selected */}
          {type && error && (
            <div className="text-center py-20">
              <p className="text-red-600 text-[16px]">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItemsPage
