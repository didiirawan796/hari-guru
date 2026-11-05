import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Muat env dari root monorepo saat development lokal.
loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
};

export default nextConfig;
