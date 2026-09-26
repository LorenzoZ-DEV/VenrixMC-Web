const pkg = require("./package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * La versione mostrata nel footer viene da package.json e viene inlinata
   * qui al build. Prima era scritta a mano anche in src/lib/constants.ts, e
   * due copie della stessa stringa divergono alla prima distrazione: ora si
   * alza il numero in package.json e basta.
   */
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
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
