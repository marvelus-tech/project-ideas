import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desks are read from sqlite on each request. Cache Components would
  // freeze a business page at build time, so this app stays dynamic.
  cacheComponents: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
