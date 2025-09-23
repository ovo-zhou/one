import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const origin = requestHeaders.get('origin')
  const xForwardedHost = requestHeaders.get('x-forwarded-host')
  // 如果两者不一致，统一设置为相同的值
  if (origin && xForwardedHost && origin !== xForwardedHost) {
    requestHeaders.set('x-forwarded-host', new URL(origin).host)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  return response
}

export const config = {
  matcher: '/:path*',
}