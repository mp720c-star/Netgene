import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { listFiles, saveFile, listProjectsNewestFirst, createProject } from "@/lib/platform-store";
import { runCloudSync } from "@/lib/cloud/sync";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Hard cap to keep Postgres / PGlite from unbounded growth. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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
  const limited = rateLimit({
    key: `upload:${clientIp(req)}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return Response.json(
      {
        error: "file_too_large",
        message: `Uploads are limited to ${MAX_UPLOAD_BYTES} bytes.`,
        maxBytes: MAX_UPLOAD_BYTES,
      },
      { status: 413 },
    );
  }

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
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      {
        error: "file_too_large",
        message: `Uploads are limited to ${MAX_UPLOAD_BYTES} bytes.`,
        maxBytes: MAX_UPLOAD_BYTES,
        size: file.size,
      },
      { status: 413 },
    );
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
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return Response.json(
      {
        error: "file_too_large",
        message: `Uploads are limited to ${MAX_UPLOAD_BYTES} bytes.`,
        maxBytes: MAX_UPLOAD_BYTES,
      },
      { status: 413 },
    );
  }
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
