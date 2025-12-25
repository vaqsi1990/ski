'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'

interface PriceItem {
  item: string
  type: string
  includes: string
  price: string
}

const Prices = () => {
  const t = useTranslations('prices')
  const locale = useLocale()

  const priceData: PriceItem[] = [
    {
      item: t('skiSetStandard'),
      type: t('standard'),
      includes: t('includesSkiBootsPoles'),
      price: '50 ₾'
    },
    {
      item: t('skiSetProfessional'),
      type: t('professional'),
      includes: t('includesSkiBootsPoles'),
      price: '60-150 ₾'
    },
    {
      item: t('skiSetKidsStandard'),
      type: t('standard'),
      includes: t('includesSkiBootsPoles'),
      price: '40 ₾'
    },
    {
      item: t('skiStandard'),
      type: t('standard'),
      includes: t('includesSkiOnly'),
      price: '40 ₾'
    },
    {
      item: t('skiProfessional'),
      type: t('professional'),
      includes: t('includesSkiOnly'),
      price: '70 ₾'
    },
    {
      item: t('skiBootsStandard'),
      type: t('standard'),
      includes: t('includesBootsOnly'),
      price: '30 ₾'
    },
    {
      item: t('snowboardSetStandard'),
      type: t('standard'),
      includes: t('includesBoardBoots'),
      price: '70 ₾'
    },
    {
      item: t('snowboardSetKidsStandard'),
      type: t('standard'),
      includes: t('includesBoardBoots'),
      price: '60 ₾'
    },
    {
      item: t('snowboardSetProfessional'),
      type: t('professional'),
      includes: t('includesBoardBoots'),
      price: '80-150 ₾'
    },
    {
      item: t('boardStandard'),
      type: t('standard'),
      includes: t('includesBoardOnly'),
      price: '50 ₾'
    },
    {
      item: t('boardProfessional'),
      type: t('professional'),
      includes: t('includesBoardOnly'),
      price: '70 ₾'
    },
    {
      item: t('snowboardBootsStandard'),
      type: t('standard'),
      includes: t('includesBootsOnly'),
      price: '40 ₾'
    },
    {
      item: t('gogglesStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾'
    },
    {
      item: t('helmetStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾'
    },
    {
      item: t('polesStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾'
    },
    {
      item: t('glovesStandard'),
      type: t('accessory'),
      includes: t('accessory'),
      price: '10 ₾'
    },
    {
      item: t('jacket'),
      type: t('clothes'),
      includes: t('clothes'),
      price: '20 ₾'
    },
    {
      item: t('pants'),
      type: t('clothes'),
      includes: t('clothes'),
      price: '20 ₾'
    },
    {
      item: t('sledge'),
      type: t('forSnow'),
      includes: t('forSnow'),
      price: '30 ₾'
    },
    {
      item: t('instructor'),
      type: t('forOnePerson'),
      includes: t('forOnePerson'),
      price: '120 ₾'
    }
  ]

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
                    key={index}
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
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[#08964c] text-base flex-1">
                    {row.item}
                  </h3>
                  <span className="text-orange-500 font-bold text-lg ml-4">
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
