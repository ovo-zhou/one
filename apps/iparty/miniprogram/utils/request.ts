import { getApiBaseUrl } from "../config/api";
import { invalidateGetCache, readCachedGet, type GetCacheOptions } from "./get-cache";
import { clearSession, getSessionRevision, getToken } from "./session";

export type RequestOptions = Pick<
  WechatMiniprogram.RequestOption,
  "method" | "data" | "header" | "timeout"
> & { cache?: GetCacheOptions; invalidates?: readonly string[] };

const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class RequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export async function request<T extends string | Record<string, unknown> | ArrayBuffer>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getToken();
  const normalizedPath = path.replace(/^\/+/, "");
  const method = options.method ?? "GET";
  const isCurrentSession = () => getApiBaseUrl() === baseUrl && getToken() === token;

  const send = () => new Promise<T>((resolve, reject) => {
    wx.request<T>({
      url: `${baseUrl}/${normalizedPath}`,
      method,
      data: options.data,
      header: { ...options.header, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      timeout: options.timeout ?? 10_000,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          if (options.invalidates?.length && writeMethods.has(method)) {
            invalidateGetCache(baseUrl, options.invalidates);
          }
          resolve(response.data);
          return;
        }

        // A late 401 for an old request must not erase a newly restored session.
        if (response.statusCode === 401 && token && isCurrentSession()) clearSession();
        const data: unknown = response.data;
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : `请求失败（HTTP ${response.statusCode}）`;
        reject(new RequestError(message, response.statusCode));
      },
      fail(error) {
        reject(new Error(error.errMsg || "网络请求失败，请检查网络和 API 地址"));
      },
    });
  });
  // Only opt-in, session-bound GETs whose full query is encoded in the URL.
  if (method === "GET" && options.cache && token && !options.header && options.data === undefined) {
    const revision = getSessionRevision();
    return readCachedGet(
      { baseUrl, token, path: normalizedPath },
      options.cache,
      send,
      () => getSessionRevision() === revision && isCurrentSession(),
    );
  }
  return send();
}
