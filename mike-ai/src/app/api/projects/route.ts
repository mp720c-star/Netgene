import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import {
  createProject,
  listProjectsNewestFirst,
  type ProjectRow,
} from "@/lib/platform-store";
import { loadProjectRecords } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Real project names from the Shared AI Status Board (2026-10-18 export). */
const BOARD_PROJECTS: { name: string; summary: string; status: string }[] = [
  {
    name: "AI Project Platform",
    summary: "Canonical cross-device platform — iCloud primary, Drive/OneDrive mirrors.",
    status: "active",
  },
  {
    name: "REVO + Roku Camera Dashboard",
    summary: "Camera feeds and TV display project.",
    status: "active",
  },
  {
    name: "MIKE AI (iPhone & Android)",
    summary: "Separate branded assistant project inside the platform.",
    status: "active",
  },
  {
    name: "Family Computer Build & Dell Upgrade",
    summary: "Hardware allocation within $1000 ceiling.",
    status: "active",
  },
  {
    name: "Operation Keep Sara Working",
    summary: "Urgent filing/review project.",
    status: "active",
  },
  {
    name: "Auto Truck Diagnostics for Dummies",
    summary: "Signed Windows baseline 1.2.0 and OBD diagnostics.",
    status: "active",
  },
  {
    name: "CDI Genius",
    summary: "Ignition diagnostics Windows baseline.",
    status: "active",
  },
  {
    name: "Kathy's Health App",
    summary: "Health client + AI-ready server.",
    status: "active",
  },
  {
    name: "Ravin Lookup Tool / TITAN",
    summary: "Agent/Mike/Supervisor lookup tool and installers.",
    status: "active",
  },
  {
    name: "Dead End Road Music & Video Album",
    summary: "Final 12-track album; only three original videos kept.",
    status: "active",
  },
  {
    name: "Mike Paine CD Album",
    summary: "Archived — superseded by Dead End Road.",
    status: "archived",
  },
];

async function ensureBoardProjects(): Promise<ProjectRow[]> {
  let projects = await listProjectsNewestFirst();
  if (projects.length > 0) return projects;

  for (const p of BOARD_PROJECTS) {
    await createProject({
      name: p.name,
      summary: p.summary,
      status: p.status,
      tags: ["board-seed"],
    });
  }
  projects = await listProjectsNewestFirst();
  return projects;
}

export async function GET(req: Request) {
  const locked = requireUnlocked(req);
  if (locked) return locked;

  const projects = await ensureBoardProjects();
  const recovery = loadProjectRecords();

  return Response.json({
    ok: true,
    count: projects.length,
    source: "postgres",
    hosted: Boolean(process.env.DATABASE_URL?.trim()),
    projects,
    recoveryImportAvailable: recovery.records.length > 0,
    recoveryFileName: recovery.fileName,
    recoveryMessage: recovery.message,
  });
}

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = requireUnlocked(req);
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
      projects: await listProjectsNewestFirst(),
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
  const locked = requireUnlocked(req);
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
