/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "api.dicebear.com", "osdg.iiit.ac.in"],
  },
  // Enable standalone output for production Docker builds (optional)
  // output: "standalone",
};

export default nextConfig;

