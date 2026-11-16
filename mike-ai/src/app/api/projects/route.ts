import { loadProjectRecords } from "@/lib/projects";
import { ANNOUNCED_EXPORT } from "@/lib/registry-validate";
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
      validation: loaded.validation,
      fingerprint: loaded.fingerprint,
      expectedFilePattern: "AI_Platform_Project_Records_<timestamp>.json",
      recoveryDropPath: "mike-ai/recovery/",
      phase2: {
        mode: "preview-only-repair",
        mergeDeploy: false,
        announcedExport: ANNOUNCED_EXPORT,
        note: "Await Gemini field-by-field PASS before treating recovery import as verified. No merge/deploy from this preview branch.",
      },
      drive: {
        exportFolderId: ANNOUNCED_EXPORT.destinationFolderId,
        announcedFileId: ANNOUNCED_EXPORT.driveFileId,
        stagingFolderId: "1y_-7bD4F6iVT63CB0esv59gqamOIOYcY",
        note: "Preview repair does not call Drive. Copy verified export into recovery/ append-only after Gemini PASS.",
      },
    },
    { status: 200 },
  );
}
