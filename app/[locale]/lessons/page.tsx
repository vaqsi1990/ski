'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

type LessonFormData = {
  numberOfPeople: string
  duration: string
  level: string
  date: Date | null
  startTime: string
  language: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  personalId: string
  totalPrice: number
}

const lessonSchema = z.object({
  numberOfPeople: z.string().min(1, 'Number of people is required').refine((val) => {
    const num = parseInt(val)
    return num >= 1 && num <= 4
  }, { message: 'Number of people must be between 1 and 4' }),
  duration: z.string().min(1, 'Duration is required').refine((val) => {
    return ['1', '2', '3'].includes(val)
  }, { message: 'Duration must be 1, 2, or 3 hours' }),
  level: z.string().min(1, 'Level is required'),
  date: z.date({ message: 'Date is required' }).nullable().refine((val) => val !== null, {
    message: 'Date is required',
  }),
  startTime: z.string().min(1, 'Start time is required').refine((val) => {
    const [hour] = val.split(':').map(Number)
    return hour >= 10 && hour < 16
  }, { message: 'Start time must be between 10:00 and 16:00' }),
  language: z.string().min(1, 'Language is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  personalId: z.string().min(1, 'Personal ID is required'),
})

// Default pricing fallback
const DEFAULT_PRICING: Record<number, Record<number, number>> = {
  1: { 1: 120, 2: 200, 3: 270 },
  2: { 1: 200, 2: 360, 3: 480 },
  3: { 1: 270, 2: 480, 3: 720 },
  4: { 1: 400, 2: 640, 3: 960 },
}

const LessonsPage = () => {
  const t = useTranslations('lessons')
  const locale = useLocale()
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [pricing, setPricing] = useState<Record<number, Record<number, number>>>(DEFAULT_PRICING)

  const [formData, setFormData] = useState<LessonFormData>({
    numberOfPeople: '',
    duration: '',
    level: '',
    date: null,
    startTime: '',
    language: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    personalId: '',
    totalPrice: 0,
  })

  // Fetch pricing from API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/lessons')
        if (response.ok) {
          const data = await response.json()
          if (data.pricing) {
            setPricing(data.pricing)
          }
        }
      } catch (error) {
        console.error('Failed to fetch pricing', error)
        // Use default pricing on error
      }
    }
    fetchPricing()
  }, [])

  // Generate time slots from 10:00 to 15:00 (last slot starts at 15:00 for 1-hour lesson)
  const timeSlots = []
  for (let hour = 10; hour <= 15; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  // Auto-calculate price when numberOfPeople and duration change
  useEffect(() => {
    if (formData.numberOfPeople && formData.duration) {
      const people = parseInt(formData.numberOfPeople)
      const hours = parseInt(formData.duration)
      const price = pricing[people]?.[hours] || 0
      setFormData((prev) => ({ ...prev, totalPrice: price }))
    } else {
      setFormData((prev) => ({ ...prev, totalPrice: 0 }))
    }
  }, [formData.numberOfPeople, formData.duration, pricing])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale || 'ka-GE', { style: 'currency', currency: 'GEL' }).format(amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    try {
      const validated = lessonSchema.parse({
        ...formData,
        date: formData.date,
      })

      if (!validated.date) {
        throw new Error('Date is required')
      }

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfPeople: validated.numberOfPeople,
          duration: validated.duration,
          level: validated.level,
          date: validated.date.toISOString().split('T')[0],
          startTime: validated.startTime,
          language: validated.language,
          firstName: validated.firstName,
          lastName: validated.lastName,
          email: validated.email,
          phoneNumber: validated.phoneNumber,
          personalId: validated.personalId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create lesson booking')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0].toString()] = issue.message
          }
        })
        setErrors(newErrors)
      } else {
        alert(err instanceof Error ? err.message : 'Failed to create lesson booking')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFAFA] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-black text-center mb-8">
          {t('title')}
        </h1>

        {success && (
          <div className="mb-6 p-4 bg-[#08964c] text-white border border-green-400 rounded-lg text-[18px] text-black">
            {t('success')}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Number of People */}
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('numberOfPeople')} *
              </label>
              <select
                value={formData.numberOfPeople}
                onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectNumberOfPeople')}</option>
                <option value="1">1 {t('person')}</option>
                <option value="2">2 {t('people')}</option>
                <option value="3">3 {t('people')}</option>
                <option value="4">4 {t('people')} ({t('groupLesson')})</option>
              </select>
              {errors.numberOfPeople && (
                <p className="text-red-500 text-[18px] mt-1">{errors.numberOfPeople}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('duration')} *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectDuration')}</option>
                <option value="1">1 {t('hour')}</option>
                <option value="2">2 {t('hours')}</option>
                <option value="3">3 {t('hours')}</option>
              </select>
              {errors.duration && (
                <p className="text-red-500 text-[18px] mt-1">{errors.duration}</p>
              )}
            </div>

            {/* Level */}
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('level')} *
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectLevel')}</option>
                <option value="BEGINNER">{t('beginner')}</option>
                <option value="INTERMEDIATE">{t('intermediate')}</option>
                <option value="EXPERT">{t('expert')}</option>
              </select>
              {errors.level && (
                <p className="text-red-500 text-[18px] mt-1">{errors.level}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('date')} *
              </label>
              <DatePicker
                selected={formData.date}
                onChange={(date: Date | null) => setFormData({ ...formData, date })}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholderText={t('selectDate')}
              />
              {errors.date && (
                <p className="text-red-500 text-[18px] mt-1">{errors.date}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('startTime')} * ({t('timeRange')})
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectTime')}</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.startTime && (
                <p className="text-red-500 text-[18px] mt-1">{errors.startTime}</p>
              )}
            </div>

            {/* Language */}
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('language')} *
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.language ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectLanguage')}</option>
                <option value="GEORGIAN">{t('georgian')}</option>
                <option value="ENGLISH">{t('english')}</option>
                <option value="RUSSIAN">{t('russian')}</option>
              </select>
              {errors.language && (
                <p className="text-red-500 text-[18px] mt-1">{errors.language}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-xl font-bold text-black mb-4">{t('contactInfo')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {t('firstName')} *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-[18px] mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {t('lastName')} *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-[18px] mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('email')} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-[18px] mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('phoneNumber')} *
              </label>
              <PhoneInput
                country="ge"
                value={formData.phoneNumber}
                onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                inputClass={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                buttonClass={`${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                containerClass=""
                inputStyle={{
                  width: '100%',
                  height: '48px',
                  fontSize: '18px',
                }}
                buttonStyle={{
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  borderRight: 'none',
                }}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-[18px] mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('personalId')} *
              </label>
              <input
                type="text"
                value={formData.personalId}
                onChange={(e) => setFormData({ ...formData, personalId: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.personalId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.personalId && (
                <p className="text-red-500 text-[18px] mt-1">{errors.personalId}</p>
              )}
            </div>

            {/* Display calculated price */}
            {formData.totalPrice > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-[18px] text-black">
                  <span className="font-semibold">{t('totalPrice')}: </span>
                  <span className="text-orange-600 font-bold">{formatCurrency(formData.totalPrice)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg transition-colors text-[18px] font-bold disabled:opacity-50"
              >
                {submitting ? t('submitting') : t('book')}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 px-8 py-3 rounded-lg transition-colors text-[18px] font-bold text-black"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LessonsPage

