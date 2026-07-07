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
  };
  
  module.exports = nextConfig;
  