import type { NextConfig } from "next";

const staticPreview = process.env.PLATFORM_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticPreview ? { output: "export" as const } : {}),
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "./identity.dev.js": "./cursor/identity.dev.ts",
      "./identity.js": "./cursor/identity.ts",
    },
  },
};

if (!staticPreview) {
  // Serve static Netgene HTML apps under /apps/*/ without requiring index.html in the URL.
  nextConfig.rewrites = async () => [
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
  nextConfig.headers = async () => [
    {
      source: "/downloads/:file(.*\\.exe)",
      headers: [
        { key: "Content-Type", value: "application/vnd.microsoft.portable-executable" },
        { key: "Content-Disposition", value: "attachment" },
        { key: "Cache-Control", value: "public, max-age=3600" },
      ],
    },
  ];
}

export default nextConfig;
