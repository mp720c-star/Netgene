import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "./identity.dev.js": "./cursor/identity.dev.ts",
      "./identity.js": "./cursor/identity.ts",
    },
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
      { source: "/downloads", destination: "/downloads/index.html" },
      { source: "/downloads/", destination: "/downloads/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/downloads/:file(.*\\.exe)",
        headers: [
          { key: "Content-Type", value: "application/vnd.microsoft.portable-executable" },
          { key: "Content-Disposition", value: "attachment" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
