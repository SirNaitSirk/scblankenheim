import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones in the local network use the dev server (HMR, Server Actions).
  allowedDevOrigins: ["192.168.2.226"],
  experimental: {
    // Prefetched and visited admin tabs are reused in the browser for 30s, so
    // switching tabs feels instant. Every admin Server Action calls
    // revalidatePath, which purges this cache, so own changes show at once.
    staleTimes: {
      dynamic: 30,
      static: 30,
    },
    // In development, do not reuse Supabase responses across HMR refreshes:
    // admin pages must always show the current database state.
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
