import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['ryandev.cn'],
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'ryandev.cn',
          },
          {
            key: 'x-forwarded-host',
            value: 'ryandev.cn',
          },
        ]
      }
    ]
  }
};

export default nextConfig;
