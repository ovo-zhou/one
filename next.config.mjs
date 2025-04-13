/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["www.ryandev.cn"],
    },
  },
};

export default nextConfig;
