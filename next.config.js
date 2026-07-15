/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    async rewrites() {
      return [
        { source: "/favicon.ico", destination: "/icons/favicon.png" },
      ];
    },
    async headers() {
      return [
        {
          source: "/sw.js",
          headers: [
            { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
            { key: "Service-Worker-Allowed", value: "/" },
          ],
        },
        {
          source: "/manifest.webmanifest",
          headers: [
            { key: "Content-Type", value: "application/manifest+json" },
          ],
        },
      ];
    },
  };
  
  module.exports = nextConfig;
  