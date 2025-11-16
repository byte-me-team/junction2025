import type { NextConfig } from "next";
import crypto from "crypto";

if (!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
  console.warn(
    "[Warning] NEXT_SERVER_ACTIONS_ENCRYPTION_KEY not set. Generating temporary key (dev only)."
  );
  process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY = crypto
    .randomBytes(32)
    .toString("base64");
}

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
      // @ts-expect-error supported at runtime, not typed
      encryptionKey: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
    },
  },
};

export default nextConfig;
