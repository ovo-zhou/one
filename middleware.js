import { NextResponse } from "next/server";
export function middleware(request) {
  let token = request.cookies.get("token");
  console.log(token);
  if (!token) {
    // 当没有登陆时，跳转到登陆页面，并且记住跳转之前的href
    const pathname = request.nextUrl.pathname;
    const url = new URL(request.nextUrl.origin + "/login");
    url.search = `?pathname=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: "/admin/(.*)",
};
