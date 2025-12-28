import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Acknowledge Turbopack is default in Next.js 16 (plugins may add webpack config)
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/maps/api/place/photo/**',
      },
    ],
  },
};

export default withPWA(withBundleAnalyzer(nextConfig));
