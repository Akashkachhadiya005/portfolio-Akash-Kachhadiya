import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    // Silence the workspace-root warning caused by a package-lock.json
    // existing at C:\Users\01\ on this machine.
    root: __dirname,
  },
};

export default nextConfig;
