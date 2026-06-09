/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
