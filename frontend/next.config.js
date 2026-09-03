/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig = {
  eslint: {
    // Lint backlog (pre-existing) is tracked via `npm run lint`; it shouldn't block production builds.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  async rewrites() {
    // process.env.VERCEL is automatically set to "1" in every Vercel deployment.
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL ? 'https://vitalcore-api.onrender.com' : 'http://localhost:8000')
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
