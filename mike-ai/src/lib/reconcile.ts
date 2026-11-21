import { createHash } from "node:crypto";
import { sha256Hex } from "./byte-content";

export type ExistingProject = {
  id: string;
  name: string;
  summary: string;
  status: string;
  tags: unknown;
};

export type ExistingFile = {
  id: string;
  project_id: string;
  name: string;
  checksum_sha256: string;
};

export type IncomingFile = {
  id?: string;
  projectId?: string;
  project_id?: string;
  name?: string;
  mimeType?: string;
  mime_type?: string;
  checksum?: string;
  checksum_sha256?: string;
  contentBase64?: string;
  sizeBytes?: number;
};

export type IncomingProject = {
  id?: string;
  name?: string;
  summary?: string;
  status?: string;
  tags?: unknown;
  revision?: number | string;
  history?: unknown[];
  files?: IncomingFile[];
  updatedAt?: string;
  updated_at?: string;
};

export type PlannedProject = {
  id: string;
  name: string;
  summary: string;
  status: string;
  tags: string[];
};

export type PlannedFile = {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  bytes: Buffer;
  checksum: string;
  preservedFromId: string | null;
};

export type PlannedRevision = {
  id: string;
  projectId: string | null;
  title: string;
  body: string;
};

export type PreservePlan = {
  insertProjects: PlannedProject[];
  insertFiles: PlannedFile[];
  appendRevisions: PlannedRevision[];
  keptProjectIds: string[];
  skippedFileIds: string[];
  refusedFiles: { name: string; reason: string }[];
};

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(obj[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

export function tagsOf(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag));
  if (typeof tags === "string") {
    try {
      const parsed: unknown = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.map((tag) => String(tag));
    } catch {
      return [];
    }
  }
  return [];
}

function projectShape(project: {
  name: string;
  summary: string;
  status: string;
  tags: unknown;
}): string {
  return stable({
    name: project.name,
    summary: project.summary,
    status: project.status,
    tags: tagsOf(project.tags),
  });
}

function recoveryId(name: string): string {
  return `recovery:${createHash("sha256").update(name.trim().toLowerCase()).digest("hex").slice(0, 32)}`;
}

function preserveFileId(originalId: string, checksum: string): string {
  return `preserve:${createHash("sha256").update(`${originalId}:${checksum}`).digest("hex").slice(0, 32)}`;
}

function revisionRow(projectId: string | null, payload: unknown): PlannedRevision {
  const id = `rev:${fingerprint(payload)}`;
  return {
    id,
    projectId,
    title: `historical-revision ${id.slice(4, 16)}`,
    body: stable(payload),
  };
}

function takeFile(
  file: IncomingFile,
  projectId: string,
  existingFiles: ExistingFile[],
  plan: PreservePlan,
  usedIds: Set<string>,
) {
  const name = String(file.name || "").trim();
  if (!name) {
    plan.refusedFiles.push({ name: "(unnamed)", reason: "name_missing" });
    return;
  }
  const mime = String(file.mimeType || file.mime_type || "application/octet-stream");
  const declared = String(file.checksum || file.checksum_sha256 || "").trim().toLowerCase();
  const encoded = file.contentBase64?.trim();
  if (!encoded) {
    plan.appendRevisions.push(
      revisionRow(projectId, {
        kind: "file-metadata-only",
        projectId,
        file,
      }),
    );
    return;
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(encoded, "base64");
  } catch {
    plan.refusedFiles.push({ name, reason: "content_not_base64" });
    return;
  }
  const checksum = sha256Hex(bytes);
  if (declared && declared !== checksum) {
    plan.refusedFiles.push({ name, reason: "checksum_mismatch" });
    plan.appendRevisions.push(
      revisionRow(projectId, {
        kind: "file-checksum-refused",
        name,
        declared,
        actual: checksum,
      }),
    );
    return;
  }
  const already = existingFiles.some(
    (row) => row.project_id === projectId && row.checksum_sha256 === checksum && row.name === name,
  );
  if (already) {
    plan.skippedFileIds.push(file.id || name);
    return;
  }
  let id = String(file.id || "").trim();
  let preservedFromId: string | null = null;
  const sameId = id ? existingFiles.find((row) => row.id === id) : undefined;
  if (sameId && sameId.checksum_sha256 === checksum) {
    plan.skippedFileIds.push(id);
    return;
  }
  if ((id && (sameId || usedIds.has(id))) || !id) {
    preservedFromId = id || null;
    id = preserveFileId(id || `${projectId}:${name}`, checksum);
  }
  if (usedIds.has(id)) {
    plan.skippedFileIds.push(id);
    return;
  }
  usedIds.add(id);
  existingFiles.push({
    id,
    project_id: projectId,
    name,
    checksum_sha256: checksum,
  });
  plan.insertFiles.push({
    id,
    projectId,
    name,
    mimeType: mime,
    bytes,
    checksum,
    preservedFromId,
  });
}

export function planPreserveMerge(input: {
  projects: ExistingProject[];
  files: ExistingFile[];
  incomingProjects?: IncomingProject[];
  incomingFiles?: IncomingFile[];
}): PreservePlan {
  const projects = input.projects.map((project) => ({ ...project }));
  const files = input.files.map((file) => ({ ...file }));
  const plan: PreservePlan = {
    insertProjects: [],
    insertFiles: [],
    appendRevisions: [],
    keptProjectIds: [],
    skippedFileIds: [],
    refusedFiles: [],
  };
  const usedIds = new Set(files.map((file) => file.id));
  const seenRevision = new Set<string>();
  const pushRevision = (row: PlannedRevision) => {
    if (seenRevision.has(row.id)) return;
    seenRevision.add(row.id);
    plan.appendRevisions.push(row);
  };

  for (const incoming of input.incomingProjects ?? []) {
    const name = String(incoming.name || "").trim();
    if (!name) continue;
    const summary = String(incoming.summary || "");
    const status = String(incoming.status || "active");
    const tags = tagsOf(incoming.tags);
    const requestedId = String(incoming.id || "").trim();
    const byId = requestedId ? projects.find((project) => project.id === requestedId) : undefined;
    const byName = projects.find((project) => project.name.toLowerCase() === name.toLowerCase());
    const existing = byId || (!requestedId ? byName : undefined);

    if (existing) {
      plan.keptProjectIds.push(existing.id);
      const incomingShape = projectShape({ name, summary, status, tags });
      if (incomingShape !== projectShape(existing)) {
        pushRevision(revisionRow(existing.id, { keptId: existing.id, incoming }));
      }
    } else {
      const id = requestedId || recoveryId(name);
      if (!projects.some((project) => project.id === id)) {
        projects.push({ id, name, summary, status, tags });
        plan.insertProjects.push({ id, name, summary, status, tags });
      } else {
        plan.keptProjectIds.push(id);
      }
    }

    const owner = projects.find((project) => project.id === (requestedId || existing?.id)) ||
      projects.find((project) => project.name.toLowerCase() === name.toLowerCase());
    const projectId = owner?.id ?? null;
    if (Array.isArray(incoming.history)) {
      for (const entry of incoming.history) {
        pushRevision(revisionRow(projectId, { kind: "history", projectId, entry }));
      }
    }
    if (incoming.revision !== undefined) {
      pushRevision(
        revisionRow(projectId, {
          kind: "revision-field",
          projectId,
          name,
          revision: incoming.revision,
          status,
        }),
      );
    }
    for (const file of incoming.files ?? []) {
      if (projectId) takeFile(file, projectId, files, plan, usedIds);
    }
  }

  for (const file of input.incomingFiles ?? []) {
    const projectId = String(file.projectId || file.project_id || "").trim();
    if (!projectId || !projects.some((project) => project.id === projectId)) {
      plan.refusedFiles.push({
        name: String(file.name || "(unnamed)"),
        reason: "project_missing",
      });
      continue;
    }
    takeFile(file, projectId, files, plan, usedIds);
  }

  plan.appendRevisions = plan.appendRevisions.filter((row, index, all) => {
    return all.findIndex((other) => other.id === row.id) === index;
  });
  return plan;
}
