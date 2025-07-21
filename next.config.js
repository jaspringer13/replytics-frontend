/** @type {import('next').NextConfig} */
// Force rebuild: Fixed CSS processing - 2025-07-21
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Ensure CSS is processed
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig