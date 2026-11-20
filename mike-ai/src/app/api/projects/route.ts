import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { createProject, listProjectsNewestFirst, type ProjectRow } from "@/lib/platform-store";
import { applyPreserveMerge } from "@/lib/apply-reconcile";
import { loadAllRecoveryRecords, loadProjectRecords } from "@/lib/projects";
import { BOARD_PROJECTS, HUB_APPS } from "@/lib/board-projects";
import { validateLoadedRecords } from "@/lib/registry-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Insert catalog rows that are missing. Never update an existing row:
 * a later governance label must not overwrite a saved status or summary.
 */
async function ensureBoardProjects(): Promise<ProjectRow[]> {
  let projects = await listProjectsNewestFirst();
  const byName = new Map(projects.map((p) => [p.name.toLowerCase(), p]));

  for (const seed of BOARD_PROJECTS) {
    if (byName.has(seed.name.toLowerCase())) continue;
    const created = await createProject({
      id: seed.seedId,
      name: seed.name,
      summary: seed.summary,
      status: seed.status,
      tags: seed.tags,
    });
    byName.set(seed.name.toLowerCase(), created);
  }

  projects = await listProjectsNewestFirst();
  return projects;
}

export async function GET(req: Request) {
  const locked = await requireUnlocked(req);
  if (locked) return locked;

  const projects = await ensureBoardProjects();
  const recovery = loadProjectRecords();
  const recoveryAll = loadAllRecoveryRecords();
  const ravin = projects.find((p) => p.name.toLowerCase().includes("ravin"));
  const catalog = {
    expected: BOARD_PROJECTS.length,
    available: projects.length,
    complete: BOARD_PROJECTS.every((seed) =>
      projects.some((p) => p.name.toLowerCase() === seed.name.toLowerCase()),
    ),
    ravinPaused: Boolean(ravin && ravin.status.toLowerCase() === "paused"),
  };
  const recoveryGovernance =
    recovery.records.length > 0 ? validateLoadedRecords(recovery.records) : null;

  return Response.json({
    ok: catalog.complete,
    count: projects.length,
    source: process.env.DATABASE_URL?.trim() ? "postgres" : "pglite-local",
    hosted: Boolean(process.env.DATABASE_URL?.trim()),
    projects,
    apps: HUB_APPS,
    catalog,
    recoveryImportAvailable: recoveryAll.records.length > 0 || recovery.records.length > 0,
    recoveryFileName: recovery.fileName,
    recoveryFileCount: recoveryAll.files.length,
    recoveryRecordCount: recoveryAll.records.length,
    recoveryMessage: recoveryAll.files.length > 0 ? recoveryAll.message : recovery.message,
    recoveryGovernance,
  });
}

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = await requireUnlocked(req);
  if (locked) return locked;

  const body = (await req.json()) as {
    name?: string;
    summary?: string;
    status?: string;
    tags?: string[];
    importRecovery?: boolean;
  };

  if (body.importRecovery) {
    const recoveryAll = loadAllRecoveryRecords();
    if (recoveryAll.records.length === 0) {
      return Response.json(
        { error: "no_recovery_file", message: recoveryAll.message },
        { status: 404 },
      );
    }
    const applied = await applyPreserveMerge({
      incomingProjects: recoveryAll.records,
    });
    return Response.json({
      ok: true,
      applied,
      projects: await ensureBoardProjects(),
      from: recoveryAll.files.map((file) => file.fileName),
    });
  }

  if (!body.name?.trim()) {
    return Response.json({ error: "name_required" }, { status: 400 });
  }
  const project = await createProject({
    name: body.name,
    summary: body.summary,
    status: body.status,
    tags: body.tags,
  });
  return Response.json({ ok: true, project });
}

export async function DELETE(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = await requireUnlocked(req);
  if (locked) return locked;
  return Response.json(
    {
      error: "delete_disabled",
      message:
        "Project deletion is disabled on this platform. Preserve originals per Rule 1.",
    },
    { status: 403 },
  );
}
