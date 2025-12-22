'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface WeatherData {
  current: {
    temp_c: number
    feelslike_c: number
    humidity: number
    wind_kph: number
    condition: {
      text: string
      icon: string
    }
  }
  location: {
    name: string
  }
}

const Weather = () => {
  const t = useTranslations('weather')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather')
        if (!response.ok) {
          throw new Error('Failed to fetch weather')
        }
        const data = await response.json()
        setWeatherData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  const getWeatherIcon = (iconUrl: string) => {
    // WeatherAPI returns full URL, but if it's just a code, construct it
    if (iconUrl.startsWith('http')) {
      return iconUrl
    }
    return `https:${iconUrl}`
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
      },
    },
  }

  if (loading) {
    return (
      <section className="relative py-8 sm:py-12 bg-[#FFFAFA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">{t('loading')}</div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !weatherData) {
    return (
      <section className="relative py-8 sm:py-12 bg-[#FFFAFA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <div className="text-center text-gray-600">
              {error ? `Error: ${error}` : 'Weather data unavailable'}
            </div>
          </div>
        </div>
      </section>
    )
  }

  const current = weatherData.current

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="relative py-8 sm:py-12 bg-[#FFFAFA]"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Main Weather Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              {current.condition.icon && (
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  src={getWeatherIcon(current.condition.icon)}
                  alt={current.condition.text}
                  className="w-16 h-16 sm:w-20 sm:h-20"
                />
              )}
              <div>
                <motion.h3
                  variants={itemVariants}
                  className="text-lg sm:text-xl font-bold text-black mb-1"
                >
                  {t('title')}
                </motion.h3>
                <motion.div
                  variants={itemVariants}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-3xl sm:text-4xl font-bold text-red-600">
                    {Math.round(current.temp_c)}°
                  </span>
                  <span className="text-gray-500 text-sm sm:text-base">
                    {t('celsius')}
                  </span>
                </motion.div>
                <motion.p
                  variants={itemVariants}
                  className="text-gray-600 text-sm sm:text-base capitalize"
                >
                  {current.condition.text}
                </motion.p>
              </div>
            </div>

            {/* Additional Weather Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full sm:w-auto">
              <motion.div
                variants={itemVariants}
                className="text-center sm:text-left"
              >
                <p className="text-gray-500 text-xs sm:text-sm mb-1">
                  {t('feelsLike')}
                </p>
                <p className="text-black font-semibold text-sm sm:text-base">
                  {Math.round(current.feelslike_c)}°{t('celsius')}
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="text-center sm:text-left"
              >
                <p className="text-gray-500 text-xs sm:text-sm mb-1">
                  {t('wind')}
                </p>
                <p className="text-black font-semibold text-sm sm:text-base">
                  {Math.round(current.wind_kph)} {t('windUnit')}
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="text-center sm:text-left col-span-2 sm:col-span-1"
              >
                <p className="text-gray-500 text-xs sm:text-sm mb-1">
                  {t('humidity')}
                </p>
                <p className="text-black font-semibold text-sm sm:text-base">
                  {current.humidity}%
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default Weather

