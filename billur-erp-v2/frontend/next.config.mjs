/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
