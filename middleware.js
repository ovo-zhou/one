
import { NextResponse } from 'next/server'
export function middleware(request) {
  let token = request.cookies.get('token')
  if(!token){
    // 当没有登陆时，跳转到登陆页面，并且记住挑战之前的href
    const originHref=request.nextUrl.href
    const url=new URL(request.nextUrl.origin+'/login')
    url.search=`?originHref=${encodeURIComponent(originHref)}`
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: '/admin/(.*)',
}