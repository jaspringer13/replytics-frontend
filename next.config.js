/** @type {import('next').NextConfig} */
// Force rebuild: Fixed environment variable loading - 2025-07-21
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig