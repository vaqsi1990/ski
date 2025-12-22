'use client'

import React from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCards, Navigation } from 'swiper/modules'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import 'swiper/css'
import 'swiper/css/effect-cards'
import 'swiper/css/navigation'

const Services = () => {
  const t = useTranslations('services')
  
  const services = [
    {
      id: 1,
      titleKey: 'service1.title',
      descriptionKey: 'service1.description',
      image: '/images/serv1.png',
    },
    {
      id: 3,
      titleKey: 'service3.title',
      descriptionKey: 'service3.description',
      image: '/images/serv3.png',
    },
    {
      id: 4,
      titleKey: 'service4.title',
      descriptionKey: 'service4.description',
      image: '/images/serv4.png',
    },
    {
      id: 2,
      titleKey: 'service2.title',
      descriptionKey: 'service2.description',
      image: '/images/serv2.png',
    },
    {
      id: 5,
      titleKey: 'service5.title',
      descriptionKey: 'service5.description',
      image: '/images/serv5.png',
    },
    {
      id: 6,
      titleKey: 'service6.title',
      descriptionKey: 'service6.description',
      image: '/images/serv6.png',
    },
  ]
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-[#FFFAFA]"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          variants={itemVariants}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-2 sm:mb-3 md:mb-4 px-2"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-2"
          >
            {t('subtitle')}
          </motion.p>
        </motion.div>

        {/* ================= MOBILE / TABLET : 3D CARDS SLIDER ================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="block lg:hidden relative w-full overflow-hidden"
        >
          <Swiper
            modules={[EffectCards, Autoplay, Navigation]}
            effect="cards"
            grabCursor
            navigation={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            cardsEffect={{
              slideShadows: false,
              perSlideOffset: 6,
              perSlideRotate: 1,
            }}
            loop
            className="h-[350px] xs:h-[400px] sm:h-[500px] md:h-[600px] w-full max-w-full [&_.swiper-wrapper]:overflow-visible [&_.swiper-button-next]:bg-red-600 [&_.swiper-button-prev]:bg-red-600 [&_.swiper-button-next]:text-white [&_.swiper-button-prev]:text-white [&_.swiper-button-next]:w-7 [&_.swiper-button-prev]:w-7 [&_.swiper-button-next]:h-7 [&_.swiper-button-prev]:h-7 sm:[&_.swiper-button-next]:w-8 sm:[&_.swiper-button-prev]:w-8 sm:[&_.swiper-button-next]:h-8 sm:[&_.swiper-button-prev]:h-8 md:[&_.swiper-button-next]:w-10 md:[&_.swiper-button-prev]:w-10 md:[&_.swiper-button-next]:h-10 md:[&_.swiper-button-prev]:h-10 [&_.swiper-button-next]:rounded-full [&_.swiper-button-prev]:rounded-full [&_.swiper-button-next]:shadow-lg [&_.swiper-button-prev]:shadow-lg [&_.swiper-button-next]:hover:bg-red-700 [&_.swiper-button-prev]:hover:bg-red-700 [&_.swiper-button-next::after]:text-xs [&_.swiper-button-prev::after]:text-xs sm:[&_.swiper-button-next::after]:text-sm sm:[&_.swiper-button-prev::after]:text-sm md:[&_.swiper-button-next::after]:text-base md:[&_.swiper-button-prev::after]:text-base"
          >
            {services.map((service) => (
              <SwiperSlide key={service.id}>
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={service.image}
                    alt={t(service.titleKey)}
                    fill
                    className="object-cover"
                    priority={service.id === 1}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                  {/* Text */}
                  <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-3 xs:p-4 sm:p-6 md:p-8">
                    <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white mb-1.5 xs:mb-2 sm:mb-3 drop-shadow-lg px-2">
                      {t(service.titleKey)}
                    </h3>
                    <p className="text-white/90 text-xs xs:text-sm sm:text-base leading-relaxed drop-shadow-md px-3">
                      {t(service.descriptionKey)}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        {/* ================= DESKTOP SLIDER ================= */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden lg:block relative"
        >
          <Swiper
            modules={[Autoplay, Navigation]}
            grabCursor
            navigation={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            loop
            breakpoints={{
              1024: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              1280: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1536: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="h-[400px] [&_.swiper-button-next]:bg-red-600 [&_.swiper-button-prev]:bg-red-600 [&_.swiper-button-next]:text-white [&_.swiper-button-prev]:text-white [&_.swiper-button-next]:w-10 [&_.swiper-button-prev]:w-10 [&_.swiper-button-next]:h-10 [&_.swiper-button-prev]:h-10 [&_.swiper-button-next]:rounded-full [&_.swiper-button-prev]:rounded-full [&_.swiper-button-next]:shadow-lg [&_.swiper-button-prev]:shadow-lg [&_.swiper-button-next:hover]:bg-red-700 [&_.swiper-button-prev:hover]:bg-red-700 [&_.swiper-button-next::after]:text-base [&_.swiper-button-prev::after]:text-base"
          >
            {services.map((service, index) => (
              <SwiperSlide key={service.id}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                  className="group relative h-[400px] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl"
                >
                  <Image
                    src={service.image}
                    alt={t(service.titleKey)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0.7 }}
                    whileHover={{ opacity: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"
                  />

                  {/* Text */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="absolute inset-0 flex flex-col justify-end items-center text-center p-6"
                  >
                    <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
                      {t(service.titleKey)}
                    </h3>
                    <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">
                      {t(service.descriptionKey)}
                    </p>
                  </motion.div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

      </div>
    </motion.section>
  )
}

export default Services
