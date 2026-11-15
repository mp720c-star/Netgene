import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Serve static Netgene HTML apps under /apps/*/ without requiring index.html in the URL.
  async rewrites() {
    return [
      { source: "/apps", destination: "/apps/index.html" },
      { source: "/apps/", destination: "/apps/index.html" },
      { source: "/apps/forma", destination: "/apps/forma/index.html" },
      { source: "/apps/forma/", destination: "/apps/forma/index.html" },
      { source: "/apps/vehicle-genius", destination: "/apps/vehicle-genius/index.html" },
      { source: "/apps/vehicle-genius/", destination: "/apps/vehicle-genius/index.html" },
      { source: "/apps/cdi-genius", destination: "/apps/cdi-genius/index.html" },
      { source: "/apps/cdi-genius/", destination: "/apps/cdi-genius/index.html" },
    ];
  },
};

export default nextConfig;
