import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { applyPreserveMerge } from "@/lib/apply-reconcile";
import { databaseInfo } from "@/lib/db";
import { listFiles, listHistoricalRevisions, listProjectsNewestFirst } from "@/lib/platform-store";
import type { IncomingFile, IncomingProject } from "@/lib/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function snapshot() {
  const info = databaseInfo();
  const projects = await listProjectsNewestFirst();
  const files = await listFiles({});
  const revisions = await listHistoricalRevisions();
  return {
    ok: true,
    source: info.mode,
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      summary: project.summary,
      status: project.status,
      tags: project.tags,
      updated_at: project.updated_at,
    })),
    files: files.map((file) => ({
      id: file.id,
      project_id: file.project_id,
      name: file.name,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      checksum_sha256: file.checksum_sha256,
      updated_at: file.updated_at,
    })),
    revisions: revisions.map((revision) => ({
      id: revision.id,
      project_id: revision.project_id,
      title: revision.title,
    })),
  };
}

export async function GET(req: Request) {
  const locked = await requireUnlocked(req);
  if (locked) return locked;
  return Response.json(await snapshot());
}

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = await requireUnlocked(req);
  if (locked) return locked;

  let body: {
    projects?: IncomingProject[];
    files?: IncomingFile[];
    records?: IncomingProject[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const incomingFiles = body.files ?? [];
  for (const file of incomingFiles) {
    const encoded = file.contentBase64?.trim() ?? "";
    if (!encoded) continue;
    const bytes = Buffer.from(encoded, "base64").length;
    if (bytes > MAX_FILE_BYTES) {
      return Response.json(
        { error: "file_too_large", message: `Peer files are limited to ${MAX_FILE_BYTES} bytes.` },
        { status: 413 },
      );
    }
  }

  const applied = await applyPreserveMerge({
    incomingProjects: [...(body.records ?? []), ...(body.projects ?? [])],
    incomingFiles,
  });
  return Response.json({ ok: true, applied, snapshot: await snapshot() });
}
