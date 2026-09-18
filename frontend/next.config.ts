import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // React Strict Mode stays enabled. Development remounts can look like
  // duplicate fetches; lib/api/client.ts coalesces in-flight GETs instead.
  poweredByHeader: false,
  // Dev-only. Next.js 16 blocks /_next/hmr from hosts other than localhost.
  // This machine binds Cursor loopback aliases on lo0 (127.0.2.2, 127.0.2.3);
  // `next dev` advertises 127.0.2.2 as the Network URL. Production ignores this.
  allowedDevOrigins: ["127.0.2.2", "127.0.2.3"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
