import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { listFiles, saveFile, listProjectsNewestFirst, createProject } from "@/lib/platform-store";
import { runCloudSync } from "@/lib/cloud/sync";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const locked = requireUnlocked(req);
  if (locked) return locked;
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  const files = await listFiles({ projectId });
  return Response.json({
    ok: true,
    count: files.length,
    files,
    sortedBy: "updated_at_desc",
  });
}

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = requireUnlocked(req);
  if (locked) return locked;

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json(
      { error: "multipart_required", message: "Upload files as multipart/form-data." },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  let projectId = String(form.get("projectId") || "").trim();
  const projectName = String(form.get("projectName") || "").trim();

  if (!(file instanceof File)) {
    return Response.json({ error: "file_required" }, { status: 400 });
  }

  if (!projectId) {
    if (!projectName) {
      return Response.json({ error: "project_required" }, { status: 400 });
    }
    const existing = (await listProjectsNewestFirst()).find(
      (p) => p.name.toLowerCase() === projectName.toLowerCase(),
    );
    projectId = existing?.id ?? (await createProject({ name: projectName })).id;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile({
    projectId,
    name: file.name || "upload.bin",
    mimeType: file.type || "application/octet-stream",
    bytes,
  });

  // Best-effort cloud sync of this file; failures are reported, not mocked
  let sync: Awaited<ReturnType<typeof runCloudSync>> | null = null;
  try {
    sync = await runCloudSync(saved.id);
  } catch (error) {
    sync = {
      results: {
        error: {
          ok: false,
          detail: error instanceof Error ? error.message : "sync_failed",
        },
      },
    };
  }

  return Response.json({ ok: true, file: saved, sync });
}
