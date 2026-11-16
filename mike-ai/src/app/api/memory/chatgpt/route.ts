import { listMemory, listProjectsNewestFirst } from "@/lib/platform-store";
import { addMemory } from "@/lib/platform-store";

export const runtime = "nodejs";

function authorize(req: Request): Response | null {
  const expected = process.env.CHATGPT_MEMORY_TOKEN?.trim();
  if (!expected) {
    return Response.json(
      {
        error: "chatgpt_memory_not_configured",
        message: "Set CHATGPT_MEMORY_TOKEN to enable the ChatGPT Actions memory API.",
      },
      { status: 503 },
    );
  }
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || token !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/** ChatGPT Custom GPT / Actions: read local project + memory context before answering. */
export async function GET(req: Request) {
  const denied = authorize(req);
  if (denied) return denied;
  const projects = await listProjectsNewestFirst();
  const memory = await listMemory(50);
  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    instruction:
      "Use this local memory as authoritative context for Michael Paine before answering. Prefer newest entries. Do not invent project status.",
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      summary: p.summary,
      status: p.status,
      updatedAt: p.updated_at,
    })),
    memory: memory.map((m) => ({
      id: m.id,
      projectId: m.project_id,
      kind: m.kind,
      title: m.title,
      body: m.body,
      source: m.source,
      updatedAt: m.updated_at,
    })),
  });
}

export async function POST(req: Request) {
  const denied = authorize(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    title?: string;
    body?: string;
    kind?: string;
    projectId?: string | null;
  };
  if (!body.title?.trim() || !body.body?.trim()) {
    return Response.json({ error: "title_and_body_required" }, { status: 400 });
  }
  const entry = await addMemory({
    title: body.title,
    body: body.body,
    kind: body.kind || "chatgpt",
    projectId: body.projectId ?? null,
    source: "chatgpt",
  });
  return Response.json({ ok: true, entry });
}
