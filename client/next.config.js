/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true, // Disable image optimization for static export compatibility
    domains: ['images.unsplash.com', 'via.placeholder.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  env: {
    // API_URL will be auto-determined at runtime in apiConfig.js
    // This just sets a default for SSR
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    // Add explicit subdomain allowances
    ALLOWED_SUBDOMAINS: 'offmarket.blueflagindy.com,blog.blueflagindy.com',
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://blueflagindy.com https://*.blueflagindy.com;", // Allow embedding from main domain and all subdomains
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allow cross-origin requests for assets
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME type sniffing
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

