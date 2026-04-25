import type { NextConfig } from "next";
import { getApiBase } from "./components/lib/api";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${getApiBase()}/api/:path*`
      },
    ];
  },
};

export default nextConfig;