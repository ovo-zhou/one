import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    dynamicIO: true,
    cacheLife: {
      blog: {
        stale: 3600, // 1小时
        revalidate: 900, // 15分钟
        expire: 86400, // 1天
      },
    },
  },
};

export default nextConfig;
