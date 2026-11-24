import { restoreWechatLogin } from "../api/auth";
import { getToken } from "./session";
import { request, RequestError, type RequestOptions } from "./request";

async function restoreExistingAccount(): Promise<void> {
  if (!(await restoreWechatLogin()))
    throw new Error("账号不存在，请返回首页创建店铺，或从公开名片提交预约。");
}

export async function authenticatedRequest<
  T extends string | Record<string, unknown> | ArrayBuffer,
>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!getToken()) await restoreExistingAccount();
  try {
    return await request<T>(path, options);
  } catch (error) {
    if (!(error instanceof RequestError) || error.statusCode !== 401) throw error;
    await restoreExistingAccount();
  }
  // Retry only once after authentication rejection, never after network errors
  // or an ambiguous write result. The second 401 is returned to the caller.
  return request<T>(path, options);
}
