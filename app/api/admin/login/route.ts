import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, adminSessionToken } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  const validUser = process.env.BASIC_AUTH_USER
  const validPassword = process.env.BASIC_AUTH_PASSWORD

  if (!validUser || !validPassword || username !== validUser || password !== validPassword) {
    return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, await adminSessionToken(validUser, validPassword), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })
  return response
}
