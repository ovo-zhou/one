import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['*.sh.run.tcloudbase.com', '*.ap-shanghai.run.wxcloudrun.com','ryandev.cn'],
    },
  }
};

export default nextConfig;
