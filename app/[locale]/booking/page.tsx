'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Product = {
  id: string
  type: string
  price: number
  size?: string | null
  standard?: boolean | null
  professional?: boolean | null
}

type BookingFormData = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  personalId: string
  productId: string
  numberOfPeople: string
  startDate: Date | null
  endDate: Date | null
  totalPrice: string
}

const bookingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  personalId: z.string().optional(),
  productId: z.string().min(1, 'Equipment is required'),
  numberOfPeople: z.string().min(1, 'Number of people is required'),
  startDate: z.date({ message: 'Start date is required' }).nullable().refine((val) => val !== null, {
    message: 'Start date is required',
  }),
  endDate: z.date({ message: 'End date is required' }).nullable().refine((val) => val !== null, {
    message: 'End date is required',
  }),
  totalPrice: z.string().min(1, 'Price is required'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate
  }
  return true
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const diffTime = data.endDate.getTime() - data.startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 14
  }
  return true
}, {
  message: 'Booking period cannot exceed 2 weeks (14 days)',
  path: ['endDate'],
})

const BookingPage = () => {
  const t = useTranslations('admin.bookings.form')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const productIdFromUrl = searchParams.get('productId')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    personalId: '',
    productId: productIdFromUrl || '',
    numberOfPeople: '',
    startDate: null,
    endDate: null,
    totalPrice: '',
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100', { cache: 'no-store' })
        if (response.ok) {
          const json = await response.json()
          setProducts(json.products || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Auto-calculate price when product, dates, and number of people change
  useEffect(() => {
    if (formData.productId && formData.startDate && formData.endDate && formData.numberOfPeople) {
      const product = products.find((p) => p.id === formData.productId)
      if (product) {
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)
        
        // Set time to midnight to avoid timezone issues
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        
        if (end >= start) {
          // Calculate days including both start and end dates
          const timeDiff = end.getTime() - start.getTime()
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end day
          const numberOfPeople = parseInt(formData.numberOfPeople) || 1
          const calculatedPrice = (product.price * days * numberOfPeople).toFixed(2)
          setFormData((prev) => ({ ...prev, totalPrice: calculatedPrice }))
        } else {
          setFormData((prev) => ({ ...prev, totalPrice: '' }))
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, totalPrice: '' }))
    }
  }, [formData.productId, formData.startDate, formData.endDate, formData.numberOfPeople, products])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale || 'ka-GE', { style: 'currency', currency: 'GEL' }).format(amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    try {
      // Convert dates to ISO strings for validation and submission
      const formDataForValidation = {
        ...formData,
        startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : '',
        endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : '',
      }
      
      const validated = bookingSchema.parse({
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate,
      })
      
      if (!validated.startDate || !validated.endDate) {
        throw new Error('Start date and end date are required')
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: validated.firstName,
          lastName: validated.lastName,
          email: validated.email,
          phoneNumber: validated.phoneNumber,
          personalId: validated.personalId,
          productId: validated.productId,
          numberOfPeople: validated.numberOfPeople,
          startDate: validated.startDate.toISOString(),
          endDate: validated.endDate.toISOString(),
          totalPrice: parseFloat(formData.totalPrice),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create booking')
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
        alert(err instanceof Error ? err.message : 'Failed to create booking')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFAFA] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-black text-center mb-8">
          Booking
        </h1>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-[18px] text-black">
            Booking created successfully! Redirecting...
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('product')} *
              </label>
              {loading ? (
                <div className="text-[18px] text-black">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-[18px] text-gray-500">No products available</div>
              ) : (
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                    errors.productId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">აირჩიეთ აღჭურვილობა</option>
                  {products.map((product) => {
                    let label = product.type.replace(/_/g, ' ')
                    if (product.type === 'ADULT_CLOTH' && product.size) {
                      label += ` (${product.size})`
                    }
                    const badges = []
                    if (product.standard) badges.push('Standard')
                    if (product.professional) badges.push('Professional')
                    if (badges.length > 0) {
                      label += ` [${badges.join(', ')}]`
                    }
                    label += ` - ${formatCurrency(product.price)}`
                    return (
                      <option key={product.id} value={product.id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              )}
              {errors.productId && (
                <p className="text-red-500 text-[18px] mt-1">{errors.productId}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {t('startDate')} *
                </label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date: Date | null) => setFormData({ ...formData, startDate: date })}
                  minDate={new Date()}
                  selectsStart
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholderText="Select start date"
                />
                {errors.startDate && (
                  <p className="text-red-500 text-[18px] mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {t('endDate')} *
                </label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date: Date | null) => setFormData({ ...formData, endDate: date })}
                  minDate={formData.startDate || new Date()}
                  maxDate={formData.startDate ? (() => {
                    const maxDate = new Date(formData.startDate)
                    maxDate.setDate(maxDate.getDate() + 14)
                    return maxDate
                  })() : undefined}
                  selectsEnd
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholderText="Select end date"
                />
                {errors.endDate && (
                  <p className="text-red-500 text-[18px] mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                ადამიანების რაოდენობა *
              </label>
              <input
                type="number"
                min="1"
                value={formData.numberOfPeople}
                onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="მაგ: 2"
              />
              {errors.numberOfPeople && (
                <p className="text-red-500 text-[18px] mt-1">{errors.numberOfPeople}</p>
              )}
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
                {t('phone')} *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-[18px] mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('personalId')}
              </label>
              <input
                type="text"
                value={formData.personalId}
                onChange={(e) => setFormData({ ...formData, personalId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[18px] text-black"
              />
            </div>
            
            {/* Display calculated price */}
            {formData.totalPrice && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-[18px] text-black">
                  <span className="font-semibold">{t('totalPrice')} </span>
                  <span className="text-orange-600 font-bold">{formatCurrency(parseFloat(formData.totalPrice))}</span>
                  {formData.productId && formData.startDate && formData.endDate && formData.numberOfPeople && (
                    <span className="text-gray-600 text-[16px] block mt-1">
                      {(() => {
                        const product = products.find((p) => p.id === formData.productId)
                        if (product && formData.startDate && formData.endDate && formData.numberOfPeople) {
                          const start = new Date(formData.startDate)
                          const end = new Date(formData.endDate)
                          start.setHours(0, 0, 0, 0)
                          end.setHours(0, 0, 0, 0)
                          const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                          const numberOfPeople = parseInt(formData.numberOfPeople) || 1
                          return `${formatCurrency(product.price)} × ${days} ${days === 1 ? 'day' : 'days'} × ${numberOfPeople} ${numberOfPeople === 1 ? 'person' : 'people'} = ${formatCurrency(parseFloat(formData.totalPrice))}`
                        }
                        return ''
                      })()}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg transition-colors text-[18px] font-bold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : t('save')}
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

export default BookingPage
