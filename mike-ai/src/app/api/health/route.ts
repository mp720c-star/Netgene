import { loadProjectRecords } from "@/lib/projects";
import { hasModelCredentials } from "@/lib/origin";
import { getUsageSnapshot, recordUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = loadProjectRecords();
  recordUsage({
    kind: "health",
    ok: true,
    detail: `projects=${projects.records.length};model=${hasModelCredentials() ? "configured" : "missing"}`,
  });

  return Response.json({
    ok: true,
    deployment: "test",
    productionUntouched: true,
    mikeAiVercelApp: "https://mike-ai.vercel.app (paused — not modified)",
    modelCredentials: hasModelCredentials(),
    projects: {
      source: projects.source,
      count: projects.records.length,
      fileName: projects.fileName,
      message: projects.message,
    },
    usage: getUsageSnapshot().totals,
    apps: ["/apps/", "/apps/forma/", "/apps/bluetooth-scanner/", "/apps/vehicle-genius/", "/apps/cdi-genius/"],
  });
}
