import path from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.resolve.alias["@"] = __dirname;
    return config;
  },

  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:3001";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
