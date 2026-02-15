'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

type PersonContactInfo = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  personalId: string
}

type Teacher = { id: string; firstname: string; lastname: string }

type LessonFormData = {
  numberOfPeople: string
  duration: string
  level: string
  lessonType: string
  teacherId: string
  date: Date | null
  startTime: string
  language: string
  participants: PersonContactInfo[]
  totalPrice: number
}

const createPersonSchema = () => z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  personalId: z.string().min(1, 'Personal ID is required'),
})

const lessonSchema = z.object({
  numberOfPeople: z.string().min(1, 'Number of people is required').refine((val) => {
    const num = parseInt(val)
    return num >= 1 && num <= 4
  }, { message: 'Number of people must be between 1 and 4' }),
  duration: z.string().min(1, 'Duration is required').refine((val) => {
    return ['1', '2', '3'].includes(val)
  }, { message: 'Duration must be 1, 2, or 3 hours' }),
  level: z.string().min(1, 'Level is required'),
  lessonType: z.string().min(1, 'Lesson type is required').refine((val) => {
    return ['SKI', 'SNOWBOARD'].includes(val)
  }, { message: 'Lesson type must be SKI or SNOWBOARD' }),
  date: z.date({ message: 'Date is required' }).nullable().refine((val) => val !== null, {
    message: 'Date is required',
  }),
  startTime: z.string().min(1, 'Start time is required').refine((val) => {
    const [hour] = val.split(':').map(Number)
    return hour >= 10 && hour < 16
  }, { message: 'Start time must be between 10:00 and 16:00' }),
  language: z.string().min(1, 'Language is required'),
  participants: z.array(createPersonSchema()).min(1, 'At least one participant is required'),
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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [lessonInfo, setLessonInfo] = useState<{
    lessonType: string
    numberOfPeople: number
    duration: number
    level: string
    teacherName?: string
    date: Date | null
    startTime: string
    language: string
    totalPrice: number
  } | null>(null)
  const [pricing, setPricing] = useState<Record<number, Record<number, number>>>(DEFAULT_PRICING)
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [formData, setFormData] = useState<LessonFormData>({
    numberOfPeople: '',
    duration: '',
    level: '',
    lessonType: '',
    teacherId: '',
    date: null,
    startTime: '',
    language: '',
    participants: [],
    totalPrice: 0,
  })

  // Initialize participants when numberOfPeople changes
  useEffect(() => {
    const numPeople = parseInt(formData.numberOfPeople) || 0
    if (numPeople > 0 && numPeople <= 4) {
      const currentParticipants = formData.participants || []
      const newParticipants: PersonContactInfo[] = []
      
      for (let i = 0; i < numPeople; i++) {
        if (currentParticipants[i]) {
          newParticipants.push(currentParticipants[i])
        } else {
          newParticipants.push({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            personalId: '',
          })
        }
      }
      
      setFormData((prev) => ({ ...prev, participants: newParticipants }))
    } else if (numPeople === 0) {
      setFormData((prev) => ({ ...prev, participants: [] }))
    }
  }, [formData.numberOfPeople])

  // Fetch pricing and teachers from API
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
      }
    }
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers')
        if (response.ok) {
          const data = await response.json()
          if (data.teachers) {
            setTeachers(data.teachers)
          }
        }
      } catch (error) {
        console.error('Failed to fetch teachers', error)
      }
    }
    fetchPricing()
    fetchTeachers()
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
      // Validate number of participants matches numberOfPeople
      const numPeople = parseInt(formData.numberOfPeople)
      if (formData.participants.length !== numPeople) {
        setErrors({ participants: `Please provide contact information for all ${numPeople} ${numPeople === 1 ? 'person' : 'people'}` })
        return
      }

      const validated = lessonSchema.parse({
        ...formData,
        date: formData.date,
      })

      if (!validated.date) {
        throw new Error('Date is required')
      }

      // Use first participant as primary contact for API compatibility
      const primaryParticipant = validated.participants[0]

      // Format date as YYYY-MM-DD using local date components to avoid timezone shifts
      // toISOString() converts to UTC which can shift the date backward by one day
      const year = validated.date.getFullYear()
      const month = String(validated.date.getMonth() + 1).padStart(2, '0')
      const day = String(validated.date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfPeople: validated.numberOfPeople,
          duration: validated.duration,
          level: validated.level,
          lessonType: validated.lessonType,
          teacherId: formData.teacherId || undefined,
          date: dateString,
          startTime: validated.startTime,
          language: validated.language,
          firstName: primaryParticipant.firstName,
          lastName: primaryParticipant.lastName,
          email: primaryParticipant.email,
          phoneNumber: primaryParticipant.phoneNumber,
          personalId: primaryParticipant.personalId,
          participants: validated.participants,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create lesson booking')
      }

      const responseData = await response.json()
      
      const selectedTeacher = teachers.find((t) => t.id === formData.teacherId)
      setLessonInfo({
        lessonType: validated.lessonType,
        numberOfPeople: parseInt(validated.numberOfPeople),
        duration: parseInt(validated.duration),
        level: validated.level,
        teacherName: selectedTeacher ? `${selectedTeacher.firstname} ${selectedTeacher.lastname}` : undefined,
        date: validated.date,
        startTime: validated.startTime,
        language: validated.language,
        totalPrice: formData.totalPrice,
      })
      
      setSuccess(true)
      setShowSuccessPopup(true)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        err.issues.forEach((issue) => {
          const path = issue.path
          if (path.length > 0) {
            if (path[0] === 'participants' && path.length > 1) {
              // Handle nested participant errors
              const participantIndex = path[1] as number
              const field = path[2] as string
              newErrors[`participants.${participantIndex}.${field}`] = issue.message
            } else {
              newErrors[path[0].toString()] = issue.message
            }
          }
        })
        setErrors(newErrors)
      } else {
        alert(err instanceof Error ? err.message : 'Failed to create lesson booking')
      }
    }
  }

  const updateParticipant = (index: number, field: keyof PersonContactInfo, value: string) => {
    const updatedParticipants = [...formData.participants]
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value,
    }
    setFormData({ ...formData, participants: updatedParticipants })
  }

  return (
    <div className="min-h-screen bg-[#FFFAFA] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-black text-center mb-8">
          {t('title')}
        </h1>

        {/* Success Popup Modal */}
        {showSuccessPopup && lessonInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-green-600">
                    {t('bookingSuccessTitle')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowSuccessPopup(false)
                      router.push('/')
                    }}
                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors"
                    aria-label={t('close')}
                  >
                    ×
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-[18px] text-black mb-4">
                    {t('bookingSuccessMessage')}
                  </p>
                  
                  <div className="border-t border-b border-gray-200 py-4 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-black mb-2">
                        {t('bookingDetails')}
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="font-semibold text-black">{t('lessonType')}: </span>
                          <span className="text-black">
                            {lessonInfo.lessonType === 'SKI' ? t('ski') : t('snowboard')}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-semibold text-black">{t('numberOfPeople')}: </span>
                          <span className="text-black">
                            {lessonInfo.numberOfPeople} {lessonInfo.numberOfPeople === 1 ? t('person') : t('people')}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-semibold text-black">{t('duration')}: </span>
                          <span className="text-black">
                            {lessonInfo.duration} {lessonInfo.duration === 1 ? t('hour') : t('hours')}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-semibold text-black">{t('level')}: </span>
                          <span className="text-black">
                            {t(lessonInfo.level.toLowerCase())}
                          </span>
                        </div>
                        
                        {lessonInfo.teacherName && (
                          <div>
                            <span className="font-semibold text-black">{t('teacher')}: </span>
                            <span className="text-black">{lessonInfo.teacherName}</span>
                          </div>
                        )}
                        
                        {lessonInfo.date && (
                          <div>
                            <span className="font-semibold text-black">{t('date')}: </span>
                            <span className="text-black">
                              {lessonInfo.date.toLocaleDateString(locale || 'ka-GE')}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-semibold text-black">{t('startTime')}: </span>
                          <span className="text-black">
                            {lessonInfo.startTime}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-semibold text-black">{t('language')}: </span>
                          <span className="text-black">
                            {t(lessonInfo.language.toLowerCase())}
                          </span>
                        </div>
                        
                        {lessonInfo.totalPrice > 0 && (
                          <div>
                            <span className="font-semibold text-black">{t('totalPrice')}: </span>
                            <span className="text-orange-600 font-bold text-[18px]">
                              {formatCurrency(lessonInfo.totalPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Cancellation Info */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-[16px] text-gray-700">
                      {t('cancellationInfo')}{' '}
                      <a 
                        href={`tel:+995577614151`}
                        className="text-orange-600 font-semibold hover:text-orange-700 underline"
                      >
                        {t('cancellationPhone')}
                      </a>
                      {' '}{t('cancellationOr')}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowSuccessPopup(false)
                      router.push('/')
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg transition-colors text-[18px] font-bold"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            </div>
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

            {/* Lesson Type */}
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('lessonType')} *
              </label>
              <select
                value={formData.lessonType}
                onChange={(e) => setFormData({ ...formData, lessonType: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.lessonType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectLessonType')}</option>
                <option value="SKI">{t('ski')}</option>
                <option value="SNOWBOARD">{t('snowboard')}</option>
              </select>
              {errors.lessonType && (
                <p className="text-red-500 text-[18px] mt-1">{errors.lessonType}</p>
              )}
            </div>

            {/* Teacher */}
            {teachers.length > 0 && (
              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {t('teacher')}
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[18px] text-black"
                >
                  <option value="">{t('selectTeacher')}</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstname} {teacher.lastname}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
            {formData.numberOfPeople && parseInt(formData.numberOfPeople) > 0 && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-xl font-bold text-black mb-4">{t('contactInfo')}</h3>
                  {errors.participants && (
                    <p className="text-red-500 text-[18px] mb-4">{errors.participants}</p>
                  )}
                </div>

                {formData.participants.map((participant, index) => (
                  <div key={index} className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-black mb-4">
                      {t('participant')} {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[18px] font-medium text-black mb-2">
                          {t('firstName')} *
                        </label>
                        <input
                          type="text"
                          value={participant.firstName}
                          onChange={(e) => updateParticipant(index, 'firstName', e.target.value)}
                          className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                            errors[`participants.${index}.firstName`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`participants.${index}.firstName`] && (
                          <p className="text-red-500 text-[18px] mt-1">{errors[`participants.${index}.firstName`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[18px] font-medium text-black mb-2">
                          {t('lastName')} *
                        </label>
                        <input
                          type="text"
                          value={participant.lastName}
                          onChange={(e) => updateParticipant(index, 'lastName', e.target.value)}
                          className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                            errors[`participants.${index}.lastName`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`participants.${index}.lastName`] && (
                          <p className="text-red-500 text-[18px] mt-1">{errors[`participants.${index}.lastName`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-[18px] font-medium text-black mb-2">
                        {t('email')} *
                      </label>
                      <input
                        type="email"
                        value={participant.email}
                        onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                          errors[`participants.${index}.email`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`participants.${index}.email`] && (
                        <p className="text-red-500 text-[18px] mt-1">{errors[`participants.${index}.email`]}</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block text-[18px] font-medium text-black mb-2">
                        {t('phoneNumber')} *
                      </label>
                      <PhoneInput
                        country="ge"
                        value={participant.phoneNumber}
                        onChange={(value) => updateParticipant(index, 'phoneNumber', value)}
                        inputClass={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                          errors[`participants.${index}.phoneNumber`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        buttonClass={`${errors[`participants.${index}.phoneNumber`] ? 'border-red-500' : 'border-gray-300'}`}
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
                      {errors[`participants.${index}.phoneNumber`] && (
                        <p className="text-red-500 text-[18px] mt-1">{errors[`participants.${index}.phoneNumber`]}</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block text-[18px] font-medium text-black mb-2">
                        {t('personalId')} *
                      </label>
                      <input
                        type="text"
                        value={participant.personalId}
                        onChange={(e) => updateParticipant(index, 'personalId', e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                          errors[`participants.${index}.personalId`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`participants.${index}.personalId`] && (
                        <p className="text-red-500 text-[18px] mt-1">{errors[`participants.${index}.personalId`]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

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

