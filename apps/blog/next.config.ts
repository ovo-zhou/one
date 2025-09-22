import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['ryandev.cn','*.ap-shanghai.run.wxcloudrun.com'],
    },
  },
};

export default nextConfig;
