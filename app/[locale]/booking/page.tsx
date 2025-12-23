'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

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
  selectedProductIds: string[] // Changed from productId to selectedProductIds array
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
  selectedProductIds: z.array(z.string()).refine((ids) => {
    const validIds = ids.filter(id => id && id !== '')
    return validIds.length > 0
  }, {
    message: 'At least one equipment item is required',
  }),
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
    selectedProductIds: productIdFromUrl ? [productIdFromUrl] : [''],
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

  // Auto-calculate price when products, dates, and number of people change
  useEffect(() => {
    const validProductIds = formData.selectedProductIds.filter(id => id && id !== '')
    if (validProductIds.length > 0 && formData.startDate && formData.endDate && formData.numberOfPeople) {
      const selectedProducts = products.filter((p) => validProductIds.includes(p.id))
      if (selectedProducts.length > 0) {
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
          
          // Calculate total price for all selected products
          const totalProductPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0)
          const calculatedPrice = (totalProductPrice * days * numberOfPeople).toFixed(2)
          setFormData((prev) => ({ ...prev, totalPrice: calculatedPrice }))
        } else {
          setFormData((prev) => ({ ...prev, totalPrice: '' }))
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, totalPrice: '' }))
    }
  }, [formData.selectedProductIds, formData.startDate, formData.endDate, formData.numberOfPeople, products])

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
      
      // Filter out empty strings from product IDs
      const validProductIds = validated.selectedProductIds.filter(id => id && id !== '')
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: validated.firstName,
          lastName: validated.lastName,
          email: validated.email,
          phoneNumber: validated.phoneNumber,
          personalId: validated.personalId,
          productIds: validProductIds,
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
          {t('title')}
        </h1>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-[18px] text-black">
            {t('success')}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Product Dropdowns */}
            <div className="space-y-4">
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('product')} *
              </label>
              {loading ? (
                <div className="text-[18px] text-black">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-[18px] text-gray-500">No products available</div>
              ) : (
                <>
                  {formData.selectedProductIds.map((productId, index) => {
                    // Get all selected product IDs except the current one
                    const otherSelectedIds = formData.selectedProductIds.filter((id, i) => i !== index)
                    
                    return (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-[16px] font-medium text-black mb-2">
                            {t('product')} {index + 1} {index === 0 && '*'}
                          </label>
                          <select
                            value={productId || ''}
                            onChange={(e) => {
                              const newIds = [...formData.selectedProductIds]
                              newIds[index] = e.target.value
                              // Keep at least one empty string for the first dropdown if it's empty
                              const filtered = newIds.filter(Boolean)
                              setFormData({ 
                                ...formData, 
                                selectedProductIds: filtered.length > 0 ? filtered : [''] 
                              })
                            }}
                            className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                              errors.selectedProductIds && index === 0 ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">
                              {index === 0 ? t('selectProduct') : t('selectProductOptional')}
                            </option>
                            {products
                              .filter((product) => !otherSelectedIds.includes(product.id))
                              .map((product) => {
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
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newIds = formData.selectedProductIds.filter((_, i) => i !== index)
                              setFormData({ ...formData, selectedProductIds: newIds })
                            }}
                            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[18px] font-bold transition-colors mb-0"
                            title={t('delete')}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Add Product Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        selectedProductIds: [...formData.selectedProductIds, ''],
                      })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[16px] font-bold transition-colors"
                  >
                    <span className="text-xl">+</span>
                    <span>{t('addProduct')}</span>
                  </button>
                  
                  {errors.selectedProductIds && (
                    <p className="text-red-500 text-[18px] mt-1">{errors.selectedProductIds}</p>
                  )}
                </>
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
                  placeholderText={t('selectStartDate')}
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
                  placeholderText={t('selectEndDate')}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-[18px] mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[18px] font-medium text-black mb-2">
                {t('numberOfPeople')} *
              </label>
              <input
                type="number"
                min="1"
                value={formData.numberOfPeople}
                onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                  errors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('numberOfPeoplePlaceholder')}
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
                  {formData.selectedProductIds.length > 0 && formData.startDate && formData.endDate && formData.numberOfPeople && (
                    <span className="text-gray-600 text-[16px] block mt-1">
                      {(() => {
                        const selectedProducts = products.filter((p) => formData.selectedProductIds.includes(p.id))
                        if (selectedProducts.length > 0 && formData.startDate && formData.endDate && formData.numberOfPeople) {
                          const start = new Date(formData.startDate)
                          const end = new Date(formData.endDate)
                          start.setHours(0, 0, 0, 0)
                          end.setHours(0, 0, 0, 0)
                          const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                          const numberOfPeople = parseInt(formData.numberOfPeople) || 1
                          const totalProductPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0)
                          return `(${selectedProducts.length} ${selectedProducts.length === 1 ? 'product' : 'products'}: ${formatCurrency(totalProductPrice)} × ${days} ${days === 1 ? 'day' : 'days'} × ${numberOfPeople} ${numberOfPeople === 1 ? 'person' : 'people'}) = ${formatCurrency(parseFloat(formData.totalPrice))}`
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
                {submitting ? t('submitting') : t('save')}
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
