import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // /mixer shipped before the nav existed; "Mixer" read too close to
        // "Mixes" so it became /stems. Permanent, because the old URL has
        // been public.
        source: '/mixer',
        destination: '/stems',
        permanent: true,
      },
    ]
  },

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
