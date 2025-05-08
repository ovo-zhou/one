import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
const encoder = new TextEncoder();
/**
 * 解码cookie，返回用户信息，如果没有登录或者登陆过期，返回null
 */
export async function getUserInfo() {
  const cookieStore =await cookies();
  const token = cookieStore.get("token");
  // token为空，返回null
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
      isAdmin: payload.isAdmin,
    };
  } catch (e) {
    // 解码失败，返回空
    return null;
  }
}
export function withAuth(actionFn) {
  return async function (params) {
    const user = await getUserInfo();
    if (user) {
      return await actionFn(params);
    }
    redirect("/login");
  };
}
