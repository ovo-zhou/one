type Environment = WechatMiniprogram.AccountInfo["miniProgram"]["envVersion"];

// Real devices use the online backend, including development previews.
const apiBaseUrls: Record<Environment, string> = {
  develop: "https://api.ryandev.cn",
  trial: "https://api.ryandev.cn",
  release: "https://api.ryandev.cn",
};

export function getApiBaseUrl(): string {
  const environment = wx.getAccountInfoSync().miniProgram.envVersion;
  const baseUrl = apiBaseUrls[environment];

  if (!baseUrl) {
    throw new Error(`请先在 config/api.ts 配置 ${environment} 环境的 HTTPS API 地址`);
  }

  if (environment === "develop" && wx.getDeviceInfo().platform === "devtools") {
    return "http://localhost:8787";
  }

  return baseUrl.replace(/\/+$/, "");
}
