import { request } from "../utils/request";
import { getToken, saveSession } from "../utils/session";
import type { Account } from "../models/account";

type WechatSession = { token: string; expiresAt: number; user: Account };

let pendingLogin: Promise<boolean> | undefined;

async function exchangeWechatSession(existingOnly: boolean): Promise<boolean> {
  const loginCode = await new Promise<string>((resolve, reject) => {
    wx.login({
      timeout: 10_000,
      success: (result) => {
        if (result.code) resolve(result.code);
        else reject(new Error("微信登录失败，请重试"));
      },
      fail: () => {
        reject(new Error("微信登录失败，请重试"));
      },
    });
  });
  const session = await request<WechatSession | { session: null }>("/api/v1/auth/wechat", {
    method: "POST",
    data: { loginCode, existingOnly },
    timeout: 30_000,
  });
  if ("session" in session) return false;
  saveSession(session);
  return true;
}

async function loginWechat(existingOnly: boolean): Promise<boolean> {
  // Share one identity exchange when several business requests need to recover.
  while (pendingLogin) {
    const registered = await pendingLogin;
    if (registered || existingOnly) return registered;
  }
  const pending = exchangeWechatSession(existingOnly).finally(() => {
    if (pendingLogin === pending) pendingLogin = undefined;
  });
  pendingLogin = pending;
  return pending;
}

export async function ensureWechatLogin(): Promise<void> {
  if (getToken()) return;
  await loginWechat(false);
}

export async function restoreWechatLogin(): Promise<boolean> {
  // Local expiry is enough to decide whether to try the current session.
  // Private requests sent to the server still validate it; a server 401 triggers recovery.
  if (getToken()) return true;
  return loginWechat(true);
}
