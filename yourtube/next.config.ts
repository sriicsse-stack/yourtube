import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Use BACKEND_URL (or NEXT_PUBLIC_BACKEND_URL) at build time so production
    // doesn't hardcode localhost. Falls back to localhost for local dev only.
    remotePatterns: (() => {
      const patterns = [] as any[];
      const urlStr = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000";
      try {
        const u = new URL(urlStr);
        patterns.push({
          protocol: u.protocol.replace(':', ''),
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? '443' : '80'),
          pathname: '/**',
        });
      } catch (e) {
        // ignore and leave patterns empty
      }
      return patterns;
    })(),
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api",
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000/api",
  },
  // Ensure Turbopack uses this folder as the workspace root (avoids root inference warning)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
