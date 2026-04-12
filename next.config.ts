import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only set turbopack.root in local development.
  // This tells Turbopack that THIS project is the workspace root, not C:\Users\zaka\.
  // Omitted in production so Vercel builds are unaffected.
  ...(process.env.NODE_ENV === "development" && {
    turbopack: {
      root: __dirname,
    },
  }),
};

export default nextConfig;
