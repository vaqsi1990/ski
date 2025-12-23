'use client'

import React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'

const Hero = () => {
    const t = useTranslations('hero')
    
    return (
        <section className="relative h-[100vh]  flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero.jpg"
                    alt={t('alt')}
                    fill
                    priority
                    className="object-cover"
                    quality={90}
                />
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-6">
                    {/* Main Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -40, x: -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: 'easeOut',
                        }}
                    >
                        <h1 className=" md:text-[30px] text-[20px] font-bold text-white uppercase tracking-tight">
                            {t('title')}
                        </h1>


                    </motion.div>

                    {/* Subtitle */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: 'easeOut',
                        }}
                    >
                          <p className="text-xl md:text-2xl text-white font-light">
                            {t('subtitle')}
                        </p>


                    </motion.div>
                      
                      

                    {/* CTA Button */}
                    <div className="pt-4">
                        <Link
                            href="/book"
                            className="inline-block bg-orange-500 md:text-[20px] text-[16px] font-bold hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
                        >
                            {t('cta')}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero
