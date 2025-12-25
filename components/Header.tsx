'use client'

import React, { useState, useEffect } from 'react'
import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'
import Image from 'next/image'

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const t = useTranslations('header')

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isMenuOpen])

    const closeMenu = () => {
        setIsMenuOpen(false)
    }

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center space-x-2">
                          
                            <Image src="/logo.jpg" alt="logo" width={50} height={50} />
                            <span className="text-xl uppercase  sm:text-2xl font-bold text-[#08964c]">SKI RENT FANATIC </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8 items-center">
                    <Link 
                            href="/" 
                            className="text-black md:text-[20px] text-[16px] hover:text-[#08964c] transition-colors font-medium"
                        >
                            {t('home')}
                        </Link>
                        <Link 
                            href="/items" 
                            className="text-black md:text-[20px] text-[16px] hover:text-[#08964c] transition-colors font-medium"
                        >
                          {t('equipment')}
                        </Link>
                        <Link 
                            href="/about" 
                            className="text-black md:text-[20px] text-[16px] hover:text-[#08964c] transition-colors font-medium"
                        >
                         {t('about')}
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
                            className="relative z-50 p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#08964c] transition-all duration-200"
                            aria-label="Toggle menu"
                            aria-expanded={isMenuOpen}
                        >
                            <svg
                                className="h-6 w-6 transition-transform duration-300"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
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
            </div>

            {/* Overlay Backdrop */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Navigation Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-[70vw] bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Menu Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <Image src="/logo.jpg" alt="logo" width={40} height={40} />
                            <span className="text-lg font-bold text-[#08964c]">SKI RENT FANATIC</span>
                        </div>
                        <button
                            onClick={closeMenu}
                            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#08964c] transition-all"
                            aria-label="Close menu"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Menu Content */}
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                        <Link
                            href="/"
                            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-[#08964c] transition-all duration-200 font-medium text-lg"
                            onClick={closeMenu}
                        >
                            {t('home')}
                        </Link>
                        <Link
                            href="/items"
                            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-[#08964c] transition-all duration-200 font-medium text-lg"
                            onClick={closeMenu}
                        >
                            {t('equipment')}
                        </Link>
                        <Link
                            href="/about"
                            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-[#08964c] transition-all duration-200 font-medium text-lg"
                            onClick={closeMenu}
                        >
                            {t('about')}
                        </Link>
                       
                        
                        {/* Book Now Button */}
                        <div className="pt-4">
                            <Link
                                href="/items"
                                className="block w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold text-center text-lg shadow-md hover:shadow-lg"
                                onClick={closeMenu}
                            >
                                {t('bookNow')}
                            </Link>
                        </div>

                        {/* Language Switcher */}
                        <div className="pt-6 border-t border-gray-200 mt-6">
                            <div className="px-4">
                                <p className="text-sm text-gray-500 mb-3 font-medium">Language</p>
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    )
}

export default Header
