import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppBindings } from "../core/context";

const base = "https://api.weixin.qq.com";

function configuration(env: AppBindings) {
  if (!env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET) {
    throw new HTTPException(503, { message: "微信登录尚未配置，请联系管理员" });
  }
  return { appId: env.WECHAT_APP_ID, secret: env.WECHAT_APP_SECRET };
}

async function callWechat(path: string, init?: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error("upstream status");
    return await response.json();
  } catch {
    // Never expose URLs, authorization codes, tokens, or WeChat response bodies in errors/logs.
    throw new HTTPException(502, { message: "微信服务暂不可用，请稍后重试登录" });
  }
}

export async function verifyWechatLogin(env: AppBindings, loginCode: string) {
  const { appId, secret } = configuration(env);
  const query = new URLSearchParams({
    appid: appId,
    secret,
    js_code: loginCode,
    grant_type: "authorization_code",
  });
  const identity = z
    .object({ openid: z.string().min(1) })
    .safeParse(await callWechat(`/sns/jscode2session?${query}`));
  if (!identity.success)
    throw new HTTPException(401, {
      message: "微信登录失败，请重试；若持续失败，请检查后端 AppID 和 AppSecret 配置",
    });
  return { appId, openid: identity.data.openid };
}
