import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/diamonds-unicorns",
        destination: "/library",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
