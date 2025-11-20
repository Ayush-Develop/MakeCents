/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
    ],
  },
  // Enable source maps for debugging
  productionBrowserSourceMaps: false, // Set to true if you need source maps in production
  // Ensure webpack generates source maps in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'eval-source-map'
    }
    return config
  },
}

module.exports = nextConfig


