/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["www.ryandev.cn"],
    },
  },
  images: {
    domains: ["avatars.githubusercontent.com", "gitee.com"],
  },
};

export default nextConfig;
