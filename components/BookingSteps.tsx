'use client'

import React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'

const BookingSteps = () => {
    const t = useTranslations('bookingSteps')
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.2,
            },
        },
    }

    const stepVariants = (index: number) => ({
        hidden: {
            opacity: 0,
            y: 30,
            scale: 0.8,
            rotate: index % 2 === 0 ? -5 : 5,
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            transition: {
                duration: 0.6,
                delay: index * 0.2,
            },
        },
    })

    const iconVariants = {
        hidden: { 
            opacity: 0, 
            scale: 0,
            rotate: -180,
        },
        visible: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: {
                duration: 0.5,
            },
        },
    }

    const arrowVariants = {
        hidden: { 
            opacity: 0, 
            x: -20,
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.4,
                delay: 0.3,
            },
        },
    }

    const titleVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
            },
        },
    }

    const steps = [
        {
            id: 1,
            icon: "/images/cal.png",
            translationKey: 'step1',
        },
        {
            id: 2,
            icon: "/images/ski.png",
            translationKey: 'step2',
        },
        {
            id: 3,
            icon: "/images/return.png",
            translationKey: 'step3',
        },
    ]

    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className=""
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Title */}
                <motion.h2
                    variants={titleVariants}
                    className="text-xl md:text-2xl text-black text-bold text-center mb-10"
                >
                    {t('title')}
                </motion.h2>

                {/* Steps */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            {/* Step */}
                            <motion.div
                                variants={stepVariants(index)}
                                whileHover={{ 
                                    scale: 1.1,
                                    y: -10,
                                    transition: { duration: 0.3 }
                                }}
                                className="flex flex-col items-center text-center"
                            >
                                <motion.div
                                    variants={iconVariants}
                                    whileHover={{ 
                                        rotate: [0, -10, 10, -10, 0],
                                        scale: 1.2,
                                        transition: { duration: 0.5 }
                                    }}
                                    className="p-6 mb-4"
                                >
                                    <Image 
                                        src={step.icon} 
                                        alt={t(step.translationKey)} 
                                        width={70} 
                                        height={70} 
                                    />
                                </motion.div>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + index * 0.2, duration: 0.5 }}
                                    className="md:text-[20px] text-[16px] font-bold"
                                >
                                    {t(step.translationKey)}
                                </motion.p>
                            </motion.div>

                            {/* Arrow (not shown on last step) */}
                            {index < steps.length - 1 && (
                                <motion.div
                                    variants={arrowVariants}
                                    animate={{
                                        x: [0, 5, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="hidden md:block"
                                >
                                    <svg
                                        className="w-8 h-8 text-black"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </motion.div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </motion.section>
    )
}

export default BookingSteps

