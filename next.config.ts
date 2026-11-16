import { mkdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function createNextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  if (isDev) {
    mkdirSync(path.join(process.cwd(), ".next-dev", "static", "development"), {
      recursive: true,
    });
  }

  return {
    distDir: isDev ? ".next-dev" : ".next",
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    serverExternalPackages: ["pg", "nodemailer", "@prisma/adapter-pg"],
    experimental: {
      optimizePackageImports: ["lucide-react", "@react-email/components"],
    },
    images: {
      formats: ["image/avif", "image/webp"],
    },
  };
}
