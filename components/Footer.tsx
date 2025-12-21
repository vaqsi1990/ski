'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const Footer = () => {
    const footerVariants = {
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

    const currentYear = new Date().getFullYear()

    return (
        <motion.footer
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={footerVariants}
            className="bg-gray-900 text-white"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-xl font-bold mb-4 text-orange-500">
                            SkiRental
                        </h3>
                        <p className="text-white md:text-[18px] text-[16px] leading-relaxed mb-4">
                            პრემიუმ ხარისხის თხილამურებისა და სნოუბორდების გაქირავება გუდაურში. 
                            ყველაფერი რაც გჭირდება სრულყოფილი სათხილამურო გამოცდილებისთვის.
                        </p>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div variants={itemVariants}>
                        <h4 className="text-lg md:text-[20px] text-[16px] font-semibold mb-4">სწრაფი ბმულები</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/"
                                    className="text-white hover:text-orange-500 transition-colors md:text-[18px] text-[16px]"
                                >
                                    მთავარი
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/inventory"
                                    className="text-white hover:text-orange-500 transition-colors md:text-[18px] text-[16px]"
                                >
                                    აღჭურვილობა
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    
                                    className="text-white hover:text-orange-500 transition-colors md:text-[18px] text-[16px]"
                                >
                                    ჩვენს შესახებ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    
                                    
                                    className="text-white hover:text-orange-500 transition-colors md:text-[18px] text-[16px]"
                                >
                                    კონტაქტი
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Services */}
                    <motion.div variants={itemVariants}>
                        <h4 className="text-lg md:text-[20px] text-[16px] font-semibold mb-4">სერვისები</h4>
                        <ul className="space-y-2">
                            <li>
                                <span className="text-white md:text-[18px] text-[16px]">
                                    თხილამურების გაქირავება
                                </span>
                            </li>
                            <li>
                                <span className="text-white md:text-[18px] text-[16px]">
                                    სნოუბორდების გაქირავება
                                </span>
                            </li>
                            <li>
                                <span className="text-white md:text-[18px] text-[16px]">
                                    აქსესუარები
                                </span>
                            </li>
                            <li>
                                
                                    <span className="text-white md:text-[18px] text-[16px]">
                                    პროფესიონალური გაკვეთილები
                                </span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div variants={itemVariants}>
                        <h4 className="text-lg md:text-[20px] text-[16px] font-semibold mb-4">კონტაქტი</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <svg
                                    className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span className="text-white md:text-[18px] text-[16px]">
                                    გუდაური, საქართველო
                                </span>
                            </li>
                            <li className="flex items-center">
                                <svg
                                    className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                <span className="text-white md:text-[18px] text-[16px]">
                                    +995 XXX XXX XXX
                                </span>
                            </li>
                            <li className="flex items-center">
                                <svg
                                    className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="text-white md:text-[18px] text-[16px]">
                                    info@skirental.ge
                                </span>
                            </li>
                        </ul>
                    </motion.div>
                </div>

              
            </div>
        </motion.footer>
    )
}

export default Footer
