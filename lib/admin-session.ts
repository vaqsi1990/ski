export const ADMIN_SESSION_COOKIE = 'admin_session'

export async function adminSessionToken(user: string, password: string) {
  const encoded = new TextEncoder().encode(`${user}\0${password}\0ski-admin-v1`)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function expectedAdminSessionToken() {
  const user = process.env.BASIC_AUTH_USER
  const password = process.env.BASIC_AUTH_PASSWORD
  if (!user || !password) return null
  return adminSessionToken(user, password)
}
