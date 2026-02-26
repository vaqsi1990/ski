'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BookingStatus, ProductSize, LessonStatus, LessonLevel, LessonLanguage, LessonType } from '@/app/generated/prisma/enums'
import { ProductType } from '@/app/generated/prisma/enums'
import { z } from 'zod'

// Types
type AdminStats = {
  totalBookings: number
  activeRentals: number
  totalRevenue: number
  totalProducts: number
  todayGuests?: number
  tomorrowGuests?: number
}

type AdminBooking = {
  id: string
  customer: string
  email?: string
  equipment: string
  startDate: string
  endDate: string
  status: string
}

type AdminOverview = {
  stats: AdminStats
  bookings: AdminBooking[]
}

type Booking = {
  id: string
  customer: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  personalId: string
  equipment: string
  productId?: string
  productIds?: string[]
  startDate: string
  endDate: string
  status: string
  totalPrice: number
  createdAt: string
  updatedAt: string
  type?: string
}

type Product = {
  id: string
  type: string
  price: number
  size?: string | null
  standard?: boolean
  professional?: boolean
  description?: string | null
  bookingsCount: number
  createdAt: string
  updatedAt: string
}

type Customer = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  personalId: string
  bookingsCount: number
  totalSpent: number
  lastBooking: string | null
}

type Teacher = {
  id: string
  firstname: string
  lastname: string
  lessonsCount?: number
  createdAt?: string
  updatedAt?: string
}

type Lesson = {
  id: string
  customer: string
  teacherId?: string | null
  teacher?: { id: string; firstname: string; lastname: string } | null
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  personalId: string
  numberOfPeople: number
  duration: number
  level: string
  lessonType: string
  date: string | null
  startTime: string
  language: string
  status: string
  totalPrice: number
  createdAt: string
  updatedAt: string
}

type ReportData = {
  revenue: { total: number; confirmed: number }
  bookings: {
    total: number
    byStatus: Array<{ status: string; count: number }>
    byMonth: Array<{ month: string; count: number }>
  }
  topProducts: Array<{
    id: string
    type: string
    price: number
    size?: string | null
    bookingsCount: number
  }>
}

type BookingFormData = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  personalId: string
  productId: string
  startDate: string
  endDate: string
  totalPrice: string
  status: BookingStatus
}

type EquipmentFormData = {
  type: ProductType
  price: string
  size?: ProductSize | null
  standard?: boolean
  professional?: boolean
  description?: string
}

// Constants
const INITIAL_BOOKING_FORM: BookingFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  personalId: '',
  productId: '',
  startDate: '',
  endDate: '',
  totalPrice: '',
  status: BookingStatus.PENDING,
}

const INITIAL_EQUIPMENT_FORM: EquipmentFormData = {
  type: ProductType.SKI,
  price: '',
  size: null,
  standard: false,
  professional: false,
  description: '',
}

// Zod schemas
const bookingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  personalId: z.string().min(1, 'Personal ID is required'),
  productId: z.string().min(1, 'Equipment is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalPrice: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be a positive number'),
  status: z.nativeEnum(BookingStatus),
})

const equipmentSchema = z.object({
  type: z.nativeEnum(ProductType),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be a positive number'),
  size: z.nativeEnum(ProductSize).nullable().optional(),
  standard: z.boolean().optional(),
  professional: z.boolean().optional(),
  description: z.string().optional(),
}).refine((data) => {
  const sizeRequiringTypes: ProductType[] = [ProductType.ADULT_CLOTH]
  if (sizeRequiringTypes.includes(data.type) && !data.size) {
    return false
  }
  return true
}, {
  message: 'Size is required for this product type',
  path: ['size'],
})

const AdminPage = () => {
  const t = useTranslations('admin')
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<AdminOverview | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsFilter, setBookingsFilter] = useState<string>('all')
  const [bookingsDateFrom, setBookingsDateFrom] = useState<string>('')
  const [bookingsDateTo, setBookingsDateTo] = useState<string>('')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [submittingBooking, setSubmittingBooking] = useState(false)

  // Equipment state
  const [equipment, setEquipment] = useState<Product[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all')
  const [showEquipmentForm, setShowEquipmentForm] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Product | null>(null)
  const [submittingEquipment, setSubmittingEquipment] = useState(false)

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)

  // Form state
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>(INITIAL_BOOKING_FORM)
  const [bookingFormErrors, setBookingFormErrors] = useState<Record<string, string>>({})
  const [equipmentFormData, setEquipmentFormData] = useState<EquipmentFormData>(INITIAL_EQUIPMENT_FORM)
  const [equipmentFormErrors, setEquipmentFormErrors] = useState<Record<string, string>>({})
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])

  // Reports state
  const [reports, setReports] = useState<ReportData | null>(null)
  const [reportsLoading, setReportsLoading] = useState(false)

  // Guests calendar state (stumrების რაოდენობა კალენდრის მიხედვით)
  const [guestsCalendarDates, setGuestsCalendarDates] = useState<Record<string, number> | null>(null)
  const [guestsCalendarLoading, setGuestsCalendarLoading] = useState(false)
  const [guestsCalendarYear, setGuestsCalendarYear] = useState(() => new Date().getFullYear())
  const [guestsCalendarMonth, setGuestsCalendarMonth] = useState(() => new Date().getMonth() + 1)
  const [guestsCalendarDateFrom, setGuestsCalendarDateFrom] = useState('')
  const [guestsCalendarDateTo, setGuestsCalendarDateTo] = useState('')

  // Lesson Pricing state
  const [lessonPricing, setLessonPricing] = useState<Array<{ id: string; numberOfPeople: number; duration: number; price: number }>>([])
  const [lessonPricingLoading, setLessonPricingLoading] = useState(false)
  const [showLessonPricingForm, setShowLessonPricingForm] = useState(false)
  const [editingLessonPricing, setEditingLessonPricing] = useState<{ id: string; numberOfPeople: number; duration: number; price: number } | null>(null)
  const [lessonPricingFormData, setLessonPricingFormData] = useState({ numberOfPeople: '', duration: '', price: '' })
  const [lessonPricingFormErrors, setLessonPricingFormErrors] = useState<Record<string, string>>({})

  // Prices state
  const [prices, setPrices] = useState<Array<{ id: string; itemKey: string; type: string; includes: string; price: string }>>([])
  const [pricesLoading, setPricesLoading] = useState(false)
  const [submittingPrices, setSubmittingPrices] = useState(false)
  const [editingPrices, setEditingPrices] = useState<Record<string, { type: string; includes: string; price: string }>>({})

  // Selection state (მონიშვნა)
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set())
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set())

  // Lessons state
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonsFilter, setLessonsFilter] = useState<string>('all')
  const [lessonsDateFrom, setLessonsDateFrom] = useState<string>('')
  const [lessonsDateTo, setLessonsDateTo] = useState<string>('')

  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [showTeacherForm, setShowTeacherForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [teacherFormData, setTeacherFormData] = useState({ firstname: '', lastname: '' })
  const [teacherFormErrors, setTeacherFormErrors] = useState<Record<string, string>>({})

  // Helper functions
  const showError = useCallback((message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }, [])

  const showSuccess = useCallback((message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }, [])

  const resetBookingForm = useCallback(() => {
    setBookingFormData(INITIAL_BOOKING_FORM)
    setBookingFormErrors({})
    setEditingBooking(null)
  }, [])

  const resetEquipmentForm = useCallback(() => {
    setEquipmentFormData(INITIAL_EQUIPMENT_FORM)
    setEquipmentFormErrors({})
    setEditingEquipment(null)
  }, [])

  // Auto-calculate price when product and dates change
  useEffect(() => {
    if (bookingFormData.productId && bookingFormData.startDate && bookingFormData.endDate) {
      const product = availableProducts.find((p) => p.id === bookingFormData.productId)
      if (product) {
        const start = new Date(bookingFormData.startDate)
        const end = new Date(bookingFormData.endDate)
        if (end > start) {
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          const calculatedPrice = (product.price * days).toFixed(2)
          setBookingFormData((prev) => ({ ...prev, totalPrice: calculatedPrice }))
        }
      }
    }
  }, [bookingFormData.productId, bookingFormData.startDate, bookingFormData.endDate, availableProducts])

  // Fetch dashboard data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const fetchData = async () => {
        try {
          setDashboardLoading(true)
          const response = await fetch('/api/admin/overview', { cache: 'no-store' })
          if (!response.ok) throw new Error('Failed to load admin data')
          const json = await response.json()
          setDashboardData(json)
        } catch (err) {
          console.error(err)
          showError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        } finally {
          setDashboardLoading(false)
        }
      }
      fetchData()
    }
  }, [activeTab, showError])

  // Fetch available products for booking form
  useEffect(() => {
    if (showBookingForm) {
      const fetchProducts = async () => {
        try {
          const response = await fetch('/api/admin/equipment?limit=100', { cache: 'no-store' })
          if (response.ok) {
            const json = await response.json()
            setAvailableProducts(json.products || [])
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchProducts()
    }
  }, [showBookingForm])

  // Fetch bookings
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings()
    }
  }, [activeTab, bookingsFilter, bookingsDateFrom, bookingsDateTo])

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const params = new URLSearchParams()
      if (bookingsFilter !== 'all') params.set('status', bookingsFilter)
      if (bookingsDateFrom) params.set('dateFrom', bookingsDateFrom)
      if (bookingsDateTo) params.set('dateTo', bookingsDateTo)
      const qs = params.toString()
      const url = `/api/admin/bookings${qs ? `?${qs}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load bookings')
      const json = await response.json()
      setBookings(json.bookings || [])
    } catch (err) {
      console.error(err)
      showError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setBookingsLoading(false)
    }
  }, [bookingsFilter, bookingsDateFrom, bookingsDateTo, showError])

  // Fetch equipment
  useEffect(() => {
    if (activeTab === 'equipment') {
      fetchEquipment()
    }
  }, [activeTab, equipmentFilter])

  const fetchEquipment = useCallback(async () => {
    setEquipmentLoading(true)
    try {
      const url = `/api/admin/equipment${equipmentFilter !== 'all' ? `?type=${equipmentFilter}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load equipment')
      const json = await response.json()
      setEquipment(json.products || [])
    } catch (err) {
      console.error(err)
      showError(err instanceof Error ? err.message : 'Failed to load equipment')
    } finally {
      setEquipmentLoading(false)
    }
  }, [equipmentFilter, showError])

  // Fetch customers
  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers()
    }
  }, [activeTab])

  const fetchCustomers = async () => {
    setCustomersLoading(true)
    try {
      const response = await fetch('/api/admin/customers', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load customers')
      const json = await response.json()
      setCustomers(json.customers || [])
    } catch (err) {
      console.error(err)
    } finally {
      setCustomersLoading(false)
    }
  }

  // Fetch reports
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports()
    }
  }, [activeTab])

  // Fetch lessons
  const fetchLessons = useCallback(async () => {
    setLessonsLoading(true)
    try {
      const params = new URLSearchParams()
      if (lessonsFilter !== 'all') params.set('status', lessonsFilter)
      if (lessonsDateFrom) params.set('dateFrom', lessonsDateFrom)
      if (lessonsDateTo) params.set('dateTo', lessonsDateTo)
      const qs = params.toString()
      const url = `/api/admin/lessons${qs ? `?${qs}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load lessons' }))
        throw new Error(errorData.message || 'Failed to load lessons')
      }
      const json = await response.json()
      setLessons(json.lessons || [])
    } catch (err) {
      console.error('Error fetching lessons:', err)
      showError(err instanceof Error ? err.message : 'Failed to load lessons')
    } finally {
      setLessonsLoading(false)
    }
  }, [lessonsFilter, lessonsDateFrom, lessonsDateTo, showError])

  useEffect(() => {
    if (activeTab === 'lessons') {
      fetchLessons()
    }
  }, [activeTab, lessonsFilter, lessonsDateFrom, lessonsDateTo, fetchLessons])

  // Bookings sorted by start date descending (newest first)
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }, [bookings])

  // Lessons sorted by date descending then startTime ascending for same day
  const sortedLessons = useMemo(() => {
    return [...lessons].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      if (dateB !== dateA) return dateB - dateA
      return (a.startTime || '').localeCompare(b.startTime || '')
    })
  }, [lessons])

  const fetchTeachers = useCallback(async () => {
    setTeachersLoading(true)
    try {
      const response = await fetch('/api/admin/teachers', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load teachers')
      const json = await response.json()
      setTeachers(json.teachers || [])
    } catch (err) {
      console.error('Error fetching teachers:', err)
      showError(err instanceof Error ? err.message : 'Failed to load teachers')
    } finally {
      setTeachersLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (activeTab === 'teachers' || activeTab === 'lessons') {
      fetchTeachers()
    }
  }, [activeTab, fetchTeachers])

  // Fetch guests calendar (by month or by dateFrom/dateTo)
  const fetchGuestsCalendar = useCallback(async () => {
    setGuestsCalendarLoading(true)
    try {
      const useRange = guestsCalendarDateFrom && guestsCalendarDateTo
      const url = useRange
        ? `/api/admin/guests-calendar?dateFrom=${guestsCalendarDateFrom}&dateTo=${guestsCalendarDateTo}`
        : `/api/admin/guests-calendar?year=${guestsCalendarYear}&month=${guestsCalendarMonth}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load guests calendar')
      const json = await res.json()
      setGuestsCalendarDates(json.dates || {})
    } catch (err) {
      console.error(err)
      showError(err instanceof Error ? err.message : 'Failed to load guests calendar')
      setGuestsCalendarDates({})
    } finally {
      setGuestsCalendarLoading(false)
    }
  }, [showError, guestsCalendarYear, guestsCalendarMonth, guestsCalendarDateFrom, guestsCalendarDateTo])

  useEffect(() => {
    if (activeTab === 'guestsCalendar') {
      fetchGuestsCalendar()
    }
  }, [activeTab, guestsCalendarYear, guestsCalendarMonth, guestsCalendarDateFrom, guestsCalendarDateTo, fetchGuestsCalendar])

  // Fetch lesson pricing
  useEffect(() => {
    if (activeTab === 'lessonPricing') {
      fetchLessonPricing()
    }
    if (activeTab === 'prices') {
      fetchPrices()
    }
  }, [activeTab])

  const fetchLessonPricing = async () => {
    setLessonPricingLoading(true)
    try {
      const response = await fetch('/api/admin/lesson-pricing', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load lesson pricing')
      const json = await response.json()
      setLessonPricing(json.items || [])
    } catch (err) {
      console.error(err)
      showError(err instanceof Error ? err.message : 'Failed to load lesson pricing')
    } finally {
      setLessonPricingLoading(false)
    }
  }

  const fetchPrices = async () => {
    setPricesLoading(true)
    try {
      const response = await fetch('/api/admin/prices', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load prices')
      const json = await response.json()
      setPrices(json.prices || [])
    } catch (err) {
      console.error(err)
      showError(err instanceof Error ? err.message : 'Failed to load prices')
    } finally {
      setPricesLoading(false)
    }
  }

  const fetchReports = async () => {
    setReportsLoading(true)
    try {
      const response = await fetch('/api/admin/reports', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load reports')
      const json = await response.json()
      setReports(json)
    } catch (err) {
      console.error(err)
    } finally {
      setReportsLoading(false)
    }
  }

  // Booking handlers
  const handleBookingStatusChange = async (id: string, newStatus: string, type?: string) => {
    try {
      const endpoint = type === 'lesson' ? `/api/admin/lessons/${id}` : `/api/admin/bookings/${id}`
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update booking')
      fetchBookings()
      if (activeTab === 'dashboard') {
        const overviewResponse = await fetch('/api/admin/overview', { cache: 'no-store' })
        if (overviewResponse.ok) {
          const json = await overviewResponse.json()
          setDashboardData(json)
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to update booking status')
    }
  }

  const handleDeleteBooking = async (id: string, type?: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return
    try {
      const endpoint = type === 'lesson' ? `/api/admin/lessons/${id}` : `/api/admin/bookings/${id}`
      const response = await fetch(endpoint, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete booking')
      fetchBookings()
      // Refresh dashboard data if on dashboard tab
      if (activeTab === 'dashboard') {
        const dashboardResponse = await fetch('/api/admin/overview', { cache: 'no-store' })
        if (dashboardResponse.ok) {
          const json = await dashboardResponse.json()
          setDashboardData(json)
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to delete booking')
    }
  }

  // Lesson handlers
  const handleLessonStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/lessons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update lesson')
      fetchLessons()
    } catch (err) {
      console.error(err)
      showError(err instanceof Error ? err.message : 'Failed to update lesson status')
    }
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm(t('lessons.deleteConfirm') || 'Are you sure you want to delete this lesson?')) return
    try {
      const response = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete lesson')
      fetchLessons()
      showSuccess(t('lessons.deleteSuccess') || 'Lesson deleted successfully')
    } catch (err) {
      console.error(err)
      showError(err instanceof Error ? err.message : 'Failed to delete lesson')
    }
  }

  // Equipment handlers
  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return
    try {
      const response = await fetch(`/api/admin/equipment/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete equipment')
      fetchEquipment()
    } catch (err) {
      console.error(err)
      alert('Failed to delete equipment')
    }
  }

  // Form handlers
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingFormErrors({})

    try {
      const validated = bookingSchema.parse(bookingFormData)
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validated,
          totalPrice: parseFloat(validated.totalPrice),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create booking')
      }

      setShowBookingForm(false)
      setBookingFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        personalId: '',
        productId: '',
        startDate: '',
        endDate: '',
        totalPrice: '',
        status: BookingStatus.PENDING,
      })
      fetchBookings()
      if (activeTab === 'dashboard') {
        const overviewResponse = await fetch('/api/admin/overview', { cache: 'no-store' })
        if (overviewResponse.ok) {
          const json = await overviewResponse.json()
          setDashboardData(json)
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message
          }
        })
        setBookingFormErrors(errors)
      } else {
        alert(err instanceof Error ? err.message : 'Failed to create booking')
      }
    }
  }

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEquipmentFormErrors({})

    try {
      const validated = equipmentSchema.parse(equipmentFormData)
      
      const url = editingEquipment 
        ? `/api/admin/equipment/${editingEquipment.id}`
        : '/api/admin/equipment'
      
      const method = editingEquipment ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validated,
          price: parseFloat(validated.price),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to ${editingEquipment ? 'update' : 'create'} equipment`)
      }

      setShowEquipmentForm(false)
      setEditingEquipment(null)
      setEquipmentFormData({
        type: ProductType.SKI,
        price: '',
        size: null,
        standard: false,
        professional: false,
        description: '',
      })
      fetchEquipment()
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message
          }
        })
        setEquipmentFormErrors(errors)
      } else {
        alert(err instanceof Error ? err.message : `Failed to ${editingEquipment ? 'update' : 'create'} equipment`)
      }
    }
  }

  const handleEditEquipment = (item: Product) => {
    setEditingEquipment(item)
    setEquipmentFormData({
      type: item.type as ProductType,
      price: item.price.toString(),
      size: item.size ? (item.size as ProductSize) : null,
      standard: item.standard || false,
      professional: item.professional || false,
      description: item.description || '',
    })
    setShowEquipmentForm(true)
  }

  // Lesson Pricing handlers
  const handleLessonPricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLessonPricingFormErrors({})

    try {
      const numberOfPeople = parseInt(lessonPricingFormData.numberOfPeople)
      const duration = parseInt(lessonPricingFormData.duration)
      const price = parseFloat(lessonPricingFormData.price)

      if (!numberOfPeople || numberOfPeople < 1 || numberOfPeople > 4) {
        setLessonPricingFormErrors({ numberOfPeople: 'Number of people must be between 1 and 4' })
        return
      }

      if (!duration || ![1, 2, 3].includes(duration)) {
        setLessonPricingFormErrors({ duration: 'Duration must be 1, 2, or 3 hours' })
        return
      }

      if (!price || price <= 0) {
        setLessonPricingFormErrors({ price: 'Price must be greater than 0' })
        return
      }

      const response = await fetch('/api/admin/lesson-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfPeople,
          duration,
          price,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save lesson pricing')
      }

      setShowLessonPricingForm(false)
      setLessonPricingFormData({ numberOfPeople: '', duration: '', price: '' })
      setEditingLessonPricing(null)
      fetchLessonPricing()
      showSuccess('Lesson pricing saved successfully')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save lesson pricing')
    }
  }

  const handleEditLessonPricing = (item: { id: string; numberOfPeople: number; duration: number; price: number }) => {
    setEditingLessonPricing(item)
    setLessonPricingFormData({
      numberOfPeople: item.numberOfPeople.toString(),
      duration: item.duration.toString(),
      price: item.price.toString(),
    })
    setShowLessonPricingForm(true)
  }

  const handleDeleteLessonPricing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing?')) return
    try {
      const response = await fetch(`/api/admin/lesson-pricing/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete lesson pricing')
      fetchLessonPricing()
      showSuccess('Lesson pricing deleted successfully')
    } catch (err) {
      console.error(err)
      showError('Failed to delete lesson pricing')
    }
  }

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeacherFormErrors({})
    const firstname = teacherFormData.firstname.trim()
    const lastname = teacherFormData.lastname.trim()
    if (!firstname || !lastname) {
      setTeacherFormErrors({
        firstname: !firstname ? (t('teachers.firstnameRequired') || 'First name is required') : '',
        lastname: !lastname ? (t('teachers.lastnameRequired') || 'Last name is required') : '',
      })
      return
    }
    try {
      if (editingTeacher) {
        const response = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstname, lastname }),
        })
        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.message || 'Failed to update teacher')
        }
        showSuccess(t('teachers.updateSuccess') || 'Teacher updated successfully')
      } else {
        const response = await fetch('/api/admin/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstname, lastname }),
        })
        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.message || 'Failed to create teacher')
        }
        showSuccess(t('teachers.addSuccess') || 'Teacher added successfully')
      }
      setShowTeacherForm(false)
      setTeacherFormData({ firstname: '', lastname: '' })
      setEditingTeacher(null)
      fetchTeachers()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save teacher')
    }
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setTeacherFormData({ firstname: teacher.firstname, lastname: teacher.lastname })
    setShowTeacherForm(true)
  }

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm(t('teachers.deleteConfirm') || 'Are you sure? Lessons linked to this teacher will have no instructor.')) return
    try {
      const response = await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to delete teacher')
      }
      showSuccess(t('teachers.deleteSuccess') || 'Teacher deleted')
      fetchTeachers()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete teacher')
    }
  }

  const handleLessonTeacherChange = async (lessonId: string, teacherId: string | null) => {
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacherId || null }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to update instructor')
      }
      showSuccess(t('lessons.instructorUpdated') || 'Instructor updated')
      fetchLessons()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update instructor')
    }
  }

  const handlePricesSubmit = async (updatedPrices: Array<{ itemKey: string; type: string; includes: string; price: string }>) => {
    setSubmittingPrices(true)
    try {
      const response = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: updatedPrices }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save prices')
      }

      fetchPrices()
      showSuccess('Prices saved successfully')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save prices')
    } finally {
      setSubmittingPrices(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale || 'ka-GE', { style: 'currency', currency: 'GEL' }).format(amount)

  const formatDate = (value: string | null) => {
    if (!value) return '—'

    // If we get a date-only string (YYYY-MM-DD) from the API, format it using UTC Date to avoid timezone shifts.
    // The API returns dates as YYYY-MM-DD (from toISOString().split('T')[0]), which represents
    // a pure calendar date. We create a UTC Date and format it with UTC timezone to preserve the date.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number)
      // Create Date using UTC components to avoid timezone conversion
      const date = new Date(Date.UTC(year, month - 1, day))
      // Format with UTC timezone to preserve the date exactly
      return new Intl.DateTimeFormat(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC'
      }).format(date)
    }

    // For other date formats, use standard parsing
    const date = new Date(value)
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
  }

  const statusIsActive = (status: string) => ['PENDING', 'CONFIRMED'].includes(status)

  const menuItems = [
    { id: 'dashboard', labelKey: 'menu.dashboard' },
    { id: 'bookings', labelKey: 'menu.bookings' },
    { id: 'guestsCalendar', labelKey: 'menu.guestsCalendar' },
    { id: 'lessons', labelKey: 'menu.lessons' },
    { id: 'teachers', labelKey: 'menu.teachers' },
    { id: 'equipment', labelKey: 'menu.equipment' },
    { id: 'customers', labelKey: 'menu.customers' },
    { id: 'lessonPricing', labelKey: 'menu.lessonPricing' },
    { id: 'prices', labelKey: 'menu.prices' },
  ]

  const renderDashboard = () => {
    const stats = [
      { labelKey: 'stats.totalBookings', value: dashboardData?.stats.totalBookings ?? 0 },
      { labelKey: 'stats.activeRentals', value: dashboardData?.stats.activeRentals ?? 0 },
      {
        labelKey: 'stats.revenue',
        value:
          dashboardData?.stats.totalRevenue !== undefined
            ? formatCurrency(dashboardData.stats.totalRevenue)
            : formatCurrency(0),
      },
      { labelKey: 'stats.equipment', value: dashboardData?.stats.totalProducts ?? 0 },
    ]

    const recentBookings = [...(dashboardData?.bookings ?? [])].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )

    return (
      <>
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-sm md:text-base text-gray-600">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-[16px] text-black">{t(stat.labelKey)}</div>
                {dashboardLoading && <div className="h-2 w-12 bg-gray-100 rounded animate-pulse" />}
              </div>
              <div className="text-[16px] font-bold text-black mb-1">
                {dashboardLoading ? '—' : String(stat.value)}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-[16px] text-black mb-1">{t('stats.todayGuests')}</div>
            <div className="text-[16px] font-bold text-black">
              {dashboardLoading ? '—' : (dashboardData?.stats.todayGuests ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-[16px] text-black mb-1">{t('stats.tomorrowGuests')}</div>
            <div className="text-[16px] font-bold text-black">
              {dashboardLoading ? '—' : (dashboardData?.stats.tomorrowGuests ?? 0)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-sm md:text-base font-bold text-black">{t('bookings.recent')}</h2>
            <button
              onClick={() => setActiveTab('bookings')}
              className="text-sm md:text-base text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
            >
              {t('bookings.viewAll')} →
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('bookings.table.customer')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden sm:table-cell">
                      {t('bookings.table.equipment')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('bookings.table.date')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('bookings.table.phone')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden xl:table-cell">
                      {t('bookings.table.email')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden md:table-cell">
                      {t('bookings.table.price')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('bookings.table.status')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('bookings.table.actions')}
                    </th>
                  </tr>
                </thead>
              <tbody>
                {dashboardLoading && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={8}>
                      {t('bookings.loading')}
                    </td>
                  </tr>
                )}
                {!dashboardLoading && recentBookings.length === 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={8}>
                      {t('bookings.empty')}
                    </td>
                  </tr>
                )}
                {!dashboardLoading &&
                  recentBookings.map((booking) => {
                    const statusKey = booking.status.toLowerCase()
                    const bookingType = (booking as any).type || 'booking'
                    return (
                      <tr key={booking.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-3 text-xs md:text-sm text-black">
                          <div className="font-medium">{booking.customer}</div>
                          <div className="text-gray-500 sm:hidden mt-1">{booking.equipment}</div>
                          <div className="text-gray-500 lg:hidden mt-1">{(booking as any).phoneNumber || '—'}</div>
                          <div className="text-gray-500 xl:hidden mt-1">{(booking as any).email || '—'}</div>
                          <div className="text-gray-500 md:hidden mt-1">{formatCurrency((booking as any).totalPrice || 0)}</div>
                          {bookingType === 'lesson' && (
                            <div className="text-xs text-orange-600 mt-1 font-semibold">Lesson</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden sm:table-cell">{booking.equipment}</td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black whitespace-nowrap">{formatDate(booking.startDate)}</td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell whitespace-nowrap">{(booking as any).phoneNumber || '—'}</td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden xl:table-cell whitespace-nowrap">{(booking as any).email || '—'}</td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden md:table-cell whitespace-nowrap">{formatCurrency((booking as any).totalPrice || 0)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              statusIsActive(booking.status)
                                ? 'bg-[#08964c] text-white'
                                : booking.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {t(`bookings.status.${statusKey}`)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDeleteBooking(booking.id, bookingType)}
                            className="text-red-600 hover:text-red-700 text-xs md:text-sm whitespace-nowrap"
                          >
                            {t('bookings.delete')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </>
    )
  }

  const renderBookings = () => {
    return (
      <>
        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black">{t('bookings.add')}</h2>
                  <button
                    onClick={() => {
                      setShowBookingForm(false)
                      setBookingFormErrors({})
                      setBookingFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        phoneNumber: '',
                        personalId: '',
                        productId: '',
                        startDate: '',
                        endDate: '',
                        totalPrice: '',
                        status: BookingStatus.PENDING,
                      })
                    }}
                    className="text-gray-500 hover:text-black"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('bookings.form.firstName')} *
                      </label>
                      <input
                        type="text"
                        value={bookingFormData.firstName}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, firstName: e.target.value })}
                        className={`w-full border rounded-lg px-4 py-2 text-black ${
                          bookingFormErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {bookingFormErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{bookingFormErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('bookings.form.lastName')} *
                      </label>
                      <input
                        type="text"
                        value={bookingFormData.lastName}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, lastName: e.target.value })}
                        className={`w-full border rounded-lg px-4 py-2 text-black ${
                          bookingFormErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {bookingFormErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{bookingFormErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('bookings.form.email')} *
                    </label>
                    <input
                      type="email"
                      value={bookingFormData.email}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        bookingFormErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {bookingFormErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{bookingFormErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('bookings.form.phone')} *
                    </label>
                    <input
                      type="tel"
                      value={bookingFormData.phoneNumber}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, phoneNumber: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        bookingFormErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {bookingFormErrors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">{bookingFormErrors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('bookings.form.personalId')} *
                      </label>
                    <input
                      type="text"
                      value={bookingFormData.personalId}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, personalId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('bookings.form.product')} *
                    </label>
                    <select
                      value={bookingFormData.productId}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, productId: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        bookingFormErrors.productId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">{t('bookings.form.product')}</option>
                      {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.type.replace(/_/g, ' ')}{product.type === 'ADULT_CLOTH' && product.size ? ` (${product.size})` : ''} - {formatCurrency(product.price)}
                        </option>
                      ))}
                    </select>
                    {bookingFormErrors.productId && (
                      <p className="text-red-500 text-xs mt-1">{bookingFormErrors.productId}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('bookings.form.startDate')} *
                      </label>
                      <input
                        type="date"
                        value={bookingFormData.startDate}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, startDate: e.target.value })}
                        className={`w-full border rounded-lg px-4 py-2 text-black ${
                          bookingFormErrors.startDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {bookingFormErrors.startDate && (
                        <p className="text-red-500 text-xs mt-1">{bookingFormErrors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('bookings.form.endDate')} *
                      </label>
                      <input
                        type="date"
                        value={bookingFormData.endDate}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, endDate: e.target.value })}
                        className={`w-full border rounded-lg px-4 py-2 text-black ${
                          bookingFormErrors.endDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {bookingFormErrors.endDate && (
                        <p className="text-red-500 text-xs mt-1">{bookingFormErrors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('bookings.form.price')} *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={bookingFormData.totalPrice}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, totalPrice: e.target.value })}
                        className={`w-full border rounded-lg px-4 py-2 text-black ${
                          bookingFormErrors.totalPrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {bookingFormErrors.totalPrice && (
                        <p className="text-red-500 text-xs mt-1">{bookingFormErrors.totalPrice}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('bookings.form.status')} *
                      </label>
                      <select
                        value={bookingFormData.status}
                        onChange={(e) => {
                          const value = e.target.value
                          if (Object.values(BookingStatus).includes(value as BookingStatus)) {
                            setBookingFormData({ ...bookingFormData, status: value as BookingStatus })
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                      >
                        <option value="PENDING">{t('bookings.status.pending')}</option>
                        <option value="CONFIRMED">{t('bookings.status.confirmed')}</option>
                        <option value="CANCELLED">{t('bookings.status.cancelled')}</option>
                        <option value="COMPLETED">{t('bookings.status.completed')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
                    >
                      {t('bookings.form.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false)
                        setBookingFormErrors({})
                        setBookingFormData({
                          firstName: '',
                          lastName: '',
                          email: '',
                          phoneNumber: '',
                          personalId: '',
                          productId: '',
                          startDate: '',
                          endDate: '',
                          totalPrice: '',
                          status: BookingStatus.PENDING,
                        })
                      }}
                      className="w-full sm:w-auto bg-gray-200 text-black px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                    >
                      {t('bookings.form.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('bookings.title')}</h1>
              <p className="text-sm md:text-base text-black">{t('bookings.subtitle')}</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/bookings/export')
                  if (!response.ok) throw new Error('Failed to export bookings')
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  const contentDisposition = response.headers.get('content-disposition')
                  const filename = contentDisposition
                    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'bookings.xlsx'
                    : 'bookings.xlsx'
                  a.download = filename
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                } catch (error) {
                  console.error('Failed to export bookings', error)
                  alert(t('bookings.exportError') || 'Failed to export bookings')
                }
              }}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base font-medium flex items-center gap-2 justify-center"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('bookings.exportExcel')}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-wrap">
            <label className="text-sm md:text-base font-medium text-black whitespace-nowrap">{t('bookings.filter')}:</label>
            <select
              value={bookingsFilter}
              onChange={(e) => setBookingsFilter(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-black"
            >
              <option value="all">{t('bookings.all')}</option>
              <option value="PENDING">{t('bookings.status.pending')}</option>
              <option value="CONFIRMED">{t('bookings.status.confirmed')}</option>
              <option value="CANCELLED">{t('bookings.status.cancelled')}</option>
              <option value="COMPLETED">{t('bookings.status.completed')}</option>
            </select>
            <span className="text-sm font-medium text-black hidden sm:inline">{t('bookings.dateFrom')}</span>
            <input
              type="date"
              value={bookingsDateFrom}
              onChange={(e) => setBookingsDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black w-full sm:w-auto"
            />
            <span className="text-sm font-medium text-black hidden sm:inline">{t('bookings.dateTo')}</span>
            <input
              type="date"
              value={bookingsDateTo}
              onChange={(e) => setBookingsDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black w-full sm:w-auto"
            />
            <button
              type="button"
              onClick={() => fetchBookings()}
              disabled={bookingsLoading}
              className="text-sm px-3 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 font-medium"
            >
              {t('bookings.applyFilter')}
            </button>
            {(bookingsDateFrom || bookingsDateTo) && (
              <button
                type="button"
                onClick={() => {
                  setBookingsDateFrom('')
                  setBookingsDateTo('')
                }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {t('bookings.clearDates')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          {selectedBookingIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4 py-2 px-3 rounded-lg bg-orange-50 border border-orange-200">
              <span className="text-sm font-medium text-black">
                {t('selectedCount', { count: selectedBookingIds.size })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedBookingIds(new Set())}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {t('clearSelection')}
              </button>
            </div>
          )}
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={sortedBookings.length > 0 && sortedBookings.every((b) => selectedBookingIds.has(b.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookingIds(new Set(sortedBookings.map((b) => b.id)))
                          } else {
                            setSelectedBookingIds(new Set())
                          }
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        title={t('selectAll')}
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('bookings.table.customer')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('bookings.table.equipment')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden md:table-cell">
                      {t('bookings.table.date')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('bookings.table.phone')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden xl:table-cell">
                      {t('bookings.table.email')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('bookings.table.price')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('bookings.table.status')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('bookings.table.actions')}
                    </th>
                  </tr>
                </thead>
              <tbody>
                {bookingsLoading && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={9}>
                      {t('bookings.loading')}
                    </td>
                  </tr>
                )}
                {!bookingsLoading && sortedBookings.length === 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={9}>
                      {t('bookings.empty')}
                    </td>
                  </tr>
                )}
                {!bookingsLoading &&
                  sortedBookings.map((booking) => {
                    const statusKey = booking.status.toLowerCase()
                    const bookingType = (booking as any).type || 'booking'
                    const isSelected = selectedBookingIds.has(booking.id)
                    return (
                      <tr
                        key={booking.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-orange-50' : 'bg-white'}`}
                      >
                        <td className="px-2 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = new Set(selectedBookingIds)
                              if (e.target.checked) next.add(booking.id)
                              else next.delete(booking.id)
                              setSelectedBookingIds(next)
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black">
                          <div className="font-medium">{booking.customer}</div>
                          <div className="text-gray-500 lg:hidden mt-1 text-xs">{booking.equipment}</div>
                          <div className="text-gray-500 md:hidden mt-1 text-xs">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </div>
                          <div className="text-gray-500 lg:hidden mt-1 text-xs">{booking.phoneNumber || '—'}</div>
                          <div className="text-gray-500 xl:hidden mt-1 text-xs">{booking.email || '—'}</div>
                          <div className="text-gray-500 lg:hidden mt-1 text-xs">{formatCurrency(booking.totalPrice)}</div>
                          {bookingType === 'lesson' && (
                            <div className="text-xs text-orange-600 mt-1 font-semibold">Lesson</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell">{booking.equipment}</td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden md:table-cell whitespace-nowrap">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell whitespace-nowrap">{booking.phoneNumber || '—'}</td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden xl:table-cell whitespace-nowrap">{booking.email || '—'}</td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell">{formatCurrency(booking.totalPrice)}</td>
                        <td className="px-3 py-3">
                          <select
                            value={booking.status}
                            onChange={(e) => handleBookingStatusChange(booking.id, e.target.value, bookingType)}
                            className={`text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full border-0 w-full sm:w-auto ${
                              statusIsActive(booking.status)
                                ? 'bg-[#08964c] text-white'
                                : booking.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <option value="PENDING">{t('bookings.status.pending')}</option>
                            <option value="CONFIRMED">{t('bookings.status.confirmed')}</option>
                            <option value="CANCELLED">{t('bookings.status.cancelled')}</option>
                            <option value="COMPLETED">{t('bookings.status.completed')}</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDeleteBooking(booking.id, bookingType)}
                            className="text-red-600 hover:text-red-700 text-xs md:text-sm whitespace-nowrap"
                          >
                            {t('bookings.delete')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </>
    )
  }

  const renderEquipment = () => {
    return (
      <>
        {/* Equipment Form Modal */}
        {showEquipmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-black">
                    {editingEquipment ? t('equipment.edit') : t('equipment.add')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEquipmentForm(false)
                      setEditingEquipment(null)
                      setEquipmentFormErrors({})
                      setEquipmentFormData({
                        type: ProductType.SKI,
                        price: '',
                        size: null,
                        standard: false,
                        professional: false,
                        description: '',
                      })
                    }}
                    className="text-gray-500 hover:text-black"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleEquipmentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('equipment.form.type')} *
                    </label>
                    <select
                      value={equipmentFormData.type}
                      onChange={(e) => {
                        const newType = e.target.value as ProductType
                        const sizeRequiringTypes: ProductType[] = [ProductType.ADULT_CLOTH]
                        const isChildType = newType === ProductType.CHILD_CLOTH || 
                                           newType === ProductType.CHILD_SKI_SET || 
                                           newType === ProductType.CHILD_SNOWBOARD_SET
                        const isAccessory = newType === ProductType.ACCESSORY
                        const isVehicle = newType === ProductType.QUAD_BIKE || 
                                         newType === ProductType.BAG || 
                                         newType === ProductType.BURAN || 
                                         newType === ProductType.WRANGLER_JEEP
                        setEquipmentFormData({ 
                          ...equipmentFormData, 
                          type: newType,
                          size: sizeRequiringTypes.includes(newType) ? equipmentFormData.size : null,
                          standard: (isChildType || isAccessory || isVehicle) ? false : equipmentFormData.standard,
                          professional: (isChildType || isAccessory || isVehicle) ? false : equipmentFormData.professional,
                        })
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                    >
                      <option value="SKI">{t('equipment.types.SKI')}</option>
                      <option value="SNOWBOARD">{t('equipment.types.SNOWBOARD')}</option>
                      <option value="SKI_BOOTS">{t('equipment.types.SKI_BOOTS')}</option>
                      <option value="SNOWBOARD_BOOTS">{t('equipment.types.SNOWBOARD_BOOTS')}</option>
                      <option value="ADULT_CLOTH">{t('equipment.types.ADULT_CLOTH')}</option>
                      <option value="CHILD_CLOTH">{t('equipment.types.CHILD_CLOTH')}</option>
                      <option value="ADULT_SKI_SET">{t('equipment.types.ADULT_SKI_SET')}</option>
                      <option value="CHILD_SKI_SET">{t('equipment.types.CHILD_SKI_SET')}</option>
                      <option value="CHILD_SNOWBOARD_SET">{t('equipment.types.CHILD_SNOWBOARD_SET')}</option>
                      <option value="ADULT_SNOWBOARD_SET">{t('equipment.types.ADULT_SNOWBOARD_SET')}</option>
                      <option value="ACCESSORY">{t('equipment.types.ACCESSORY')}</option>
                      <option value="VEHICLES">{t('equipment.types.VEHICLES')}</option>
                      <option value="QUAD_BIKE">{t('equipment.types.QUAD_BIKE')}</option>
                      <option value="BAG">{t('equipment.types.BAG')}</option>
                      <option value="BURAN">{t('equipment.types.BURAN')}</option>
                      <option value="WRANGLER_JEEP">{t('equipment.types.WRANGLER_JEEP')}</option>
                    </select>
                  </div>

                  {equipmentFormData.type === ProductType.ADULT_CLOTH && (
                    <div>
                      <label className="block text-[16px] font-medium text-black mb-1">
                        {t('equipment.form.size')} *
                      </label>
                      <select
                        value={equipmentFormData.size || ''}
                        onChange={(e) =>
                          setEquipmentFormData({ 
                            ...equipmentFormData, 
                            size: e.target.value ? (e.target.value as ProductSize) : null 
                          })
                        }
                        className={`w-full border rounded-lg px-4 py-2 text-black ${
                          equipmentFormErrors.size ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">{t('equipment.form.selectSize')}</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                      </select>
                      {equipmentFormErrors.size && (
                        <p className="text-red-500 text-xs mt-1">{equipmentFormErrors.size}</p>
                      )}
                    </div>
                  )}

                  {equipmentFormData.type !== ProductType.CHILD_CLOTH && 
                   equipmentFormData.type !== ProductType.CHILD_SKI_SET && 
                   equipmentFormData.type !== ProductType.CHILD_SNOWBOARD_SET &&
                   equipmentFormData.type !== ProductType.ACCESSORY &&
                   equipmentFormData.type !== ProductType.QUAD_BIKE &&
                   equipmentFormData.type !== ProductType.BAG &&
                   equipmentFormData.type !== ProductType.BURAN &&
                   equipmentFormData.type !== ProductType.WRANGLER_JEEP && (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="standard"
                          checked={equipmentFormData.standard || false}
                          onChange={(e) => setEquipmentFormData({ ...equipmentFormData, standard: e.target.checked })}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label htmlFor="standard" className="ml-2 text-[16px] text-black">
                          {t('equipment.form.standard')}
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="professional"
                          checked={equipmentFormData.professional || false}
                          onChange={(e) => setEquipmentFormData({ ...equipmentFormData, professional: e.target.checked })}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label htmlFor="professional" className="ml-2 text-[16px] text-black">
                          {t('equipment.form.professional')}
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('equipment.form.description')}
                    </label>
                    <textarea
                      value={equipmentFormData.description || ''}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, description: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                      placeholder={t('equipment.form.descriptionPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('equipment.form.price')} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={equipmentFormData.price}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, price: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        equipmentFormErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {equipmentFormErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{equipmentFormErrors.price}</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
                    >
                      {t('equipment.form.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEquipmentForm(false)
                        setEditingEquipment(null)
                        setEquipmentFormErrors({})
                        setEquipmentFormData({
                          type: ProductType.SKI,
                          price: '',
                          size: null,
                          standard: false,
                          professional: false,
                          description: '',
                        })
                      }}
                      className="w-full sm:w-auto bg-gray-200 text-black px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                    >
                      {t('equipment.form.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('equipment.title')}</h1>
              <p className="text-sm md:text-base text-gray-600">{t('equipment.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setEditingEquipment(null)
                setShowEquipmentForm(true)
              }}
              className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
            >
              {t('equipment.add')}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <label className="text-sm md:text-base font-medium text-black whitespace-nowrap">{t('equipment.filter')}:</label>
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-black"
          >
            <option value="all">{t('equipment.all')}</option>
            <option value="SKI">{t('equipment.types.SKI')}</option>
            <option value="SNOWBOARD">{t('equipment.types.SNOWBOARD')}</option>
            <option value="SKI_BOOTS">{t('equipment.types.SKI_BOOTS')}</option>
            <option value="SNOWBOARD_BOOTS">{t('equipment.types.SNOWBOARD_BOOTS')}</option>
            <option value="ADULT_CLOTH">{t('equipment.types.ADULT_CLOTH')}</option>
            <option value="CHILD_CLOTH">{t('equipment.types.CHILD_CLOTH')}</option>
            <option value="ADULT_SKI_SET">{t('equipment.types.ADULT_SKI_SET')}</option>
            <option value="CHILD_SKI_SET">{t('equipment.types.CHILD_SKI_SET')}</option>
            <option value="CHILD_SNOWBOARD_SET">{t('equipment.types.CHILD_SNOWBOARD_SET')}</option>
            <option value="ADULT_SNOWBOARD_SET">{t('equipment.types.ADULT_SNOWBOARD_SET')}</option>
            <option value="ACCESSORY">{t('equipment.types.ACCESSORY')}</option>
            <option value="VEHICLES">{t('equipment.types.VEHICLES')}</option>
            <option value="QUAD_BIKE">{t('equipment.types.QUAD_BIKE')}</option>
            <option value="BAG">{t('equipment.types.BAG')}</option>
            <option value="BURAN">{t('equipment.types.BURAN')}</option>
            <option value="WRANGLER_JEEP">{t('equipment.types.WRANGLER_JEEP')}</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider w-32">
                      {t('equipment.table.title')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell w-80">
                      {t('equipment.table.description')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider w-28">
                      {t('equipment.table.price')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell w-24">
                      {t('equipment.table.bookings')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider w-40">
                      {t('equipment.table.actions')}
                    </th>
                  </tr>
                </thead>
              <tbody>
                {equipmentLoading && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={5}>
                      {t('equipment.loading')}
                    </td>
                  </tr>
                )}
                {!equipmentLoading && equipment.length === 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={5}>
                      {t('equipment.empty')}
                    </td>
                  </tr>
                )}
                {!equipmentLoading &&
                  equipment.map((item) => (
                    <tr key={item.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 text-xs md:text-sm text-black w-32">
                        <div className="font-medium">
                        {t(`equipment.types.${item.type}`)}
                        {item.type === ProductType.ADULT_CLOTH && item.size && (
                          <span className="ml-2 text-gray-500">({item.size})</span>
                        )}
                        {item.type !== ProductType.CHILD_CLOTH && 
                         item.type !== ProductType.CHILD_SKI_SET && 
                         item.type !== ProductType.CHILD_SNOWBOARD_SET &&
                         item.type !== ProductType.ACCESSORY &&
                         item.type !== ProductType.QUAD_BIKE &&
                         item.type !== ProductType.BAG &&
                         item.type !== ProductType.BURAN &&
                         item.type !== ProductType.WRANGLER_JEEP && 
                         (item.standard || item.professional) && (
                          <span className="ml-2 text-xs text-gray-500">
                            {item.standard && item.professional ? '(Standard, Professional)' : item.standard ? '(Standard)' : '(Professional)'}
                          </span>
                        )}
                        </div>
                        {item.description && (
                          <div className="text-gray-500 lg:hidden mt-1 text-xs">{t('equipment.table.description')}: {item.description}</div>
                        )}
                        <div className="text-gray-500 lg:hidden mt-1 text-xs">{t('equipment.table.bookings')}: {item.bookingsCount}</div>
                      </td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell w-80">
                        {item.description ? (
                          <div className="truncate" title={item.description}>
                            {item.description}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black whitespace-nowrap w-28">{formatCurrency(item.price)}</td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell w-24">{item.bookingsCount}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleEditEquipment(item)}
                            className="w-full sm:w-auto flex text-xs md:text-sm items-center justify-center px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors bg-orange-600 text-white hover:bg-orange-700"
                          >
                            {t('equipment.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(item.id)}
                            className="w-full sm:w-auto text-red-600 hover:text-red-700 text-xs md:text-sm px-3 py-2 text-center"
                          >
                            {t('equipment.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </>
    )
  }

  const renderLessons = () => {
    return (
      <>
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('lessons.title')}</h1>
              <p className="text-sm md:text-base text-black">{t('lessons.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-wrap">
            <label className="text-sm md:text-base font-medium text-black whitespace-nowrap">{t('lessons.filter')}:</label>
            <select
              value={lessonsFilter}
              onChange={(e) => setLessonsFilter(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-black"
            >
              <option value="all">{t('lessons.all')}</option>
              <option value="PENDING">{t('lessons.status.pending')}</option>
              <option value="CONFIRMED">{t('lessons.status.confirmed')}</option>
              <option value="CANCELLED">{t('lessons.status.cancelled')}</option>
              <option value="COMPLETED">{t('lessons.status.completed')}</option>
            </select>
            <span className="text-sm font-medium text-black hidden sm:inline">{t('lessons.dateFrom')}</span>
            <input
              type="date"
              value={lessonsDateFrom}
              onChange={(e) => setLessonsDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black w-full sm:w-auto"
            />
            <span className="text-sm font-medium text-black hidden sm:inline">{t('lessons.dateTo')}</span>
            <input
              type="date"
              value={lessonsDateTo}
              onChange={(e) => setLessonsDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black w-full sm:w-auto"
            />
            <button
              type="button"
              onClick={() => fetchLessons()}
              disabled={lessonsLoading}
              className="text-sm px-3 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 font-medium"
            >
              {t('lessons.applyFilter')}
            </button>
            {(lessonsDateFrom || lessonsDateTo) && (
              <button
                type="button"
                onClick={() => {
                  setLessonsDateFrom('')
                  setLessonsDateTo('')
                }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {t('lessons.clearDates')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          {selectedLessonIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4 py-2 px-3 rounded-lg bg-orange-50 border border-orange-200">
              <span className="text-sm font-medium text-black">
                {t('selectedCount', { count: selectedLessonIds.size })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLessonIds(new Set())}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {t('clearSelection')}
              </button>
            </div>
          )}
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={sortedLessons.length > 0 && sortedLessons.every((l) => selectedLessonIds.has(l.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLessonIds(new Set(sortedLessons.map((l) => l.id)))
                          } else {
                            setSelectedLessonIds(new Set())
                          }
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        title={t('selectAll')}
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('lessons.table.customer')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('lessons.table.type')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden md:table-cell">
                      {t('lessons.table.date')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('lessons.table.time')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden xl:table-cell">
                      {t('lessons.table.details')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('lessons.table.price')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('lessons.table.status')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('lessons.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lessonsLoading && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-[16px] text-black" colSpan={9}>
                        {t('lessons.loading')}
                      </td>
                    </tr>
                  )}
                  {!lessonsLoading && sortedLessons.length === 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-[16px] text-black" colSpan={9}>
                        {t('lessons.empty')}
                      </td>
                    </tr>
                  )}
                  {!lessonsLoading &&
                    sortedLessons.map((lesson) => {
                      const statusKey = lesson.status.toLowerCase()
                      const isSelected = selectedLessonIds.has(lesson.id)
                      return (
                        <tr
                          key={lesson.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-orange-50' : 'bg-white'}`}
                        >
                          <td className="px-2 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const next = new Set(selectedLessonIds)
                                if (e.target.checked) next.add(lesson.id)
                                else next.delete(lesson.id)
                                setSelectedLessonIds(next)
                              }}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                          </td>
                          <td className="px-3 py-3 text-xs md:text-sm text-black">
                            <div className="font-medium">{lesson.customer}</div>
                            <div className="text-gray-500 lg:hidden mt-1 text-xs">
                              {lesson.lessonType === 'SKI' ? t('lessons.type.ski') : t('lessons.type.snowboard')}
                            </div>
                            <div className="text-gray-500 md:hidden mt-1 text-xs">
                              {formatDate(lesson.date)} {lesson.startTime}
                            </div>
                            <div className="text-gray-500 xl:hidden mt-1 text-xs">
                              {lesson.numberOfPeople} {lesson.numberOfPeople === 1 ? t('lessons.person') : t('lessons.people')}, {lesson.duration} {lesson.duration === 1 ? t('lessons.hour') : t('lessons.hours')}
                            </div>
                            <div className="text-gray-500 lg:hidden mt-1 text-xs">{formatCurrency(lesson.totalPrice)}</div>
                          </td>
                          <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell">
                            <div className="font-medium">
                              {lesson.lessonType === 'SKI' ? t('lessons.type.ski') : t('lessons.type.snowboard')}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              <select
                                value={lesson.teacherId ?? ''}
                                onChange={(e) => handleLessonTeacherChange(lesson.id, e.target.value || null)}
                                className="w-full max-w-[160px] border border-gray-300 rounded px-2 py-1 text-xs text-black bg-white"
                                title={t('lessons.assignInstructor')}
                              >
                                <option value="">— {t('lessons.noInstructor')}</option>
                                {teachers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.firstname} {t.lastname}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {t(`lessons.level.${lesson.level.toLowerCase()}`)}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {t(`lessons.language.${lesson.language.toLowerCase()}`)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs md:text-sm text-black hidden md:table-cell whitespace-nowrap">
                            {formatDate(lesson.date)}
                          </td>
                          <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell whitespace-nowrap">
                            {lesson.startTime}
                          </td>
                          <td className="px-3 py-3 text-xs md:text-sm text-black hidden xl:table-cell">
                            <div className="text-xs">
                              <div>{lesson.numberOfPeople} {lesson.numberOfPeople === 1 ? t('lessons.person') : t('lessons.people')}</div>
                              <div className="text-gray-500 mt-1">{lesson.duration} {lesson.duration === 1 ? t('lessons.hour') : t('lessons.hours')}</div>
                              <div className="text-gray-500 mt-1">{t(`lessons.level.${lesson.level.toLowerCase()}`)}</div>
                              <div className="text-gray-500 mt-1">{t(`lessons.language.${lesson.language.toLowerCase()}`)}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell">
                            {formatCurrency(lesson.totalPrice)}
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={lesson.status}
                              onChange={(e) => handleLessonStatusChange(lesson.id, e.target.value)}
                              className={`text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full border-0 w-full sm:w-auto ${
                                statusIsActive(lesson.status)
                                  ? 'bg-[#08964c] text-white'
                                  : lesson.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <option value="PENDING">{t('lessons.status.pending')}</option>
                              <option value="CONFIRMED">{t('lessons.status.confirmed')}</option>
                              <option value="CANCELLED">{t('lessons.status.cancelled')}</option>
                              <option value="COMPLETED">{t('lessons.status.completed')}</option>
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="text-red-600 hover:text-red-700 text-xs md:text-sm whitespace-nowrap"
                            >
                              {t('lessons.delete')}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    )
  }

  const renderCustomers = () => {
    return (
      <>
        <div className="mb-6 md:mb-8">
          <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('customers.title')}</h1>
          <p className="text-sm md:text-base text-black">{t('customers.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('customers.table.name')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden md:table-cell">
                      {t('customers.table.email')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('customers.table.phone')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden sm:table-cell">
                      {t('customers.table.bookings')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden lg:table-cell">
                      {t('customers.table.totalSpent')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden xl:table-cell">
                      {t('customers.table.lastBooking')}
                    </th>
                  </tr>
                </thead>
              <tbody>
                {customersLoading && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={6}>
                      {t('customers.loading')}
                    </td>
                  </tr>
                )}
                {!customersLoading && customers.length === 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={6}>
                      {t('customers.empty')}
                    </td>
                  </tr>
                )}
                {!customersLoading &&
                  customers.map((customer, index) => (
                    <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 text-xs md:text-sm text-black">
                        <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                        <div className="text-gray-500 md:hidden mt-1 text-xs">{customer.email}</div>
                        <div className="text-gray-500 lg:hidden mt-1 text-xs">{customer.phoneNumber}</div>
                        <div className="text-gray-500 sm:hidden mt-1 text-xs">{t('customers.table.bookings')}: {customer.bookingsCount}</div>
                        <div className="text-gray-500 lg:hidden mt-1 text-xs">{formatCurrency(customer.totalSpent)}</div>
                        <div className="text-gray-500 xl:hidden mt-1 text-xs">
                          {customer.lastBooking ? formatDate(customer.lastBooking) : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black hidden md:table-cell">{customer.email}</td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell">{customer.phoneNumber}</td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black hidden sm:table-cell">{customer.bookingsCount}</td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black hidden lg:table-cell">{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-3 py-3 text-xs md:text-sm text-black hidden xl:table-cell">
                        {customer.lastBooking ? formatDate(customer.lastBooking) : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </>
    )
  }

  const renderReports = () => {
    if (!reports) {
      return (
        <div className="mb-8">
          <h1 className="text-[16px] font-bold text-black mb-2">{t('reports.title')}</h1>
          <p className="text-[16px] text-black">{t('reports.subtitle')}</p>
          {reportsLoading && <div className="mt-8 text-center text-gray-500">{t('reports.loading')}</div>}
        </div>
      )
    }

    return (
      <>
        <div className="mb-6 md:mb-8">
          <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('reports.title')}</h1>
          <p className="text-sm md:text-base text-black">{t('reports.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-black mb-3 md:mb-4">{t('reports.revenue.title')}</h2>
            <div className="space-y-3">
              <div>
                <div className="text-[16px] text-black">{t('reports.revenue.total')}</div>
                <div className="text-[16px] font-bold text-black">{formatCurrency(reports.revenue.total)}</div>
              </div>
              <div>
                <div className="text-[16px] text-black">{t('reports.revenue.confirmed')}</div>
                <div className="text-xl font-semibold text-gray-700">{formatCurrency(reports.revenue.confirmed)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-black mb-3 md:mb-4">{t('reports.bookings.title')}</h2>
            <div className="space-y-3">
              <div>
                <div className="text-[16px] text-black">{t('reports.bookings.total')}</div>
                <div className="text-[16px] font-bold text-black">{reports.bookings.total}</div>
              </div>
              <div>
                <div className="text-[16px] text-black mb-2">{t('reports.bookings.byStatus')}</div>
                <div className="space-y-1">
                  {reports.bookings.byStatus.map((item) => (
                    <div key={item.status} className="flex justify-between text-[16px]">
                      <span className="text-black">{t(`bookings.status.${item.status.toLowerCase()}`)}</span>
                      <span className="font-medium text-black">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-bold text-black mb-3 md:mb-4">{t('reports.topProducts.title')}</h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('equipment.table.title')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider hidden md:table-cell">
                      {t('equipment.table.type')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('equipment.table.price')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('reports.topProducts.bookings')}
                    </th>
                  </tr>
                </thead>
              <tbody>
                {reports.topProducts.map((product) => (
                  <tr key={product.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 text-xs md:text-sm text-black">
                      <div className="font-medium">
                        {t(`equipment.types.${product.type}`)}
                        {product.type === 'ADULT_CLOTH' && product.size && ` (${product.size})`}
                      </div>
                      <div className="text-gray-500 md:hidden mt-1 text-xs">{formatCurrency(product.price)}</div>
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm text-black hidden md:table-cell">{t(`equipment.types.${product.type}`)}</td>
                    <td className="px-3 py-3 text-xs md:text-sm text-black whitespace-nowrap">{formatCurrency(product.price)}</td>
                    <td className="px-3 py-3 text-xs md:text-sm text-black">{product.bookingsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </>
    )
  }

  const renderGuestsCalendar = () => {
    const monthNames = [
      t('guestsCalendar.month1'), t('guestsCalendar.month2'), t('guestsCalendar.month3'), t('guestsCalendar.month4'),
      t('guestsCalendar.month5'), t('guestsCalendar.month6'), t('guestsCalendar.month7'), t('guestsCalendar.month8'),
      t('guestsCalendar.month9'), t('guestsCalendar.month10'), t('guestsCalendar.month11'), t('guestsCalendar.month12'),
    ]
    const useRange = Boolean(guestsCalendarDateFrom && guestsCalendarDateTo)
    let dateKeys: string[] = []
    if (useRange) {
      const from = new Date(guestsCalendarDateFrom + 'T00:00:00.000Z')
      const to = new Date(guestsCalendarDateTo + 'T00:00:00.000Z')
      const current = new Date(from)
      while (current <= to) {
        const y = current.getUTCFullYear()
        const m = current.getUTCMonth() + 1
        const d = current.getUTCDate()
        dateKeys.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
        current.setUTCDate(current.getUTCDate() + 1)
      }
    } else {
      const daysInMonth = new Date(guestsCalendarYear, guestsCalendarMonth, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        dateKeys.push(`${guestsCalendarYear}-${String(guestsCalendarMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      }
    }
    const firstDateKey = dateKeys[0]
    const firstDay = firstDateKey
      ? new Date(firstDateKey + 'T00:00:00.000Z').getUTCDay()
      : new Date(guestsCalendarYear, guestsCalendarMonth - 1, 1).getDay()
    const weeks: (string | null)[][] = []
    let week: (string | null)[] = []
    for (let i = 0; i < firstDay; i++) week.push(null)
    for (const key of dateKeys) {
      week.push(key)
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null)
      weeks.push(week)
    }

    return (
      <>
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t('guestsCalendar.title')}</h1>
          <p className="text-sm md:text-base text-gray-600">{t('guestsCalendar.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <label className="flex items-center gap-2 text-black">
              <span className="text-sm font-medium whitespace-nowrap">{t('guestsCalendar.dateFrom')}</span>
              <input
                type="date"
                value={guestsCalendarDateFrom}
                onChange={(e) => setGuestsCalendarDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-black"
              />
            </label>
            <label className="flex items-center gap-2 text-black">
              <span className="text-sm font-medium whitespace-nowrap">{t('guestsCalendar.dateTo')}</span>
              <input
                type="date"
                value={guestsCalendarDateTo}
                onChange={(e) => setGuestsCalendarDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-black"
              />
            </label>
            <span className="text-sm text-gray-500 hidden sm:inline">{t('guestsCalendar.orMonth')}</span>
            <select
              value={guestsCalendarMonth}
              onChange={(e) => setGuestsCalendarMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-black"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={guestsCalendarYear}
              onChange={(e) => setGuestsCalendarYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-black"
            >
              {[guestsCalendarYear - 2, guestsCalendarYear - 1, guestsCalendarYear, guestsCalendarYear + 1, guestsCalendarYear + 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => fetchGuestsCalendar()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              {t('bookings.applyFilter')}
            </button>
          </div>

          {guestsCalendarLoading ? (
            <div className="text-center py-12 text-gray-500">{t('bookings.loading')}</div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-gray-600">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
                  <div key={wd}>{t(`guestsCalendar.weekday.${wd.toLowerCase()}`)}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weeks.flat().map((dateKey, idx) => {
                  if (!dateKey) return <div key={`empty-${idx}`} className="aspect-square" />
                  const guests = guestsCalendarDates?.[dateKey] ?? 0
                  const [, , d] = dateKey.split('-')
                  return (
                    <div
                      key={dateKey}
                      className="aspect-square border border-gray-200 rounded-lg p-1 flex flex-col items-center justify-center bg-gray-50"
                    >
                      <span className="text-xs text-gray-600">{d}</span>
                      <span className="text-sm font-bold text-black">{guests}</span>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-sm text-gray-600">{t('guestsCalendar.hint')}</p>
            </>
          )}
        </div>
      </>
    )
  }

  const renderSettings = () => {
    return (
      <>
        <div className="mb-6 md:mb-8">
          <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('settings.title')}</h1>
          <p className="text-sm md:text-base text-gray-600">{t('settings.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.general.title')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[16px] font-medium text-black mb-2">
                    {t('settings.general.siteName')}
                  </label>
                  <input
                    type="text"
                    defaultValue="SkiRental"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[16px] text-black"
                  />
                </div>
          
              </div>
            </div>

            <div>
              <h2 className="text-[16px] font-semibold text-black mb-4">{t('settings.notifications.title')}</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input type="checkbox" id="email" className="mr-2" />
                  <label htmlFor="email" className="text-[16px] text-black">
                    {t('settings.notifications.email')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="sms" className="mr-2" />
                  <label htmlFor="sms" className="text-[16px] text-black">
                    {t('settings.notifications.sms')}
                  </label>
                </div>
              </div>
            </div>

            <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
              {t('settings.save')}
            </button>
          </div>
        </div>
      </>
    )
  }

  const renderLessonPricing = () => {
    return (
      <>
        {/* Lesson Pricing Form Modal */}
        {showLessonPricingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-black">
                    {editingLessonPricing ? t('lessonPricing.edit') : t('lessonPricing.add')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowLessonPricingForm(false)
                      setEditingLessonPricing(null)
                      setLessonPricingFormErrors({})
                      setLessonPricingFormData({ numberOfPeople: '', duration: '', price: '' })
                    }}
                    className="text-gray-500 hover:text-black"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleLessonPricingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('lessonPricing.form.numberOfPeople')} *
                    </label>
                    <select
                      value={lessonPricingFormData.numberOfPeople}
                      onChange={(e) => setLessonPricingFormData({ ...lessonPricingFormData, numberOfPeople: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        lessonPricingFormErrors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">{t('lessonPricing.form.selectPeople')}</option>
                      <option value="1">1 {t('lessonPricing.people')}</option>
                      <option value="2">2 {t('lessonPricing.peoplePlural')}</option>
                      <option value="3">3 {t('lessonPricing.peoplePlural')}</option>
                      <option value="4">4 {t('lessonPricing.peoplePlural')}</option>
                    </select>
                    {lessonPricingFormErrors.numberOfPeople && (
                      <p className="text-red-500 text-xs mt-1">{lessonPricingFormErrors.numberOfPeople}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('lessonPricing.form.duration')} *
                    </label>
                    <select
                      value={lessonPricingFormData.duration}
                      onChange={(e) => setLessonPricingFormData({ ...lessonPricingFormData, duration: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        lessonPricingFormErrors.duration ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">{t('lessonPricing.form.selectDuration')}</option>
                      <option value="1">1 {t('lessonPricing.hour')}</option>
                      <option value="2">2 {t('lessonPricing.hours')}</option>
                      <option value="3">3 {t('lessonPricing.hours')}</option>
                    </select>
                    {lessonPricingFormErrors.duration && (
                      <p className="text-red-500 text-xs mt-1">{lessonPricingFormErrors.duration}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('lessonPricing.form.price')} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={lessonPricingFormData.price}
                      onChange={(e) => setLessonPricingFormData({ ...lessonPricingFormData, price: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        lessonPricingFormErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {lessonPricingFormErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{lessonPricingFormErrors.price}</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
                    >
                      {t('lessonPricing.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLessonPricingForm(false)
                        setEditingLessonPricing(null)
                        setLessonPricingFormErrors({})
                        setLessonPricingFormData({ numberOfPeople: '', duration: '', price: '' })
                      }}
                      className="w-full sm:w-auto bg-gray-200 text-black px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                    >
                      {t('lessonPricing.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('lessonPricing.title')}</h1>
              <p className="text-sm md:text-base text-black">{t('lessonPricing.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setEditingLessonPricing(null)
                setLessonPricingFormData({ numberOfPeople: '', duration: '', price: '' })
                setShowLessonPricingForm(true)
              }}
              className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
            >
              {t('lessonPricing.add')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('lessonPricing.table.people')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('lessonPricing.table.duration')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('lessonPricing.table.price')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase tracking-wider">
                      {t('lessonPricing.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lessonPricingLoading && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-[16px] text-black" colSpan={4}>
                        {t('lessonPricing.loading')}
                      </td>
                    </tr>
                  )}
                  {!lessonPricingLoading && lessonPricing.length === 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-[16px] text-black" colSpan={4}>
                        {t('lessonPricing.empty')}
                      </td>
                    </tr>
                  )}
                  {!lessonPricingLoading &&
                    lessonPricing.map((item) => (
                      <tr key={item.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-3 text-xs md:text-sm text-black">
                          {item.numberOfPeople} {item.numberOfPeople === 1 ? t('lessonPricing.people') : t('lessonPricing.peoplePlural')}
                        </td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black">
                          {item.duration} {item.duration === 1 ? t('lessonPricing.hour') : t('lessonPricing.hours')}
                        </td>
                        <td className="px-3 py-3 text-xs md:text-sm text-black">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEditLessonPricing(item)}
                              className="w-full sm:w-auto flex text-xs md:text-sm items-center justify-center px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors bg-orange-600 text-white hover:bg-orange-700"
                            >
                              {t('lessonPricing.edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteLessonPricing(item.id)}
                              className="w-full sm:w-auto text-red-600 hover:text-red-700 text-xs md:text-sm px-3 py-2 text-center"
                            >
                              {t('lessonPricing.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    )
  }

  const renderTeachers = () => {
    return (
      <>
        <div className="mb-6 md:mb-8">
          <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('teachers.title')}</h1>
          <p className="text-sm md:text-base text-black">{t('teachers.subtitle')}</p>
        </div>

        {showTeacherForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-black mb-4">
                {editingTeacher ? t('teachers.edit') : t('teachers.add')}
              </h2>
              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">{t('teachers.firstname')} *</label>
                  <input
                    type="text"
                    value={teacherFormData.firstname}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, firstname: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-sm text-black ${
                      teacherFormErrors.firstname ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {teacherFormErrors.firstname && (
                    <p className="text-red-500 text-xs mt-1">{teacherFormErrors.firstname}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">{t('teachers.lastname')} *</label>
                  <input
                    type="text"
                    value={teacherFormData.lastname}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, lastname: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-sm text-black ${
                      teacherFormErrors.lastname ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {teacherFormErrors.lastname && (
                    <p className="text-red-500 text-xs mt-1">{teacherFormErrors.lastname}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-medium"
                  >
                    {editingTeacher ? t('teachers.save') : t('teachers.add')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherForm(false)
                      setEditingTeacher(null)
                      setTeacherFormData({ firstname: '', lastname: '' })
                      setTeacherFormErrors({})
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-50 text-sm"
                  >
                    {t('lessonPricing.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={() => {
              setEditingTeacher(null)
              setTeacherFormData({ firstname: '', lastname: '' })
              setTeacherFormErrors({})
              setShowTeacherForm(true)
            }}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-medium"
          >
            {t('teachers.add')}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase">{t('teachers.firstname')}</th>
                  <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase">{t('teachers.lastname')}</th>
                  <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase">{t('teachers.lessonsCount')}</th>
                  <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-black uppercase">{t('lessons.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {teachersLoading && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-black" colSpan={4}>{t('teachers.loading')}</td>
                  </tr>
                )}
                {!teachersLoading && teachers.length === 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-black" colSpan={4}>{t('teachers.empty')}</td>
                  </tr>
                )}
                {!teachersLoading &&
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm text-black">{teacher.firstname}</td>
                      <td className="px-3 py-3 text-sm text-black">{teacher.lastname}</td>
                      <td className="px-3 py-3 text-sm text-black">{teacher.lessonsCount ?? 0}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTeacher(teacher)}
                            className="text-xs md:text-sm px-3 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                          >
                            {t('lessonPricing.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="text-xs md:text-sm text-red-600 hover:text-red-700"
                          >
                            {t('teachers.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  }

  const renderPrices = () => {
    // Helper function to convert camelCase to spaced words
    const formatCamelCase = (text: string): string => {
      if (!text) return text
      // Replace camelCase with spaces
      return text
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals
        .trim()
    }

    const priceKeys = [
      'skiSetStandard', 'skiSetProfessional', 'skiSetKidsStandard',
      'skiStandard', 'skiProfessional', 'skiBootsStandard',
      'snowboardSetStandard', 'snowboardSetKidsStandard', 'snowboardSetProfessional',
      'boardStandard', 'boardProfessional', 'snowboardBootsStandard',
      'gogglesStandard', 'helmetStandard', 'polesStandard', 'glovesStandard',
      'jacket', 'pants', 'sledge', 'instructor'
    ]

    const defaultPrices: Record<string, { type: string; includes: string; price: string }> = {
      skiSetStandard: { type: 'standard', includes: 'includesSkiBootsPoles', price: '50 ₾' },
      skiSetProfessional: { type: 'professional', includes: 'includesSkiBootsPoles', price: '60-150 ₾' },
      skiSetKidsStandard: { type: 'standard', includes: 'includesSkiBootsPoles', price: '40 ₾' },
      skiStandard: { type: 'standard', includes: 'includesSkiOnly', price: '40 ₾' },
      skiProfessional: { type: 'professional', includes: 'includesSkiOnly', price: '70 ₾' },
      skiBootsStandard: { type: 'standard', includes: 'includesBootsOnly', price: '30 ₾' },
      snowboardSetStandard: { type: 'standard', includes: 'includesBoardBoots', price: '70 ₾' },
      snowboardSetKidsStandard: { type: 'standard', includes: 'includesBoardBoots', price: '60 ₾' },
      snowboardSetProfessional: { type: 'professional', includes: 'includesBoardBoots', price: '80-150 ₾' },
      boardStandard: { type: 'standard', includes: 'includesBoardOnly', price: '50 ₾' },
      boardProfessional: { type: 'professional', includes: 'includesBoardOnly', price: '70 ₾' },
      snowboardBootsStandard: { type: 'standard', includes: 'includesBootsOnly', price: '40 ₾' },
      gogglesStandard: { type: 'accessory', includes: 'accessory', price: '10 ₾' },
      helmetStandard: { type: 'accessory', includes: 'accessory', price: '10 ₾' },
      polesStandard: { type: 'accessory', includes: 'accessory', price: '10 ₾' },
      glovesStandard: { type: 'accessory', includes: 'accessory', price: '10 ₾' },
      jacket: { type: 'clothes', includes: 'clothes', price: '20 ₾' },
      pants: { type: 'clothes', includes: 'clothes', price: '20 ₾' },
      sledge: { type: 'forSnow', includes: 'forSnow', price: '30 ₾' },
      instructor: { type: 'forOnePerson', includes: 'forOnePerson', price: '120 ₾' }
    }

    const handlePriceChange = (itemKey: string, field: string, value: string) => {
      setEditingPrices(prev => ({
        ...prev,
        [itemKey]: {
          ...(prev[itemKey] || (prices.find(p => p.itemKey === itemKey) || defaultPrices[itemKey as keyof typeof defaultPrices])),
          [field]: value
        }
      }))
    }

    const handleSavePrices = () => {
      const pricesToSave = priceKeys.map(itemKey => {
        const edited = editingPrices[itemKey]
        const existing = prices.find(p => p.itemKey === itemKey)
        const defaultPrice = defaultPrices[itemKey as keyof typeof defaultPrices]
        
        return {
          itemKey,
          type: edited?.type || existing?.type || defaultPrice.type,
          includes: edited?.includes || existing?.includes || defaultPrice.includes,
          price: edited?.price || existing?.price || defaultPrice.price
        }
      })
      
      handlePricesSubmit(pricesToSave)
      setEditingPrices({})
    }

    return (
      <>
        <div className="mb-6 md:mb-8">
          <h1 className="text-lg md:text-xl font-bold text-black mb-1 md:mb-2">{t('prices.title')}</h1>
          <p className="text-sm md:text-base text-gray-600">{t('prices.subtitle')}</p>
        </div>

        {pricesLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-black text-[16px]">{t('prices.loading')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-semibold text-sm md:text-base">{t('prices.item')}</th>
                    <th className="px-4 py-3 text-left text-white font-semibold text-sm md:text-base">{t('prices.type')}</th>
                    <th className="px-4 py-3 text-left text-white font-semibold text-sm md:text-base">{t('prices.includes')}</th>
                    <th className="px-4 py-3 text-left text-white font-semibold text-sm md:text-base">{t('prices.price')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {priceKeys.map((itemKey) => {
                    const existing = prices.find(p => p.itemKey === itemKey)
                    const defaultPrice = defaultPrices[itemKey as keyof typeof defaultPrices]
                    const edited = editingPrices[itemKey]
                    const current = edited || existing || { itemKey, ...defaultPrice }

                    return (
                      <tr key={itemKey} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm md:text-base text-black font-medium">
                          {t(`prices.${itemKey}`)}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={current.type}
                            onChange={(e) => handlePriceChange(itemKey, 'type', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm md:text-base text-black"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={formatCamelCase(current.includes)}
                            onChange={(e) => {
                              // Keep the formatted value with spaces for better readability
                              handlePriceChange(itemKey, 'includes', e.target.value)
                            }}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm md:text-base text-black"
                            style={{ wordSpacing: '0.2em', letterSpacing: '0.02em' }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={current.price}
                            onChange={(e) => handlePriceChange(itemKey, 'price', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm md:text-base text-black"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSavePrices}
                disabled={submittingPrices}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {submittingPrices ? t('prices.saving') : t('prices.save')}
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      case 'bookings':
        return renderBookings()
      case 'lessons':
        return renderLessons()
      case 'equipment':
        return renderEquipment()
      case 'customers':
        return renderCustomers()
      case 'reports':
        return renderReports()
      case 'guestsCalendar':
        return renderGuestsCalendar()
      case 'settings':
        return renderSettings()
      case 'lessonPricing':
        return renderLessonPricing()
      case 'teachers':
        return renderTeachers()
      case 'prices':
        return renderPrices()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-[70px] left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-56 sm:w-64 bg-white shadow-lg z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 sm:p-6">
          <Link href="/" className="flex items-center space-x-2 mb-6 md:mb-8">
            <span className="text-xl sm:text-2xl font-bold text-red-600">SkiRental</span>
            <span className="text-sm sm:text-base text-black hidden sm:inline">{t('adminLabel')}</span>
          </Link>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-orange-600 text-white'
                    : 'text-black '
                }`}
              >
                <span className="font-medium">{t(item.labelKey)}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <Link
            href="/"
              
            className="flex items-center space-x-2 text-[16px] text-black hover:text-red-600 transition-colors"
          >
            <span>←</span>
            <span>{t('backToSite')}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-56 lg:ml-64 p-3 sm:p-4 md:p-6 lg:p-8 pt-14 sm:pt-16 md:pt-8">{renderContent()}</main>
    </div>
  )
}

export default AdminPage
