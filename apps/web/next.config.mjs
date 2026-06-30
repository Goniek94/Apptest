/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @modamarket/shared to surowy TypeScript z monorepo — Next musi go transpilować
  transpilePackages: ['@modamarket/shared'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
};

export default nextConfig;
