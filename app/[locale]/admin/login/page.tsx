'use client'

import React, { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

const AdminLoginPage = () => {
  const t = useTranslations('admin.login')
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        setError(t('error'))
        return
      }

      router.replace('/admin')
      router.refresh()
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFAFA] flex items-center justify-center px-4 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 md:p-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-black text-center mb-2">
          {t('title')}
        </h1>
        <p className="text-center text-gray-600 mb-6">{t('subtitle')}</p>

        <label className="block text-[16px] font-medium text-black mb-2" htmlFor="username">
          {t('username')}
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[16px] text-black mb-4"
          required
        />

        <label className="block text-[16px] font-medium text-black mb-2" htmlFor="password">
          {t('password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[16px] text-black mb-4"
          required
        />

        {error && <p className="text-red-600 text-[15px] mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-[18px] font-bold disabled:opacity-50"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  )
}

export default AdminLoginPage
