'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n'
import { motion } from 'framer-motion'
import { useState } from 'react'

const LanguageSwitcher = () => {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const languageNames: Record<Locale, string> = {
    en: 'EN',
    ru: 'RU',
    ka: 'GEO',
  }

  const switchLocale = (newLocale: Locale) => {
    // Preserve query parameters when switching locale
    const queryString = searchParams.toString()
    
    // Construct the new URL with the new locale and preserved query params
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      // Remove current locale prefix if present
      const localePrefix = `/${locale}`
      let pathWithoutLocale = currentPath
      
      // Check if path starts with any locale prefix
      for (const loc of routing.locales) {
        if (currentPath.startsWith(`/${loc}`)) {
          pathWithoutLocale = currentPath.slice(`/${loc}`.length)
          break
        }
      }
      
      // Ensure path starts with /
      if (!pathWithoutLocale.startsWith('/')) {
        pathWithoutLocale = `/${pathWithoutLocale}`
      }
      
      // Build new path with new locale
      const newLocalePath = `/${newLocale}${pathWithoutLocale}`
      const fullUrl = queryString ? `${newLocalePath}?${queryString}` : newLocalePath
      
      // Navigate to the new URL, preserving query parameters
      window.location.href = fullUrl
    } else {
      // Fallback for SSR
      const newPath = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(newPath, { locale: newLocale })
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        <span>{languageNames[locale]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </motion.button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[100px]"
          >
            {routing.locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  locale === loc ? 'bg-orange-50 text-orange-600 font-semibold' : ''
                }`}
              >
                {languageNames[loc]}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher
