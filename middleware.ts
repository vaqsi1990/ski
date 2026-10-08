import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { ADMIN_SESSION_COOKIE, expectedAdminSessionToken } from "@/lib/admin-session";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = /^\/(ka|en|ru)\/admin(\/.*)?$|^\/admin(\/.*)?$/.test(pathname);
  const isLoginPath = /^\/(ka|en|ru)\/admin\/login\/?$/.test(pathname);

  if (pathname === '/' ) {
    const url = request.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.redirect(url);
  }

  if (isAdminPath && !isLoginPath) {
    const expected = await expectedAdminSessionToken();
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!expected || session !== expected) {
      const url = request.nextUrl.clone();
      const locale = pathname.match(/^\/(ka|en|ru)(?=\/)/)?.[1] ?? 'en';
      url.pathname = `/${locale}/admin/login`;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}


export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
