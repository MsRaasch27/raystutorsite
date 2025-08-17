import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination:
            "http://localhost:5001/raystutorsite/us-central1/api/:path*",
        },
        {
          source: "/webhooks/stripe",
          destination:
            "http://localhost:5001/raystutorsite/us-central1/stripeWebhook",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
