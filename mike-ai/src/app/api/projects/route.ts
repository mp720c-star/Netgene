import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import {
  createProject,
  listProjectsNewestFirst,
  updateProjectMeta,
  type ProjectRow,
} from "@/lib/platform-store";
import { loadProjectRecords } from "@/lib/projects";
import { BOARD_PROJECTS, HUB_APPS } from "@/lib/board-projects";
import { validateLoadedRecords } from "@/lib/registry-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ensure every catalog project exists, and enforce governance statuses
 * (Ravin paused, Mike Paine CD archived) without inventing histories.
 */
async function ensureBoardProjects(): Promise<ProjectRow[]> {
  let projects = await listProjectsNewestFirst();
  const byName = new Map(projects.map((p) => [p.name.toLowerCase(), p]));

  for (const seed of BOARD_PROJECTS) {
    const existing = byName.get(seed.name.toLowerCase());
    if (!existing) {
      const created = await createProject({
        id: seed.seedId,
        name: seed.name,
        summary: seed.summary,
        status: seed.status,
        tags: seed.tags,
      });
      byName.set(seed.name.toLowerCase(), created);
      continue;
    }

    // Governance + catalog status sync for known seeds only.
    const tags: string[] = Array.isArray(existing.tags)
      ? existing.tags.map((t: unknown) => String(t))
      : typeof existing.tags === "string"
        ? (() => {
            try {
              const parsed: unknown = JSON.parse(existing.tags as string);
              return Array.isArray(parsed) ? parsed.map((t: unknown) => String(t)) : [];
            } catch {
              return [];
            }
          })()
        : [];
    const needsStatus = existing.status !== seed.status;
    const isSeeded = tags.some(
      (t: string) => t === "board-seed" || t === "workspace-app",
    );
    if (needsStatus && (isSeeded || seed.status === "paused" || seed.status === "archived")) {
      await updateProjectMeta(existing.id, {
        status: seed.status,
        summary: isSeeded ? seed.summary : undefined,
      });
    }
  }

  projects = await listProjectsNewestFirst();
  return projects;
}

export async function GET(req: Request) {
  const locked = await requireUnlocked(req);
  if (locked) return locked;

  const projects = await ensureBoardProjects();
  const recovery = loadProjectRecords();
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
    recoveryImportAvailable: recovery.records.length > 0,
    recoveryFileName: recovery.fileName,
    recoveryMessage: recovery.message,
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
    const recovery = loadProjectRecords();
    if (recovery.records.length === 0) {
      return Response.json(
        { error: "no_recovery_file", message: recovery.message },
        { status: 404 },
      );
    }
    let imported = 0;
    for (const r of recovery.records) {
      const name = String(r.name || "").trim();
      if (!name) continue;
      const existing = (await listProjectsNewestFirst()).find(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) continue;
      await createProject({
        name,
        summary: String(r.summary || ""),
        status: String(r.status || "active"),
        tags: Array.isArray(r.tags) ? r.tags.map(String) : ["recovery-import"],
      });
      imported += 1;
    }
    return Response.json({
      ok: true,
      imported,
      projects: await ensureBoardProjects(),
      from: recovery.fileName,
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
