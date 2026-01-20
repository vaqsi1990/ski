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
  description?: string | null
}

type BookingFormData = {
  firstName: string[]
  lastName: string[]
  email: string[]
  phoneNumber: string[]
  personalId: string[]
  selectedProductIds: string[] // Changed from productId to selectedProductIds array
  numberOfPeople: string
  startDate: Date | null
  endDate: Date | null
  startTime: string
  duration: string
  totalPrice: string
}

const bookingSchema = z.object({
  firstName: z.array(z.string().min(1, 'First name is required')).min(1, 'At least one first name is required'),
  lastName: z.array(z.string().min(1, 'Last name is required')).min(1, 'At least one last name is required'),
  email: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required'),
  phoneNumber: z.array(z.string().min(1, 'Phone number is required')).min(1, 'At least one phone number is required'),
  personalId: z.array(z.string().min(1, 'Personal ID is required')).min(1, 'At least one personal ID is required'),
  selectedProductIds: z.array(z.string()).refine((ids) => {
    const validIds = ids.filter(id => id && id !== '')
    return validIds.length > 0
  }, {
    message: 'At least one equipment item is required',
  }),
  numberOfPeople: z.string().optional(),
  startDate: z.date({ message: 'Start date is required' }).nullable().refine((val) => val !== null, {
    message: 'Start date is required',
  }),
  endDate: z.date({ message: 'End date is required' }).nullable().refine((val) => val !== null, {
    message: 'End date is required',
  }),
  startTime: z.string().optional(),
  duration: z.string().optional(),
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
    // Normalize dates to compare only the date part (ignore time)
    const startDateOnly = new Date(data.startDate.getFullYear(), data.startDate.getMonth(), data.startDate.getDate())
    const endDateOnly = new Date(data.endDate.getFullYear(), data.endDate.getMonth(), data.endDate.getDate())
    
    // Calculate days including both start and end dates (same-day = 1 day)
    const diffTime = endDateOnly.getTime() - startDateOnly.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays <= 14
  }
  return true
}, {
  message: 'Booking period cannot exceed 2 weeks (14 days)',
  path: ['endDate'],
})

const BookingPage = () => {
  const t = useTranslations('admin.bookings.form')
  const tLessons = useTranslations('lessons')
  const tEquipment = useTranslations('admin.equipment.types')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const productIdFromUrl = searchParams.get('productId')
  const typeFromUrl = searchParams.get('type')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [bookingInfo, setBookingInfo] = useState<{
    products: Product[]
    startDate: Date | null
    endDate: Date | null
    totalPrice: string
    startTime?: string
    duration?: string
    numberOfPeople?: string
    emails?: string[]
  } | null>(null)

  const [formData, setFormData] = useState<BookingFormData>({
    firstName: [''],
    lastName: [''],
    email: [''],
    phoneNumber: [''],
    personalId: [''],
    selectedProductIds: productIdFromUrl ? [productIdFromUrl] : [''],
    numberOfPeople: '',
    startDate: null,
    endDate: null,
    startTime: '',
    duration: '',
    totalPrice: '',
  })

  // Generate time slots from 10:00 to 15:00 (last slot starts at 15:00)
  const timeSlots: string[] = []
  for (let hour = 10; hour <= 15; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

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

  // Sync contact info arrays with selected products count
  useEffect(() => {
    // Use the length of selectedProductIds (including empty strings) to match number of dropdowns
    const productCount = formData.selectedProductIds.length || 1
    
    // Ensure arrays match product count
    if (formData.firstName.length !== productCount) {
      const newArrays = {
        firstName: Array(productCount).fill('').map((_, i) => formData.firstName[i] || ''),
        lastName: Array(productCount).fill('').map((_, i) => formData.lastName[i] || ''),
        email: Array(productCount).fill('').map((_, i) => formData.email[i] || ''),
        phoneNumber: Array(productCount).fill('').map((_, i) => formData.phoneNumber[i] || ''),
        personalId: Array(productCount).fill('').map((_, i) => formData.personalId[i] || ''),
      }
      setFormData((prev) => ({ ...prev, ...newArrays }))
    }
  }, [formData.selectedProductIds])

  // Auto-set numberOfPeople and duration for vehicles based on selected product type
  useEffect(() => {
    const validProductIds = formData.selectedProductIds.filter(id => id && id !== '')
    if (validProductIds.length > 0 && (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD')) {
      const selectedProducts = products.filter((p) => validProductIds.includes(p.id))
      if (selectedProducts.length > 0) {
        // Get the first selected product (for vehicles, usually only one is selected)
        const product = selectedProducts[0]
        let peopleCount = ''
        
        // Set numberOfPeople based on vehicle type
        if (product.type === 'QUAD_BIKE' || product.type === 'BURAN') {
          // Fixed at 1 person
          peopleCount = '1'
        } else if (product.type === 'BAG' || product.type === 'WRANGLER_JEEP') {
          // Default to 3, but user can change (max 3)
          if (!formData.numberOfPeople || parseInt(formData.numberOfPeople) > 3) {
            peopleCount = '3'
          }
        }
        
        // Set duration to 1 hour for all vehicles
        const updates: Partial<BookingFormData> = {}
        if (formData.duration !== '1') {
          updates.duration = '1'
        }
        if (peopleCount && formData.numberOfPeople !== peopleCount) {
          updates.numberOfPeople = peopleCount
        }
        
        if (Object.keys(updates).length > 0) {
          setFormData((prev) => ({ ...prev, ...updates }))
        }
      }
    }
  }, [formData.selectedProductIds, products, typeFromUrl, formData.duration, formData.numberOfPeople])

  // Auto-calculate price when products, dates, and number of people change
  useEffect(() => {
    const validProductIds = formData.selectedProductIds.filter(id => id && id !== '')
    if (validProductIds.length > 0 && formData.startDate && formData.endDate) {
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
          
          // Check if any selected product is a vehicle
          const isVehicle = selectedProducts.some(p => 
            ['QUAD_BIKE', 'BAG', 'BURAN', 'WRANGLER_JEEP'].includes(p.type)
          )
          
          // For vehicles, numberOfPeople is required. For other products, default to 1 if not set
          const numberOfPeople = isVehicle 
            ? (parseInt(formData.numberOfPeople) || 1)
            : (parseInt(formData.numberOfPeople) || 1)
          
          // Calculate total price for all selected products
          const totalProductPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0)
          
          // For vehicles, price is per vehicle per day (not multiplied by numberOfPeople)
          // For other products, multiply by numberOfPeople
          const calculatedPrice = isVehicle 
            ? (totalProductPrice * days).toFixed(2)
            : (totalProductPrice * days * numberOfPeople).toFixed(2)
          
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
    setSubmitting(true)

    try {
      // For vehicles (VEHICLES or SNOWBOARD type), startTime and numberOfPeople are required
      // Duration is fixed at 1 hour
      if (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') {
        if (!formData.startTime) {
          setErrors({ startTime: 'Start time is required' })
          return
        }
        if (!formData.numberOfPeople) {
          setErrors({ numberOfPeople: 'Number of people is required' })
          return
        }
        // Validate startTime format
        const [hour] = formData.startTime.split(':').map(Number)
        if (hour < 10 || hour > 15) {
          setErrors({ startTime: 'Start time must be between 10:00 and 15:00' })
          return
        }
        // Set duration to 1 hour if not already set
        if (formData.duration !== '1') {
          setFormData((prev) => ({ ...prev, duration: '1' }))
        }
      }
      
      const validated = bookingSchema.parse({
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') ? formData.startTime : '',
        duration: (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') ? formData.duration : '',
      })
      
      if (!validated.startDate || !validated.endDate) {
        throw new Error('Start date and end date are required')
      }
      
      // Filter out empty strings from product IDs
      const validProductIds = validated.selectedProductIds.filter(id => id && id !== '')
      
      // Validate that contact info arrays match product count
      if (validated.firstName.length !== validProductIds.length ||
          validated.lastName.length !== validProductIds.length ||
          validated.email.length !== validProductIds.length ||
          validated.phoneNumber.length !== validProductIds.length ||
          validated.personalId.length !== validProductIds.length) {
        throw new Error('Contact information count must match number of selected products')
      }

      // For each product, create a booking with corresponding contact info
      const bookings = validProductIds.map((productId, index) => ({
        firstName: validated.firstName[index] || '',
        lastName: validated.lastName[index] || '',
        email: validated.email[index] || '',
        phoneNumber: validated.phoneNumber[index] || '',
        personalId: validated.personalId[index] || '',
        productIds: [productId],
        numberOfPeople: validated.numberOfPeople || '1',
        startDate: validated.startDate!.toISOString(),
        endDate: validated.endDate!.toISOString(),
        startTime: validated.startTime || '',
        duration: validated.duration || '',
        totalPrice: (() => {
          const selectedProduct = products.find(p => p.id === productId)
          if (!selectedProduct) return 0
          const start = new Date(validated.startDate!)
          const end = new Date(validated.endDate!)
          start.setHours(0, 0, 0, 0)
          end.setHours(0, 0, 0, 0)
          const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          const numberOfPeople = parseInt(validated.numberOfPeople || '1') || 1
          const isVehicle = ['QUAD_BIKE', 'BAG', 'BURAN', 'WRANGLER_JEEP'].includes(selectedProduct.type)
          return isVehicle 
            ? selectedProduct.price * days
            : selectedProduct.price * days * numberOfPeople
        })(),
      }))

      // Create all bookings
      const responses = await Promise.all(
        bookings.map(booking => 
          fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking),
          })
        )
      )

      const response = responses[0]

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create booking')
      }

      // Store booking info for popup
      const selectedProducts = products.filter((p) => validProductIds.includes(p.id))
      setBookingInfo({
        products: selectedProducts,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalPrice: formData.totalPrice,
        startTime: (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') ? formData.startTime : undefined,
        duration: (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') ? formData.duration : undefined,
        numberOfPeople: (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') ? formData.numberOfPeople : undefined,
        emails: validated.email.filter(email => email && email.trim() !== ''),
      })
      
      setSuccess(true)
      setShowSuccessPopup(true)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        err.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            // Handle array fields (e.g., firstName[0], email[1])
            if (Array.isArray(issue.path) && issue.path.length > 1) {
              const fieldName = `${String(issue.path[0])}.${String(issue.path[1])}`
              newErrors[fieldName] = issue.message
            } else if (issue.path[0]) {
              newErrors[String(issue.path[0])] = issue.message
            }
          }
        })
        setErrors(newErrors)
      } else {
        alert(err instanceof Error ? err.message : 'Failed to create booking')
      }
    } finally {
      setSubmitting(false)
    }
  }


  const getPageTitle2 = () => {
    if (typeFromUrl === 'SKI') {
      return tEquipment('SKI') + ' / ' + tEquipment('SNOWBOARD')
    } else if (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') {
      return tEquipment('VEHICLES')
    } else if (typeFromUrl === 'ACCESSORY') {
      return tEquipment('ACCESSORY')
    } else if (typeFromUrl === 'ADULT_CLOTH') {
      return tEquipment('ADULT_CLOTH')
    } else if (typeFromUrl === 'CHILD_CLOTH') {
      return tEquipment('CHILD_CLOTH')
    } else if (typeFromUrl === 'ADULT_SKI_SET') {
      return tEquipment('ADULT_SKI_SET')
    } else if (typeFromUrl === 'CHILD_SKI_SET') {
      return tEquipment('CHILD_SKI_SET')
    } else if (typeFromUrl === 'ADULT_SNOWBOARD_SET') {
      return tEquipment('ADULT_SNOWBOARD_SET')
    } else if (typeFromUrl === 'CHILD_SNOWBOARD_SET') {
      return tEquipment('CHILD_SNOWBOARD_SET')
    } else {
      return t('title')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFAFA] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-black text-center mb-8">
         Booking
        </h1>

        {/* Success Popup Modal */}
        {showSuccessPopup && bookingInfo && (
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
                          <span className="font-semibold text-black">{t('equipment')}: </span>
                          <span className="text-black">
                            {bookingInfo.products.map((p, idx) => {
                              const typeLabel = tEquipment(p.type) || p.type.replace(/_/g, ' ')
                              let label = typeLabel
                              if (p.description) label += ` (${p.description})`
                              if (p.type === 'ADULT_CLOTH' && p.size) label += ` - ${p.size}`
                              const badges = []
                              if (p.standard) badges.push('Standard')
                              if (p.professional) badges.push('Professional')
                              if (badges.length > 0) label += ` [${badges.join(', ')}]`
                              return (
                                <span key={p.id}>
                                  {idx > 0 && ', '}
                                  {label}
                                </span>
                              )
                            })}
                          </span>
                        </div>
                        
                        {bookingInfo.startDate && bookingInfo.endDate && (
                          <div>
                            <span className="font-semibold text-black">{t('dates')}: </span>
                            <span className="text-black">
                              {bookingInfo.startDate.toLocaleDateString(locale || 'ka-GE')} - {bookingInfo.endDate.toLocaleDateString(locale || 'ka-GE')}
                            </span>
                          </div>
                        )}
                        
                        {bookingInfo.startTime && (
                          <div>
                            <span className="font-semibold text-black">{tLessons('startTime')}: </span>
                            <span className="text-black">
                              {bookingInfo.startTime}
                            </span>
                          </div>
                        )}
                        
                        {bookingInfo.duration && (
                          <div>
                            <span className="font-semibold text-black">{tLessons('duration')}: </span>
                            <span className="text-black">
                              {bookingInfo.duration} {parseInt(bookingInfo.duration) === 1 ? tLessons('hour') : tLessons('hours')}
                            </span>
                          </div>
                        )}
                        
                        {bookingInfo.numberOfPeople && (
                          <div>
                            <span className="font-semibold text-black">{t('numberOfPeople')}: </span>
                            <span className="text-black">
                              {bookingInfo.numberOfPeople} {parseInt(bookingInfo.numberOfPeople) === 1 ? tLessons('person') : tLessons('people')}
                            </span>
                          </div>
                        )}
                        
                        {bookingInfo.totalPrice && (
                          <div>
                            <span className="font-semibold text-black">{t('totalPrice')}: </span>
                            <span className="text-orange-600 font-bold text-[18px]">
                              {formatCurrency(parseFloat(bookingInfo.totalPrice))}
                            </span>
                          </div>
                        )}
                        
                        {bookingInfo.emails && bookingInfo.emails.length > 0 && (
                          <div>
                            <span className="font-semibold text-black">{t('email')}: </span>
                            <span className="text-black">
                              {bookingInfo.emails.join(', ')}
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
            {/* Dynamic Product Dropdowns */}
            <div className="space-y-4">
             
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
                          {getPageTitle2()} {index + 1} {index === 0 && '*'}
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
                              .filter((product) => {
                                // Filter by type if typeFromUrl is provided
                                if (typeFromUrl) {
                                  // If type is SKI, show SKI, SNOWBOARD, boots and all related sets
                                  if (typeFromUrl === 'SKI') {
                                    const allowedTypes = [
                                      'SKI',
                                      'SNOWBOARD',
                                      'SKI_BOOTS',
                                      'SNOWBOARD_BOOTS',
                                      'ADULT_SKI_SET',
                                      'CHILD_SKI_SET',
                                      'ADULT_SNOWBOARD_SET',
                                      'CHILD_SNOWBOARD_SET'
                                    ]
                                    if (!allowedTypes.includes(product.type)) {
                                      return false
                                    }
                                  } else if (typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') {
                                    // If type is VEHICLES or SNOWBOARD, show only vehicles/technique
                                    const allowedTypes = [
                                      'QUAD_BIKE',
                                      'BAG',
                                      'BURAN',
                                      'WRANGLER_JEEP'
                                    ]
                                    if (!allowedTypes.includes(product.type)) {
                                      return false
                                    }
                                  } else if (typeFromUrl === 'ACCESSORY') {
                                    // If type is ACCESSORY, show ACCESSORY and Clothes (ADULT_CLOTH, CHILD_CLOTH)
                                    const allowedTypes = [
                                      'ACCESSORY',
                                      'ADULT_CLOTH',
                                      'CHILD_CLOTH'
                                    ]
                                    if (!allowedTypes.includes(product.type)) {
                                      return false
                                    }
                                  } else {
                                    // For other types, filter normally
                                    if (product.type !== typeFromUrl) {
                                      return false
                                    }
                                  }
                                }
                                // Exclude already selected products
                                return !otherSelectedIds.includes(product.id)
                              })
                              .sort((a, b) => {
                                // Sort products for SKI page: sets first, then skis/boards/boots
                                const typeOrder: Record<string, number> = {
                                  'ADULT_SKI_SET': 1,
                                  'CHILD_SKI_SET': 2,
                                  'ADULT_SNOWBOARD_SET': 3,
                                  'CHILD_SNOWBOARD_SET': 4,
                                  'SKI': 5,
                                  'SNOWBOARD': 6,
                                  'SKI_BOOTS': 7,
                                  'SNOWBOARD_BOOTS': 8,
                                }
                                const orderA = typeOrder[a.type] || 99
                                const orderB = typeOrder[b.type] || 99
                                if (orderA !== orderB) {
                                  return orderA - orderB
                                }
                                // If same type, sort by price (lower first)
                                return a.price - b.price
                              })
                              .map((product) => {
                                // Get translated type name
                                const typeLabel = tEquipment(product.type) || product.type.replace(/_/g, ' ')
                                
                                // Build label: Type (Description) - Price
                                let label = typeLabel
                                
                                // Add description if available
                                if (product.description) {
                                  label += ` (${product.description})`
                                }
                                
                                // Add size for ADULT_CLOTH
                                if (product.type === 'ADULT_CLOTH' && product.size) {
                                  label += ` - ${product.size}`
                                }
                                
                                // Add badges for standard/professional
                                const badges = []
                                if (product.standard) badges.push('Standard')
                                if (product.professional) badges.push('Professional')
                                if (badges.length > 0) {
                                  label += ` [${badges.join(', ')}]`
                                }
                                
                                // Add price at the end
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
                      const newProductIds = [...formData.selectedProductIds, '']
                      const newCount = newProductIds.length
                      setFormData({
                        ...formData,
                        selectedProductIds: newProductIds,
                        // Immediately sync contact info arrays
                        firstName: Array(newCount).fill('').map((_, i) => formData.firstName[i] || ''),
                        lastName: Array(newCount).fill('').map((_, i) => formData.lastName[i] || ''),
                        email: Array(newCount).fill('').map((_, i) => formData.email[i] || ''),
                        phoneNumber: Array(newCount).fill('').map((_, i) => formData.phoneNumber[i] || ''),
                        personalId: Array(newCount).fill('').map((_, i) => formData.personalId[i] || ''),
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

            {/* Start Time - Only for vehicles (VEHICLES or SNOWBOARD type) */}
            {(typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') && (
              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {tLessons('startTime')} * ({tLessons('timeRange')})
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{tLessons('selectTime')}</option>
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
            )}

            {/* Duration - Only for vehicles (VEHICLES or SNOWBOARD type) - Fixed at 1 hour */}
            {(typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') && (
              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {tLessons('duration')} *
                </label>
                <input
                  type="text"
                  value={`1 ${tLessons('hour')}`}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[18px] text-black bg-gray-100 cursor-not-allowed"
                />
              </div>
            )}

            {/* Number of People - Only for vehicles (VEHICLES or SNOWBOARD type), not for SKI or SNOWBOARD equipment */}
            {(typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD') && (
              <div>
                <label className="block text-[18px] font-medium text-black mb-2">
                  {t('numberOfPeople')} *
                </label>
                {(() => {
                  const validProductIds = formData.selectedProductIds.filter(id => id && id !== '')
                  const selectedProducts = products.filter((p) => validProductIds.includes(p.id))
                  const isVehicle = selectedProducts.some(p => 
                    ['QUAD_BIKE', 'BAG', 'BURAN', 'WRANGLER_JEEP'].includes(p.type)
                  )
                  const isVehiclePage = typeFromUrl === 'VEHICLES' || typeFromUrl === 'SNOWBOARD'
                  
                  // Check if it's a fixed 1-person vehicle
                  const isFixedOnePerson = selectedProducts.some(p => 
                    ['QUAD_BIKE', 'BURAN'].includes(p.type)
                  )
                  
                  // Check if it's a max 3-person vehicle
                  const isMaxThreePerson = selectedProducts.some(p => 
                    ['BAG', 'WRANGLER_JEEP'].includes(p.type)
                  )
                  
                  return (
                    <input
                      type="number"
                      min="1"
                      max={isVehiclePage && isMaxThreePerson ? 3 : undefined}
                      value={formData.numberOfPeople}
                      onChange={(e) => {
                        const value = e.target.value
                        // For max 3-person vehicles, limit to 3
                        if (isVehiclePage && isMaxThreePerson && value && parseInt(value) > 3) {
                          return // Don't update if value exceeds 3
                        }
                        // For fixed 1-person vehicles, don't allow changes
                        if (!isVehiclePage || !isVehicle || !isFixedOnePerson) {
                          setFormData({ ...formData, numberOfPeople: value })
                        }
                      }}
                      readOnly={isVehiclePage && isFixedOnePerson}
                      className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                        errors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
                      } ${isVehiclePage && isFixedOnePerson ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder={t('numberOfPeoplePlaceholder')}
                    />
                  )
                })()}
                {errors.numberOfPeople && (
                  <p className="text-red-500 text-[18px] mt-1">{errors.numberOfPeople}</p>
                )}
              </div>
            )}

            {/* Contact Information - Dynamic based on number of products */}
            {formData.selectedProductIds.map((productId, index) => {
              const selectedProduct = productId ? products.find(p => p.id === productId) : null
              const productLabel = selectedProduct 
                ? `${tEquipment(selectedProduct.type)}${selectedProduct.description ? ` (${selectedProduct.description})` : ''}`
                : ` ${index + 1}`
              
              return (
                <div key={index} className="border-t pt-6 mt-6">
                  <h3 className="text-xl font-bold text-black mb-4">
                    {tLessons('contactInfo')} - {productLabel}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[18px] font-medium text-black mb-2">
                        {t('firstName')} *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName[index] || ''}
                        onChange={(e) => {
                          const newArray = [...formData.firstName]
                          newArray[index] = e.target.value
                          setFormData({ ...formData, firstName: newArray })
                        }}
                        className={`w-full border rounded-lg px-4 py-3 text-[18px] focus:ring-1 focus:ring-red-500 text-black ${
                          errors[`firstName.${index}`] ? 'border-red-500' : 'border-gray-300'
                        } focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500`}
                      />
                      {errors[`firstName.${index}`] && (
                        <p className="text-red-500 text-[18px] mt-1">{errors[`firstName.${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[18px] font-medium text-black mb-2">
                        {t('lastName')} *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName[index] || ''}
                        onChange={(e) => {
                          const newArray = [...formData.lastName]
                          newArray[index] = e.target.value
                          setFormData({ ...formData, lastName: newArray })
                        }}
                        className={`w-full border rounded-lg px-4 py-3 text-[18px] focus:ring-1 focus:ring-red-500 text-black ${
                          errors[`lastName.${index}`] ? 'border-red-500' : 'border-gray-300'
                        } focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500`}
                      />
                      {errors[`lastName.${index}`] && (
                        <p className="text-red-500 text-[18px] mt-1">{errors[`lastName.${index}`]}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[18px] font-medium text-black mb-2">
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      value={formData.email[index] || ''}
                      onChange={(e) => {
                        const newArray = [...formData.email]
                        newArray[index] = e.target.value
                        setFormData({ ...formData, email: newArray })
                      }}
                      className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                        errors[`email.${index}`] ? 'border-red-500' : 'border-gray-300'
                      } focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500`}
                    />
                    {errors[`email.${index}`] && (
                      <p className="text-red-500 text-[18px] mt-1">{errors[`email.${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[18px] font-medium text-black mb-2">
                      {t('phone')} *
                    </label>
                    <PhoneInput
                      country="ge"
                      value={formData.phoneNumber[index] || ''}
                      onChange={(value) => {
                        const newArray = [...formData.phoneNumber]
                        newArray[index] = value
                        setFormData({ ...formData, phoneNumber: newArray })
                      }}
                      inputClass={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                        errors[`phoneNumber.${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      buttonClass={`${errors[`phoneNumber.${index}`] ? 'border-red-500' : 'border-gray-300'}`}
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
                    {errors[`phoneNumber.${index}`] && (
                      <p className="text-red-500 text-[18px] mt-1">{errors[`phoneNumber.${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[18px] font-medium text-black mb-2">
                      {t('personalId')} *
                    </label>
                    <input
                      type="text"
                      value={formData.personalId[index] || ''}
                      onChange={(e) => {
                        const newArray = [...formData.personalId]
                        newArray[index] = e.target.value
                        setFormData({ ...formData, personalId: newArray })
                      }}
                      className={`w-full border rounded-lg px-4 py-3 text-[18px] text-black ${
                        errors[`personalId.${index}`] ? 'border-red-500' : 'border-gray-300'
                      } focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500`}
                    />
                    {errors[`personalId.${index}`] && (
                      <p className="text-red-500 text-[18px] mt-1">{errors[`personalId.${index}`]}</p>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* Display calculated price */}
            {formData.totalPrice && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-[18px] text-black">
                  <span className="font-semibold">{t('totalPrice')}: </span>
                  <span className="text-orange-600 font-bold">{formatCurrency(parseFloat(formData.totalPrice))}</span>
                  {formData.selectedProductIds.length > 0 && formData.startDate && formData.endDate && (
                    <span className="text-gray-600 text-[16px] block mt-1">
                      {(() => {
                        const validProductIds = formData.selectedProductIds.filter(id => id && id !== '')
                        const selectedProducts = products.filter((p) => validProductIds.includes(p.id))
                        if (selectedProducts.length > 0 && formData.startDate && formData.endDate) {
                          const start = new Date(formData.startDate)
                          const end = new Date(formData.endDate)
                          start.setHours(0, 0, 0, 0)
                          end.setHours(0, 0, 0, 0)
                          const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                          const numberOfPeople = parseInt(formData.numberOfPeople) || 1
                          const totalProductPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0)
                          const isVehicle = selectedProducts.some(p => 
                            ['QUAD_BIKE', 'BAG', 'BURAN', 'WRANGLER_JEEP'].includes(p.type)
                          )
                          if (isVehicle) {
                            return `(${selectedProducts.length} ${selectedProducts.length === 1 ? 'product' : 'products'}: ${formatCurrency(totalProductPrice)} × ${days} ${days === 1 ? 'day' : 'days'}) = ${formatCurrency(parseFloat(formData.totalPrice))}`
                          } else {
                            return `(${selectedProducts.length} ${selectedProducts.length === 1 ? 'product' : 'products'}: ${formatCurrency(totalProductPrice)} × ${days} ${days === 1 ? 'day' : 'days'} × ${numberOfPeople} ${numberOfPeople === 1 ? 'person' : 'people'}) = ${formatCurrency(parseFloat(formData.totalPrice))}`
                          }
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
