/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "api.dicebear.com", "osdg.iiit.ac.in"],
  },
  // Enable standalone output for production Docker builds
  // output: "standalone",
  // Set base path for deployment under /whispr
  basePath: "/whispr",
  assetPrefix: "/whispr",
  // Ensure trailing slash is handled properly
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
