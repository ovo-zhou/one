"use server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
/**
 * 解码cookie
 * @param {cookie} request
 */
export async function decodeCookie(request) {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) {
    return null;
  }
  const { value } = token;
  const userInfo = decodeJwt(value);
  return userInfo;
}
