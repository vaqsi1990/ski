'use client'

import React, { useState } from 'react'
import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const t = useTranslations('header')
 

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center space-x-2">
                          
                            <span className="text-2xl font-bold text-blue-600">
                                SkiRental
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8 items-center">
                    <Link 
                            href="/" 
                            className="text-black md:text-[20px] text-[16px] hover:text-orange-500 transition-colors font-medium"
                        >
                            {t('home')}
                        </Link>
                        <Link 
                            href="/inventory" 
                            className="text-black md:text-[20px] text-[16px] hover:text-orange-500 transition-colors font-medium"
                        >
                          {t('equipment')}
                        </Link>
                        <Link 
                            href="/about" 
                            className="text-black md:text-[20px] text-[16px] hover:text-orange-500 transition-colors font-medium"
                        >
                         {t('about')}
                        </Link>
                        <Link 
                            href="/contact" 
                            className="text-black md:text-[20px] text-[16px] hover:text-orange-500 transition-colors font-medium"
                        >
                            {t('contact')}
                        </Link>
                       
                    </nav>

                    {/* Language Switcher */}
                    <div className="hidden md:flex items-center">
                        <LanguageSwitcher />
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 hover:text-blue-600 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isMenuOpen ? (
                                    <path d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden pb-4">
                        <nav className="flex flex-col space-y-4 pt-4">
                            <Link
                                href="/"
                                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('home')}
                            </Link>
                            <Link
                                href="/inventory"
                                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('equipment')}
                            </Link>
                            <Link
                                href="/about"
                                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('about')}
                            </Link>
                            <Link
                                href="/contact"
                                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('contact')}
                            </Link>
                            <Link
                                href="/book"
                                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium text-center"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('bookNow')}
                            </Link>
                            <div className="pt-2">
                                <LanguageSwitcher />
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header
