import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();

export async function middleware(request) {
  let token = request.cookies.get("token");
  if (!token || !token.value) {
    const pathname = request.nextUrl.pathname;
    const url = new URL(request.nextUrl.origin + "/login");
    url.search = `?pathname=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  const decode = await jwtVerify(
    token.value,
    encoder.encode(process.env.JWT_SECRET)
  );
  if (!decode || !decode.payload) {
    const pathname = request.nextUrl.pathname;
    const url = new URL(request.nextUrl.origin + "/login");
    url.search = `?pathname=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: "/admin/(.*)",
};
