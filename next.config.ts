import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
