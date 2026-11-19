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
    serverExternalPackages: [
      "pg",
      "nodemailer",
      "@prisma/adapter-pg",
      "@prisma/adapter-neon",
      "@neondatabase/serverless",
    ],
    experimental: {
      optimizePackageImports: ["lucide-react", "@react-email/components"],
    },
    images: {
      formats: ["image/avif", "image/webp"],
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Frame-Options", value: "DENY" },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
            },
            ...(process.env.NODE_ENV === "production"
              ? [
                  {
                    key: "Strict-Transport-Security",
                    value: "max-age=63072000; includeSubDomains; preload",
                  },
                ]
              : []),
          ],
        },
      ];
    },
  };
}
