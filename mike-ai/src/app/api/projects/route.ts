import { loadProjectRecords } from "@/lib/projects";
import { recordUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  const loaded = loadProjectRecords();
  recordUsage({
    kind: "projects",
    ok: loaded.records.length > 0,
    detail: `${loaded.source}:${loaded.fileName ?? "n/a"}:${loaded.records.length}`,
  });

  return Response.json(
    {
      ok: loaded.records.length > 0,
      source: loaded.source,
      fileName: loaded.fileName,
      count: loaded.records.length,
      message: loaded.message,
      records: loaded.records,
      expectedFilePattern: "AI_Platform_Project_Records_<timestamp>.json",
      recoveryDropPath: "mike-ai/recovery/",
      drive: {
        recordsFolderId: "1z8LAubkUm-DJ9MZoE9dsNYXGnySMzKQP",
        stagingFolderId: "1y_-7bD4F6iVT63CB0esv59gqamOIOYcY",
        note: "This test deploy does not call Drive directly (no Google credentials). Import exported JSON into recovery/.",
      },
    },
    { status: 200 },
  );
}
