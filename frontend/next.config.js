/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  // Enable standalone output for production Docker builds
  output: "standalone",
};

module.exports = nextConfig;
