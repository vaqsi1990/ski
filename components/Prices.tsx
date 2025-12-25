'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'

interface PriceItem {
  item: string
  type: string
  includes: string
  price: string
  itemKey?: string
}

interface PriceListData {
  id: string
  itemKey: string
  type: string
  includes: string
  price: string
}

const Prices = () => {
  const t = useTranslations('prices')
  const locale = useLocale()
  const [prices, setPrices] = useState<PriceItem[]>([])
  const [loading, setLoading] = useState(true)

  // Default prices as fallback
  const getDefaultPrices = (): PriceItem[] => [
    {
      item: t('skiSetStandard'),
      type: t('standard'),
      includes: t('includesSkiBootsPoles'),
      price: '50 ₾',
      itemKey: 'skiSetStandard'
    },
    {
      item: t('skiSetProfessional'),
      type: t('professional'),
      includes: t('includesSkiBootsPoles'),
      price: '60-150 ₾',
      itemKey: 'skiSetProfessional'
    },
    {
      item: t('skiSetKidsStandard'),
      type: t('standard'),
      includes: t('includesSkiBootsPoles'),
      price: '40 ₾',
      itemKey: 'skiSetKidsStandard'
    },
    {
      item: t('skiStandard'),
      type: t('standard'),
      includes: t('includesSkiOnly'),
      price: '40 ₾',
      itemKey: 'skiStandard'
    },
    {
      item: t('skiProfessional'),
      type: t('professional'),
      includes: t('includesSkiOnly'),
      price: '70 ₾',
      itemKey: 'skiProfessional'
    },
    {
      item: t('skiBootsStandard'),
      type: t('standard'),
      includes: t('includesBootsOnly'),
      price: '30 ₾',
      itemKey: 'skiBootsStandard'
    },
    {
      item: t('snowboardSetStandard'),
      type: t('standard'),
      includes: t('includesBoardBoots'),
      price: '70 ₾',
      itemKey: 'snowboardSetStandard'
    },
    {
      item: t('snowboardSetKidsStandard'),
      type: t('standard'),
      includes: t('includesBoardBoots'),
      price: '60 ₾',
      itemKey: 'snowboardSetKidsStandard'
    },
    {
      item: t('snowboardSetProfessional'),
      type: t('professional'),
      includes: t('includesBoardBoots'),
      price: '80-150 ₾',
      itemKey: 'snowboardSetProfessional'
    },
    {
      item: t('boardStandard'),
      type: t('standard'),
      includes: t('includesBoardOnly'),
      price: '50 ₾',
      itemKey: 'boardStandard'
    },
    {
      item: t('boardProfessional'),
      type: t('professional'),
      includes: t('includesBoardOnly'),
      price: '70 ₾',
      itemKey: 'boardProfessional'
    },
    {
      item: t('snowboardBootsStandard'),
      type: t('standard'),
      includes: t('includesBootsOnly'),
      price: '40 ₾',
      itemKey: 'snowboardBootsStandard'
    },
    {
      item: t('gogglesStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾',
      itemKey: 'gogglesStandard'
    },
    {
      item: t('helmetStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾',
      itemKey: 'helmetStandard'
    },
    {
      item: t('polesStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾',
      itemKey: 'polesStandard'
    },
    {
      item: t('glovesStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾',
      itemKey: 'glovesStandard'
    },
    {
      item: t('jacket'),
      type: t('clothes'),
      includes: t('clothes'),
      price: '20 ₾',
      itemKey: 'jacket'
    },
    {
      item: t('pants'),
      type: t('clothes'),
      includes: t('clothes'),
      price: '20 ₾',
      itemKey: 'pants'
    },
    {
      item: t('sledge'),
      type: t('forSnow'),
      includes: t('forSnow'),
      price: '30 ₾',
      itemKey: 'sledge'
    },
    {
      item: t('instructor'),
      type: t('forOnePerson'),
      includes: t('forOnePerson'),
      price: '120 ₾',
      itemKey: 'instructor'
    }
  ]

  const defaultPrices = getDefaultPrices()

  // Map item keys to translation keys
  const itemKeyToTranslation: Record<string, string> = {
    skiSetStandard: 'skiSetStandard',
    skiSetProfessional: 'skiSetProfessional',
    skiSetKidsStandard: 'skiSetKidsStandard',
    skiStandard: 'skiStandard',
    skiProfessional: 'skiProfessional',
    skiBootsStandard: 'skiBootsStandard',
    snowboardSetStandard: 'snowboardSetStandard',
    snowboardSetKidsStandard: 'snowboardSetKidsStandard',
    snowboardSetProfessional: 'snowboardSetProfessional',
    boardStandard: 'boardStandard',
    boardProfessional: 'boardProfessional',
    snowboardBootsStandard: 'snowboardBootsStandard',
    gogglesStandard: 'gogglesStandard',
    helmetStandard: 'helmetStandard',
    polesStandard: 'polesStandard',
    glovesStandard: 'glovesStandard',
    jacket: 'jacket',
    pants: 'pants',
    sledge: 'sledge',
    instructor: 'instructor'
  }

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/prices', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const priceList: PriceListData[] = data.prices || []
          
          if (priceList.length > 0) {
            // Use prices from database
            const mappedPrices = priceList.map((p) => {
              const translationKey = itemKeyToTranslation[p.itemKey] || p.itemKey
              // Try to translate type and includes, fallback to original if translation doesn't exist
              let translatedType = p.type
              let translatedIncludes = p.includes
              try {
                translatedType = t(p.type) !== p.type ? t(p.type) : p.type
                translatedIncludes = t(p.includes) !== p.includes ? t(p.includes) : p.includes
              } catch {
                // Keep original if translation fails
              }
              return {
                item: t(translationKey),
                type: translatedType,
                includes: translatedIncludes,
                price: p.price,
                itemKey: p.itemKey
              }
            })
            setPrices(mappedPrices)
          } else {
            // Use default prices
            setPrices(getDefaultPrices())
          }
        } else {
          // Use default prices on error
          setPrices(getDefaultPrices())
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error)
        // Use default prices on error
        setPrices(getDefaultPrices())
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Use default prices while loading or if no prices fetched
  const priceData = prices.length > 0 ? prices : defaultPrices

  if (loading) {
    return (
      <div className="py-12 bg-[#FFFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#08964c]"></div>
            <p className="mt-4 text-[#08964c] text-lg">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 bg-[#FFFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#08964c] mb-4">
            {t('title')}
          </h2>
          <p className="text-gray-600 text-lg ">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold text-lg">
                    {t('item')}
                  </th>
                  <th className="px-6 py-4 text-left text-white font-semibold text-lg">
                    {t('type')}
                  </th>
                  <th className="px-6 py-4 text-left text-white font-semibold text-lg">
                    {t('includes')}
                  </th>
                  <th className="px-6 py-4 text-right text-white font-semibold text-lg">
                    {t('price')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {priceData.map((row, index) => (
                  <motion.tr
                    key={row.itemKey || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-[#08964c] font-medium">
                      {row.item}
                    </td>
                    <td className="px-6 py-4 text-[#08964c]">
                      {row.type}
                    </td>
                    <td className="px-6 py-4 text-[#08964c]">
                      {row.includes}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[#08964c] font-bold text-lg">
                        {row.price}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {priceData.map((row, index) => (
              <motion.div
                key={row.itemKey || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[#08964c] text-base flex-1">
                    {row.item}
                  </h3>
                  <span className="text-[#08964c] font-bold text-lg ml-4">
                    {row.price}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">{t('type')}:</span> {row.type}
                  </p>
                  <p>
                    <span className="font-medium">{t('includes')}:</span> {row.includes}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Prices
