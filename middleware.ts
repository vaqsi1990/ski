import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  const isAdminPath = /^\/(geo|en|ru)\/admin(\/.*)?$|^\/admin(\/.*)?$/.test(pathname);

  if (pathname === '/' ) {
    const url = request.nextUrl.clone();
    url.pathname = '/geo';
    return NextResponse.redirect(url);
  }

  if (isAdminPath) {
    const basicAuth = request.headers.get("authorization");

    if (basicAuth) {
      const [user, pwd] = atob(basicAuth.split(" ")[1] || "").split(":");

      const validUser = process.env.BASIC_AUTH_USER;
      const validPassword = process.env.BASIC_AUTH_PASSWORD;

      if (user === validUser && pwd === validPassword) {
        return intlMiddleware(request); 
      }
    }

   
    const url = request.nextUrl.clone();
    url.pathname = "/api/basicauth";
    return NextResponse.rewrite(url);
  }


  return intlMiddleware(request);
}


export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
