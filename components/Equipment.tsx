'use client'

import React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { motion } from 'framer-motion'

const Equipment = () => {
    const t = useTranslations('equipment')
    const pathname = usePathname()
    const isItemsPage = pathname === '/items'
    
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

    const cardVariants = (index: number) => ({
        hidden: {
            opacity: 0,
            y: 50,
            x: index % 2 === 0 ? -30 : 30,
            scale: 0.9,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                delay: index * 0.15,
            },
        },
    })

    const titleVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
            },
        },
    }

    const equipment = [
        {
            id: 1,
            key: 'skis',
            type: 'SKI',
            image: '/images/1.png',
            buttonColor: 'bg-orange-500 hover:bg-orange-600',
            link: '/booking?type=SKI',
        },
        {
            id: 2,
            key: 'accessories',
            type: 'ACCESSORY',
            image: '/images/serv2.png',
            buttonColor: 'bg-orange-500 hover:bg-orange-600',
            link: '/booking?type=ACCESSORY',
        },
        {
            id: 4,
            key: 'lessons',
            type: 'LESSON',
            image: '/images/serv3.png',
            buttonColor: 'bg-orange-500 hover:bg-orange-600',
            link: '/lessons',
        },
        {
            id: 3,
            key: 'snowboards',
            type: 'VEHICLES',
            image: '/images/serv6.png',
            buttonColor: 'bg-orange-500 hover:bg-orange-600',
            link: '/booking?type=VEHICLES',
        },
     
    ]

    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="py-10 bg-[#FFFAFA]"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Title */}
                <motion.h2
                    variants={titleVariants}
                    className="text-xl md:text-2xl text-black text-bold text-center mb-12"
                >
                    {isItemsPage ? t('booking') : t('title')}
                </motion.h2>

                {/* Equipment Cards with Text Overlay */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {equipment.map((item, index) => (
                        <motion.div
                            key={item.id}
                            variants={cardVariants(index)}
                            whileHover={{ 
                                scale: 1.03,
                                transition: { duration: 0.3 }
                            }}
                        >
                            <Link
                                href={item.link}
                                className="group relative h-[500px] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 block"
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.5 }}
                                        className="absolute inset-0"
                                    >
                                        <Image
                                            src={item.image}
                                            alt={t(`items.${item.key}.name`)}
                                            fill
                                            className="object-cover transition-transform duration-300"
                                        />
                                    </motion.div>
                                    {/* Dark Overlay for better text readability */}
                                    <motion.div
                                        initial={{ opacity: 0.7 }}
                                        whileHover={{ opacity: 0.85 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
                                    />
                                </div>

                                {/* Text Content Overlay */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
                                    className="absolute inset-0 flex flex-col justify-end items-center p-8"
                                >
                                    <motion.h3
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                        className="md:text-[24px] text-[16px] font-bold text-white mb-3 text-center"
                                    >
                                        {t(`items.${item.key}.name`)}
                                    </motion.h3>
                                    
                                    {/* Description for skis and snowboards */}
                                   
                                   
                                    <motion.div
                                        whileHover={{ 
                                            scale: 1.1,
                                            y: -5,
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className={`${item.buttonColor} text-white md:text-[20px] text-[16px] font-bold px-8 py-4 rounded-lg font-semibold inline-block w-fit transition-all duration-200 cursor-pointer`}
                                    >
                                       {t('viewMore')}
                                    </motion.div>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    )
}

export default Equipment

