import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server actions
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // For photo uploads
    },
  },
};

export default nextConfig;
