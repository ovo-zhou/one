
import { NextResponse } from 'next/server'
export function middleware(request) {
  let token = request.cookies.get('token')
  console.log(token)
  if(!token){
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: '/admin/(.*)',
}