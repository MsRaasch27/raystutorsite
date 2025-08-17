import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const projectId = "raystutorsite";

const nextConfig: NextConfig = {
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: "/api/:path*",
        destination: `http://127.0.0.1:5001/${projectId}/us-central1/api/:path*`,
      },
    ];
  },
};

// const nextConfig: NextConfig = {
//   async rewrites() {
//     if (process.env.NODE_ENV === "development") {
//       return [
//         {
//           source: "/api/:path*",
//           destination:
//             "http://localhost:5001/raystutorsite/us-central1/api/:path*",
//         },
//         {
//           source: "/webhooks/stripe",
//           destination:
//             "http://localhost:5001/raystutorsite/us-central1/stripeWebhook",
//         },
//       ];
//     }
//     return [];
//   },
// };

export default nextConfig;
