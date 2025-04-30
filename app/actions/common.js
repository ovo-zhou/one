import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
const encoder = new TextEncoder();
/**
 * 解码cookie，返回用户信息
 * @param {cookie} request
 */
export async function decodeCookie() {
  const cookieStore =await cookies();
  const token = cookieStore.get("token");
  if (!token) {
    return null;
  }
  const { value } = token;
  try {
    const { payload } = await jwtVerify(
      value,
      encoder.encode(process.env.JWT_SECRET)
    );
    return {
      name: payload.name,
      avatar: payload.avatar,
      id: payload.id,
    };
  } catch (e) {
    return null;
  }
}
export function withAuth(actionFn) {
  return async function (params) {
    const user = await decodeCookie();
    if (user) {
      return await actionFn(params);
    }
    redirect("/login");
  };
}
