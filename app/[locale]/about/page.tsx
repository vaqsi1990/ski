'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'

const AboutPage = () => {
  const t = useTranslations('about')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#FFFAFA] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              {t('title')}
            </h1>
            <div className="w-24 h-1 bg-[#08964c] mx-auto"></div>
          </motion.div>

          {/* Introduction */}
          <motion.div variants={sectionVariants} className="mb-12">
            <p className="text-black text-lg md:text-xl leading-relaxed mb-6">
              {t('intro1')}
            </p>
            <p className="text-black text-lg md:text-xl leading-relaxed mb-6">
              {t('intro2')}
            </p>
            <p className="text-black text-lg md:text-xl leading-relaxed">
              {t('intro3')}
            </p>
          </motion.div>

          {/* Services Section */}
          <motion.div variants={sectionVariants} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
              {t('servicesTitle')}
            </h2>
            <div className=" p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('service1')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('service2')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('service3')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('service4')}</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Clothing Section */}
          <motion.div variants={sectionVariants} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
              {t('clothingTitle')}
            </h2>
            <div className=" p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('clothing1')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('clothing2')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('clothing3')}</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Accessories Section */}
          <motion.div variants={sectionVariants} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
              {t('accessoriesTitle')}
            </h2>
            <div className=" p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('accessory1')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('accessory2')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('accessory3')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('accessory4')}</span>
                </li>
                <li className="flex items-start">
                        <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('accessory5')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('accessory6')}</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Children Section */}
          <motion.div variants={sectionVariants} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
              {t('childrenTitle')}
            </h2>
            <div className=" p-6 ">
              <p className="text-black text-lg md:text-xl leading-relaxed mb-4">
                {t('childrenIntro')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('children1')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#08964c] mr-3 text-xl">•</span>
                  <span className="text-black text-lg md:text-xl">{t('children2')}</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* School Section */}
          <motion.div variants={sectionVariants} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
              {t('schoolTitle')}
            </h2>
            <div className=" p-6">
              <p className="text-black text-lg md:text-xl leading-relaxed">
                {t('schoolDescription')}
              </p>
            </div>
          </motion.div>

          {/* Tours Section */}
          <motion.div variants={sectionVariants} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
              {t('toursTitle')}
            </h2>
            <div className=" p-6">
              <p className="text-black text-lg md:text-xl leading-relaxed">
                {t('toursDescription')}
              </p>
            </div>
          </motion.div>

          {/* Conclusion */}
          <motion.div variants={sectionVariants} className="text-center">
            <p className="text-black text-2xl md:text-3xl font-bold italic">
              {t('conclusion')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutPage

