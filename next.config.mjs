/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
      },
      {
        protocol: "https",
        hostname: "api.x.ai",
      },
      {
        protocol: "https",
        hostname: "**.x.ai",
      },
    ],
  },
};

export default nextConfig;
