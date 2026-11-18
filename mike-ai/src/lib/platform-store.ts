import { createHash, randomUUID } from "node:crypto";
import { decodeStoredBytes, sha256Hex } from "./byte-content";
import { sql } from "./db";

export type ProjectRow = {
  id: string;
  name: string;
  summary: string;
  status: string;
  tags: unknown;
  created_at: string;
  updated_at: string;
};

export type FileRow = {
  id: string;
  project_id: string;
  name: string;
  mime_type: string;
  size_bytes: string;
  checksum_sha256: string;
  created_at: string;
  updated_at: string;
};

export async function listProjectsNewestFirst(): Promise<ProjectRow[]> {
  return sql<ProjectRow>(
    `SELECT id, name, summary, status, tags, created_at::text, updated_at::text
     FROM projects
     ORDER BY CASE WHEN status = 'archived' THEN 1 ELSE 0 END, updated_at DESC`,
  );
}

export async function createProject(input: {
  id?: string;
  name: string;
  summary?: string;
  status?: string;
  tags?: string[];
}): Promise<ProjectRow> {
  const id = input.id?.trim() || randomUUID();
  const rows = await sql<ProjectRow>(
    `INSERT INTO projects (id, name, summary, status, tags)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, name, summary, status, tags, created_at::text, updated_at::text`,
    [
      id,
      input.name.trim(),
      input.summary?.trim() || "",
      input.status?.trim() || "active",
      JSON.stringify(input.tags ?? []),
    ],
  );
  return rows[0];
}

export async function updateProjectMeta(
  id: string,
  input: { summary?: string; status?: string; tags?: string[] },
): Promise<ProjectRow | null> {
  const rows = await sql<ProjectRow>(
    `UPDATE projects
     SET summary = COALESCE($2, summary),
         status = COALESCE($3, status),
         tags = COALESCE($4::jsonb, tags),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, summary, status, tags, created_at::text, updated_at::text`,
    [
      id,
      input.summary ?? null,
      input.status ?? null,
      input.tags ? JSON.stringify(input.tags) : null,
    ],
  );
  return rows[0] ?? null;
}

export async function listFiles(opts: {
  projectId?: string;
}): Promise<FileRow[]> {
  if (opts.projectId) {
    return sql<FileRow>(
      `SELECT id, project_id, name, mime_type, size_bytes::text, checksum_sha256,
              created_at::text, updated_at::text
       FROM files WHERE project_id = $1
       ORDER BY updated_at DESC`,
      [opts.projectId],
    );
  }
  return sql<FileRow>(
    `SELECT id, project_id, name, mime_type, size_bytes::text, checksum_sha256,
            created_at::text, updated_at::text
     FROM files ORDER BY updated_at DESC`,
  );
}

export async function saveFile(input: {
  projectId: string;
  name: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<FileRow> {
  const id = randomUUID();
  const checksum = createHash("sha256").update(input.bytes).digest("hex");
  const rows = await sql<FileRow>(
    `INSERT INTO files (id, project_id, name, mime_type, size_bytes, content, checksum_sha256)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, project_id, name, mime_type, size_bytes::text, checksum_sha256,
               created_at::text, updated_at::text`,
    [
      id,
      input.projectId,
      input.name,
      input.mimeType || "application/octet-stream",
      input.bytes.length,
      input.bytes,
      checksum,
    ],
  );
  await sql(`UPDATE projects SET updated_at = NOW() WHERE id = $1`, [input.projectId]);
  return rows[0];
}

export async function getFileContent(id: string): Promise<{
  row: FileRow;
  content: Buffer;
} | null> {
  const rows = await sql<FileRow & { content: Buffer | Uint8Array | null }>(
    `SELECT id, project_id, name, mime_type, size_bytes::text, checksum_sha256,
            created_at::text, updated_at::text, content
     FROM files WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const { content: stored, ...meta } = row;
  const content = decodeStoredBytes(stored, meta.checksum_sha256);
  if (!content) {
    if (Number(meta.size_bytes) === 0) return { row: meta, content: Buffer.alloc(0) };
    return null;
  }
  if (sha256Hex(content) !== meta.checksum_sha256 && Number(meta.size_bytes) === 0 && content.length === 0) {
    return { row: meta, content: Buffer.alloc(0) };
  }
  return { row: meta, content };
}

export async function insertProjectIfAbsent(input: {
  id: string;
  name: string;
  summary: string;
  status: string;
  tags: string[];
}): Promise<boolean> {
  const rows = await sql<{ id: string }>(
    `INSERT INTO projects (id, name, summary, status, tags)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [input.id, input.name, input.summary, input.status, JSON.stringify(input.tags)],
  );
  return rows.length > 0;
}

export async function insertFileIfAbsent(input: {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  bytes: Buffer;
  checksum: string;
}): Promise<boolean> {
  const rows = await sql<{ id: string }>(
    `INSERT INTO files (id, project_id, name, mime_type, size_bytes, content, checksum_sha256)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [
      input.id,
      input.projectId,
      input.name,
      input.mimeType,
      input.bytes.length,
      input.bytes,
      input.checksum,
    ],
  );
  return rows.length > 0;
}

export async function insertRevisionIfAbsent(input: {
  id: string;
  projectId: string | null;
  title: string;
  body: string;
}): Promise<boolean> {
  const rows = await sql<{ id: string }>(
    `INSERT INTO memory_entries (id, project_id, kind, title, body, source)
     VALUES ($1, $2, 'historical-revision', $3, $4, 'preserve')
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [input.id, input.projectId, input.title, input.body],
  );
  return rows.length > 0;
}

export async function listHistoricalRevisions(limit = 200) {
  return sql<{
    id: string;
    project_id: string | null;
    title: string;
    body: string;
    created_at: string;
  }>(
    `SELECT id, project_id, title, body, created_at::text
     FROM memory_entries
     WHERE kind = 'historical-revision'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
}

export async function listMemory(limit = 40) {
  return sql<{
    id: string;
    project_id: string | null;
    kind: string;
    title: string;
    body: string;
    source: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, project_id, kind, title, body, source,
            created_at::text, updated_at::text
     FROM memory_entries
     ORDER BY updated_at DESC
     LIMIT $1`,
    [limit],
  );
}

export async function addMemory(input: {
  title: string;
  body: string;
  kind?: string;
  projectId?: string | null;
  source?: string;
}) {
  const id = randomUUID();
  const rows = await sql(
    `INSERT INTO memory_entries (id, project_id, kind, title, body, source)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, project_id, kind, title, body, source, created_at::text, updated_at::text`,
    [
      id,
      input.projectId ?? null,
      input.kind || "note",
      input.title.trim(),
      input.body,
      input.source || "platform",
    ],
  );
  return rows[0];
}
