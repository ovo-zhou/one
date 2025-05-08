import { NextResponse } from "next/server";
import { getUserInfo } from "./app/actions";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();
/**
 * 这个中间件用于验证用户是否登录，集体策略如下：
 * 用户未登录，重定向到登录页面
 * 用户登录后，token验证失败，重定向到登录页面
 * 用户登录后，非管理员，重定向到非管理员提示页面
 */
export async function middleware(request) {
  const user = await getUserInfo();
  if (!user) {
    const pathname = request.nextUrl.pathname;
    const url = new URL(request.nextUrl.origin + "/login");
    url.search = `?pathname=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // 非管理员，重定向到非管理员提示页面
  if (!user.isAdmin) {
    const url = new URL(request.nextUrl.origin + "/error");
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: "/admin/(.*)",
};
