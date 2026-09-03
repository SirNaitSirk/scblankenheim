import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TODO: replace remote placeholders with real camp photography under /public.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
