import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local-dev database (in-process Postgres). Never bundled; unused when DATABASE_URL is set.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
