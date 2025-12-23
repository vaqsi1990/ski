'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BookingStatus } from '@/app/generated/prisma/enums'
import { ProductType } from '@/app/generated/prisma/enums'
import { z } from 'zod'
import ImageUpload from '@/components/CloudinaryUploader'

const AdminPage = () => {
  const t = useTranslations('admin')
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Dashboard state
  type AdminStats = {
    totalBookings: number
    activeRentals: number
    totalRevenue: number
    totalProducts: number
  }

  type AdminBooking = {
    id: string
    customer: string
    equipment: string
    startDate: string
    endDate: string
    status: string
  }

  type AdminOverview = {
    stats: AdminStats
    bookings: AdminBooking[]
  }

  const [dashboardData, setDashboardData] = useState<AdminOverview | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)

  // Bookings state
  type Booking = {
    id: string
    customer: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    personalId: string
    equipment: string
    productId: string
    startDate: string
    endDate: string
    status: string
    totalPrice: number
    createdAt: string
    updatedAt: string
  }

  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsFilter, setBookingsFilter] = useState<string>('all')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)

  // Equipment state
  type Product = {
    id: string
    type: string
    images: string[]
    title: string
    price: number
    bookingsCount: number
    createdAt: string
    updatedAt: string
  }

  const [equipment, setEquipment] = useState<Product[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all')
  const [showEquipmentForm, setShowEquipmentForm] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Product | null>(null)

  // Customers state
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

  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)

  // Form state
  const [bookingFormData, setBookingFormData] = useState<{
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
  }>({
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
  const [bookingFormErrors, setBookingFormErrors] = useState<Record<string, string>>({})
  const [equipmentFormData, setEquipmentFormData] = useState<{
    title: string
    type: ProductType
    price: string
    images: string[]
  }>({
    title: '',
    type: ProductType.SKI,
    price: '',
    images: [],
  })
  const [equipmentFormErrors, setEquipmentFormErrors] = useState<Record<string, string>>({})
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])

  // Zod schemas
  const bookingSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    personalId: z.string().optional(),
    productId: z.string().min(1, 'Equipment is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    totalPrice: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be a positive number'),
    status: z.nativeEnum(BookingStatus),
  })

  const equipmentSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.nativeEnum(ProductType),
    price: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be a positive number'),
    images: z.array(z.string()).optional(),
  })

  // Reports state
  type ReportData = {
    revenue: { total: number; confirmed: number }
    bookings: {
      total: number
      byStatus: Array<{ status: string; count: number }>
      byMonth: Array<{ month: string; count: number }>
    }
    topProducts: Array<{
      id: string
      title: string
      type: string
      price: number
      bookingsCount: number
    }>
  }

  const [reports, setReports] = useState<ReportData | null>(null)
  const [reportsLoading, setReportsLoading] = useState(false)

  // Fetch dashboard data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/admin/overview', { cache: 'no-store' })
          if (!response.ok) throw new Error('Failed to load admin data')
          const json = await response.json()
          setDashboardData(json)
        } catch (err) {
          console.error(err)
        } finally {
          setDashboardLoading(false)
        }
      }
      fetchData()
    }
  }, [activeTab])

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
  }, [activeTab, bookingsFilter])

  const fetchBookings = async () => {
    setBookingsLoading(true)
    try {
      const url = `/api/admin/bookings${bookingsFilter !== 'all' ? `?status=${bookingsFilter}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load bookings')
      const json = await response.json()
      setBookings(json.bookings || [])
    } catch (err) {
      console.error(err)
    } finally {
      setBookingsLoading(false)
    }
  }

  // Fetch equipment
  useEffect(() => {
    if (activeTab === 'equipment') {
      fetchEquipment()
    }
  }, [activeTab, equipmentFilter])

  const fetchEquipment = async () => {
    setEquipmentLoading(true)
    try {
      const url = `/api/admin/equipment${equipmentFilter !== 'all' ? `?type=${equipmentFilter}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load equipment')
      const json = await response.json()
      setEquipment(json.products || [])
    } catch (err) {
      console.error(err)
    } finally {
      setEquipmentLoading(false)
    }
  }

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
  const handleBookingStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
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

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete booking')
      fetchBookings()
    } catch (err) {
      console.error(err)
      alert('Failed to delete booking')
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
      
      const response = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validated,
          price: parseFloat(validated.price),
          images: equipmentFormData.images,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create equipment')
      }

      setShowEquipmentForm(false)
      setEquipmentFormData({
        title: '',
        type: ProductType.SKI,
        price: '',
        images: [],
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
        alert(err instanceof Error ? err.message : 'Failed to create equipment')
      }
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale || 'ka-GE', { style: 'currency', currency: 'GEL' }).format(amount)

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(value),
    )

  const statusIsActive = (status: string) => ['PENDING', 'CONFIRMED'].includes(status)

  const menuItems = [
    { id: 'dashboard', labelKey: 'menu.dashboard' },
    { id: 'bookings', labelKey: 'menu.bookings' },
    { id: 'equipment', labelKey: 'menu.equipment' },
    { id: 'customers', labelKey: 'menu.customers' },
   
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

    const recentBookings = dashboardData?.bookings ?? []

    return (
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-black">{t('bookings.recent')}</h2>
            <button
              onClick={() => setActiveTab('bookings')}
              className="text-[16px] text-red-600 hover:text-red-700 font-medium"
            >
              {t('bookings.viewAll')} →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.customer')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.equipment')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.date')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboardLoading && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={4}>
                      {t('bookings.loading')}
                    </td>
                  </tr>
                )}
                {!dashboardLoading && recentBookings.length === 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={4}>
                      {t('bookings.empty')}
                    </td>
                  </tr>
                )}
                {!dashboardLoading &&
                  recentBookings.map((booking) => {
                    const statusKey = booking.status.toLowerCase()
                    return (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-[16px] text-black">{booking.customer}</td>
                        <td className="py-3 px-4 text-[16px] text-black">{booking.equipment}</td>
                        <td className="py-3 px-4 text-[16px] text-black">{formatDate(booking.startDate)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              statusIsActive(booking.status)
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {t(`bookings.status.${statusKey}`)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">{t('bookings.add')}</h2>
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
                      {t('bookings.form.personalId')}
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
                          {product.title} - {formatCurrency(product.price)}
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

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
                      className="bg-gray-200 text-black px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t('bookings.form.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[16px] font-bold text-black mb-2">{t('bookings.title')}</h1>
              <p className="text-[16px] text-black">{t('bookings.subtitle')}</p>
            </div>
           
          </div>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <label className="text-[16px] font-medium text-black">{t('bookings.filter')}:</label>
          <select
            value={bookingsFilter}
            onChange={(e) => setBookingsFilter(e.target.value)}
            
            className="border border-gray-300 rounded-lg px-4 py-2 text-[16px] text-black"
          >
            <option value="all">{t('bookings.all')}</option>
            <option value="PENDING">{t('bookings.status.pending')}</option>
            <option value="CONFIRMED">{t('bookings.status.confirmed')}</option>
            <option value="CANCELLED">{t('bookings.status.cancelled')}</option>
            <option value="COMPLETED">{t('bookings.status.completed')}</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.customer')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.equipment')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.date')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.price')}
                  </th>
                  
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.status')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('bookings.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookingsLoading && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={6}>
                      {t('bookings.loading')}
                    </td>
                  </tr>
                )}
                {!bookingsLoading && bookings.length === 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[16px] text-black" colSpan={6}>
                      {t('bookings.empty')}
                    </td>
                  </tr>
                )}
                {!bookingsLoading &&
                  bookings.map((booking) => {
                    const statusKey = booking.status.toLowerCase()
                    return (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-[16px] text-black">{booking.customer}</td>
                        <td className="py-3 px-4 text-[16px] text-black">{booking.equipment}</td>
                        <td className="py-3 px-4 text-[16px] text-black">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </td>
                     
                        <td className="py-3 px-4">
                          <select
                            value={booking.status}
                            onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                            className={`text-[16px] font-medium px-3 py-1 rounded-full border-0 ${
                              statusIsActive(booking.status)
                                ? 'bg-green-100 text-green-800'
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
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-700 text-[16px]"
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
      </>
    )
  }

  const renderEquipment = () => {
    return (
      <>
        {/* Equipment Form Modal */}
        {showEquipmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[16px] font-bold text-black">{t('equipment.add')}</h2>
                  <button
                    onClick={() => {
                      setShowEquipmentForm(false)
                      setEquipmentFormErrors({})
                      setEquipmentFormData({
                        title: '',
                        type: ProductType.SKI,
                        price: '',
                        images: [],
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
                      {t('equipment.form.title')} *
                    </label>
                    <input
                      type="text"
                      value={equipmentFormData.title}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, title: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-2 text-black ${
                        equipmentFormErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {equipmentFormErrors.title && (
                      <p className="text-red-500 text-xs mt-1">{equipmentFormErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('equipment.form.type')} *
                    </label>
                    <select
                      value={equipmentFormData.type}
                      onChange={(e) =>
                        setEquipmentFormData({ ...equipmentFormData, type: e.target.value as ProductType })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                    >
                      <option value="SKI">{t('equipment.types.SKI')}</option>
                      <option value="SNOWBOARD">{t('equipment.types.SNOWBOARD')}</option>
                      <option value="OTHER">{t('equipment.types.OTHER')}</option>
                    </select>
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

                  <div>
                    <label className="block text-[16px] font-medium text-black mb-1">
                      {t('equipment.form.images')}
                    </label>
                    <ImageUpload
                      value={equipmentFormData.images}
                      onChange={(urls) => setEquipmentFormData({ ...equipmentFormData, images: urls })}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {t('equipment.form.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEquipmentForm(false)
                        setEquipmentFormErrors({})
                        setEquipmentFormData({
                          title: '',
                          type: ProductType.SKI,
                          price: '',
                          images: [],
                        })
                      }}
                      className="bg-gray-200 text-black px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t('equipment.form.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[16px] font-bold text-black mb-2">{t('equipment.title')}</h1>
              <p className="text-[16px] text-gray-600">{t('equipment.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setEditingEquipment(null)
                setShowEquipmentForm(true)
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('equipment.add')}
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <label className="text-[16px] font-medium text-black">{t('equipment.filter')}:</label>
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-[16px] text-black"
          >
            <option value="all">{t('equipment.all')}</option>
            <option value="SKI">{t('equipment.types.SKI')}</option>
            <option value="SNOWBOARD">{t('equipment.types.SNOWBOARD')}</option>
            <option value="OTHER">{t('equipment.types.OTHER')}</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('equipment.table.title')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('equipment.table.type')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('equipment.table.price')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('equipment.table.bookings')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
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
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-[16px] text-black">{item.title}</td>
                      <td className="py-3 px-4 text-[16px] text-black">{t(`equipment.types.${item.type}`)}</td>
                      <td className="py-3 px-4 text-[16px] text-black">{formatCurrency(item.price)}</td>
                      <td className="py-3 px-4 text-[16px] text-black">{item.bookingsCount}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteEquipment(item.id)}
                          className="text-red-600 hover:text-red-700 text-[16px]"
                        >
                          {t('equipment.delete')}
                        </button>
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

  const renderCustomers = () => {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-[16px] font-bold text-black mb-2">{t('customers.title')}</h1>
          <p className="text-[16px] text-black">{t('customers.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('customers.table.name')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('customers.table.email')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('customers.table.phone')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('customers.table.bookings')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('customers.table.totalSpent')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
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
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-[16px] text-black">
                        {customer.firstName} {customer.lastName}
                      </td>
                      <td className="py-3 px-4 text-[16px] text-black">{customer.email}</td>
                      <td className="py-3 px-4 text-[16px] text-black">{customer.phoneNumber}</td>
                      <td className="py-3 px-4 text-[16px] text-black">{customer.bookingsCount}</td>
                      <td className="py-3 px-4 text-[16px] text-black">{formatCurrency(customer.totalSpent)}</td>
                      <td className="py-3 px-4 text-[16px] text-black">
                        {customer.lastBooking ? formatDate(customer.lastBooking) : '—'}
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
        <div className="mb-8">
          <h1 className="text-[16px] font-bold text-black mb-2">{t('reports.title')}</h1>
          <p className="text-[16px] text-black">{t('reports.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-[16px] font-bold text-black mb-4">{t('reports.revenue.title')}</h2>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-[16px] font-bold text-black mb-4">{t('reports.bookings.title')}</h2>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-[16px] font-bold text-black mb-4">{t('reports.topProducts.title')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('equipment.table.title')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('equipment.table.type')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('equipment.table.price')}
                  </th>
                  <th className="text-left py-3 px-4 text-[16px] font-semibold text-black">
                    {t('reports.topProducts.bookings')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.topProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-[16px] text-black">{product.title}</td>
                    <td className="py-3 px-4 text-[16px] text-black">{t(`equipment.types.${product.type}`)}</td>
                    <td className="py-3 px-4 text-[16px] text-black">{formatCurrency(product.price)}</td>
                    <td className="py-3 px-4 text-[16px] text-black">{product.bookingsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  }

  const renderSettings = () => {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-[16px] font-bold text-black mb-2">{t('settings.title')}</h1>
          <p className="text-gray-600">{t('settings.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      case 'bookings':
        return renderBookings()
      case 'equipment':
        return renderEquipment()
      case 'customers':
        return renderCustomers()
      case 'reports':
        return renderReports()
      case 'settings':
        return renderSettings()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-lg"
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
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <Link href="/" className="flex items-center space-x-2 mb-8">
            <span className="text-2xl font-bold text-red-600">SkiRental</span>
            <span className="text-[16px] text-black">{t('adminLabel')}</span>
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
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">{renderContent()}</main>
    </div>
  )
}

export default AdminPage
