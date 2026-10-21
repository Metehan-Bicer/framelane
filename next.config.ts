import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // Screenshot uploads pass through the password proxy one full size PNG at a time.
    proxyClientMaxBodySize: "25mb",
  },
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
