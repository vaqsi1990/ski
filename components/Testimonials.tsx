'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const Testimonials = () => {
  const t = useTranslations('testimonials')
  
  const testimonials = [
    {
      id: 1,
      nameKey: 'testimonial1.name',
      textKey: 'testimonial1.text',
      rating: 5,
    },
    {
      id: 2,
      nameKey: 'testimonial2.name',
      textKey: 'testimonial2.text',
      rating: 5,
    },
    {
      id: 3,
      nameKey: 'testimonial3.name',
      textKey: 'testimonial3.text',
      rating: 5,
    },
    {
      id: 4,
      nameKey: 'testimonial4.name',
      textKey: 'testimonial4.text',
      rating: 5,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  }

  const StarIcon = () => (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )

  const QuoteIcon = () => (
    <svg
      className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 opacity-20"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  )

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className="relative bg-[#FFFAFA] pb-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 lg:mb-16"
        >
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-3 sm:mb-4"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg"
          >
            {t('subtitle')}
          </motion.p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
              className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
            >
              {/* Quote Icon Background */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <QuoteIcon />
              </div>

              {/* Rating Stars */}
              <div className="flex gap-1 mb-4 relative z-10">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>

              {/* Testimonial Text */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-gray-800 text-sm sm:text-base leading-relaxed mb-6 flex-grow relative z-10"
              >
                {t(testimonial.textKey)}
              </motion.p>

              {/* Author Section */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center mt-auto pt-4 border-t border-gray-100 relative z-10"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl mr-4 shadow-lg">
                  {t(testimonial.nameKey).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-black text-base sm:text-lg">
                    {t(testimonial.nameKey)}
                  </p>
                 
                </div>
              </motion.div>

              {/* Decorative gradient overlay on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/30 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

export default Testimonials

