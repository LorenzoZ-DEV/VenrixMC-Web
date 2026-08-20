/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output traces only the files the server actually needs into
  // .next/standalone, so the production Docker image doesn't have to ship
  // the full node_modules tree — see Dockerfile.
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }],
  },
};

module.exports = nextConfig;
