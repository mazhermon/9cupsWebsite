import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Video filenames carry a version segment (.v1.), so they're safe to
        // cache forever. Bump the version when re-encoding — see
        // components/hero-video and 9cups-hero-video/scripts/build-videos.sh.
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
