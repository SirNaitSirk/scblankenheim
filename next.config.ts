import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TODO: replace picsum placeholder with real camp photography under /public.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
