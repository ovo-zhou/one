import { getApiBaseUrl } from "../config/api";

type RequestOptions = Pick<WechatMiniprogram.RequestOption, "method" | "data" | "header">;

export async function request<T extends string | Record<string, unknown> | ArrayBuffer>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();

  return new Promise<T>((resolve, reject) => {
    wx.request<T>({
      url: `${baseUrl}/${path.replace(/^\/+/, "")}`,
      method: options.method ?? "GET",
      data: options.data,
      header: options.header,
      timeout: 10_000,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }

        reject(new Error(`请求失败（HTTP ${response.statusCode}）`));
      },
      fail(error) {
        reject(new Error(error.errMsg || "网络请求失败，请检查网络和 API 地址"));
      },
    });
  });
}
