type Environment = WechatMiniprogram.AccountInfo["miniProgram"]["envVersion"];

// Development uses the local backend; trial and release use the online backend.
const apiBaseUrls: Record<Environment, string> = {
  develop: "http://localhost:8787",
  trial: "https://api.ryandev.cn",
  release: "https://api.ryandev.cn",
};

export function getApiBaseUrl(): string {
  const environment = wx.getAccountInfoSync().miniProgram.envVersion;
  const baseUrl = apiBaseUrls[environment];

  if (!baseUrl) {
    throw new Error(`请先在 config/api.ts 配置 ${environment} 环境的 HTTPS API 地址`);
  }

  return baseUrl.replace(/\/+$/, "");
}
