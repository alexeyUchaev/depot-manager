import type { NextConfig } from "next";

// Optional cross-origin dev origins (e.g. an ngrok/tunnel host) supplied via env.
// In Next.js 15+ this option lives at the top level of the config.
const devOrigins = process.env.NEXT_PUBLIC_DEV_ORIGIN
  ? [process.env.NEXT_PUBLIC_DEV_ORIGIN]
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
