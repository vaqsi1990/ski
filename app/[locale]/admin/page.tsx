'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'

const AdminPage = () => {
  const t = useTranslations('admin')
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const [data, setData] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/overview', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load admin data')
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale || 'ka-GE', { style: 'currency', currency: 'GEL' }).format(amount)

  const stats = [
    { labelKey: 'stats.totalBookings', value: data?.stats.totalBookings ?? 0 },
    { labelKey: 'stats.activeRentals', value: data?.stats.activeRentals ?? 0 },
    {
      labelKey: 'stats.revenue',
      value:
        data?.stats.totalRevenue !== undefined
          ? formatCurrency(data.stats.totalRevenue)
          : formatCurrency(0),
    },
    { labelKey: 'stats.equipment', value: data?.stats.totalProducts ?? 0 },
  ]

  const recentBookings = data?.bookings ?? []

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
    { id: 'reports', labelKey: 'menu.reports' },
    { id: 'settings', labelKey: 'menu.settings' },
  ]

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
            <span className="text-sm text-gray-500">{t('adminLabel')}</span>
          </Link>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
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
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <span>←</span>
            <span>{t('backToSite')}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">{t(stat.labelKey)}</div>
                {loading && <div className="h-2 w-12 bg-gray-100 rounded animate-pulse" />}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {loading ? '—' : String(stat.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t('bookings.recent')}</h2>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                {t('bookings.viewAll')} →
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                {error}
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('bookings.table.customer')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('bookings.table.equipment')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('bookings.table.date')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('bookings.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-400" colSpan={4}>
                        {t('bookings.loading')}
                      </td>
                    </tr>
                  )}
                  {!loading && recentBookings.length === 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-500" colSpan={4}>
                        {t('bookings.empty')}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    recentBookings.map((booking) => {
                      const statusKey = booking.status.toLowerCase()
                      return (
                        <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{booking.customer}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{booking.equipment}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(booking.startDate)}
                          </td>
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

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('quickActions.title')}</h2>
            
            <div className="space-y-3">
              <button className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-left">
                {t('quickActions.addBooking')}
              </button>
              <button className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left">
                {t('quickActions.manageEquipment')}
              </button>
              <button className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left">
                {t('quickActions.addCustomer')}
              </button>
              <button className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left">
                {t('quickActions.generateReport')}
              </button>
            </div>

            {/* Activity Feed */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('activity.title')}</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{t('activity.bookingCreated')}</p>
                    <p className="text-xs text-gray-500">{t('activity.minutesAgo', { count: 2 })}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{t('activity.equipmentReturned')}</p>
                    <p className="text-xs text-gray-500">{t('activity.minutesAgo', { count: 15 })}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{t('activity.paymentReceived')}</p>
                    <p className="text-xs text-gray-500">{t('activity.hourAgo', { count: 1 })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPage
