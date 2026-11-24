/**
 * Branch-preview API for the existing AI Project Platform home screen.
 * One D1 database is the shared store for every client of this preview.
 * It does not connect to Supabase and does not overwrite an existing row.
 */

const SEEDS = [
  ["seed-ai-platform", "AI Project Platform", "Canonical cross-device platform — OneDrive primary; Google Drive + iCloud backups.", "active", ["board-seed"]],
  ["seed-revo-roku", "REVO + Roku Camera Dashboard", "Camera feeds and TV display project.", "active", ["board-seed"]],
  ["seed-mike-ai", "MIKE AI (iPhone & Android)", "Separate branded assistant project inside the platform.", "active", ["board-seed"]],
  ["seed-family-pc", "Family Computer Build & Dell Upgrade", "Hardware allocation within $1000 ceiling.", "active", ["board-seed"]],
  ["seed-sara", "Operation Keep Sara Working", "Urgent filing/review project.", "active", ["board-seed"]],
  ["seed-auto-truck", "Auto Truck Diagnostics for Dummies", "Priority OBD / truck diagnostics — signed Windows baseline 1.2.0.", "active", ["board-seed", "priority"]],
  ["seed-cdi", "CDI Genius", "Ignition diagnostics Expo / Windows baseline.", "active", ["board-seed", "hub-app"]],
  ["seed-kathy", "Kathy's Health App", "Health client + AI-ready server.", "active", ["board-seed"]],
  ["seed-ravin", "Ravin Lookup Tool / TITAN", "Vehicle lookup tool and Windows installers — governance: PAUSED.", "paused", ["board-seed", "hub-app"]],
  ["seed-dead-end", "Dead End Road Music & Video Album", "Final 12-track album; only three original videos kept.", "active", ["board-seed"]],
  ["seed-mike-cd", "Mike Paine CD Album", "Archived — superseded by Dead End Road.", "archived", ["board-seed"]],
  ["seed-forma", "Forma", "On-device browser photo editor — Netgene hub app under /apps/forma.", "active", ["workspace-app", "hub-app"]],
  ["seed-vehicle-genius", "Vehicle Genius", "Offline symptom helper — Netgene hub app under /apps/vehicle-genius.", "active", ["workspace-app", "hub-app"]],
];

const HUB_APPS = [
  { name: "Forma", href: "/apps/forma", blurb: "Private on-device photo editor" },
  { name: "Vehicle Genius", href: "/apps/vehicle-genius", blurb: "Offline vehicle symptom helper" },
  { name: "CDI Genius", href: "/apps/cdi-genius", blurb: "CDI diagnostic decision tree" },
  { name: "Apps hub", href: "/apps", blurb: "Full Netgene project index" },
  { name: "Ravin downloads", href: "/downloads", blurb: "Windows portable installers (product paused)" },
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const CHUNK_CHARS = 500_000;

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", ...extra },
  });
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function previewDecision(mime, name) {
  const raw = (mime || "").split(";")[0].trim().toLowerCase();
  const ext = (name || "").toLowerCase().split(".").pop() || "";
  const unsafe = new Set(["text/html", "application/xhtml+xml", "image/svg+xml", "text/javascript", "application/javascript"]);
  if (unsafe.has(raw) || ["html", "htm", "svg", "js", "mjs"].includes(ext)) {
    return { kind: "none", mime: raw || "application/octet-stream" };
  }
  const byMime = {
    "image/png": "image",
    "image/jpeg": "image",
    "image/gif": "image",
    "image/webp": "image",
    "application/pdf": "pdf",
    "text/plain": "text",
    "text/markdown": "text",
    "text/csv": "text",
    "application/json": "text",
    "audio/mpeg": "audio",
    "audio/mp4": "audio",
    "audio/wav": "audio",
    "video/mp4": "video",
    "video/quicktime": "video",
  };
  const byExt = {
    png: ["image/png", "image"],
    jpg: ["image/jpeg", "image"],
    jpeg: ["image/jpeg", "image"],
    gif: ["image/gif", "image"],
    webp: ["image/webp", "image"],
    pdf: ["application/pdf", "pdf"],
    txt: ["text/plain", "text"],
    md: ["text/markdown", "text"],
    csv: ["text/csv", "text"],
    json: ["application/json", "text"],
    mp3: ["audio/mpeg", "audio"],
    m4a: ["audio/mp4", "audio"],
    wav: ["audio/wav", "audio"],
    mp4: ["video/mp4", "video"],
    mov: ["video/quicktime", "video"],
  };
  if (byMime[raw]) return { kind: byMime[raw], mime: raw };
  if ((!raw || raw === "application/octet-stream") && byExt[ext]) {
    return { kind: byExt[ext][1], mime: byExt[ext][0] };
  }
  return { kind: "none", mime: raw || "application/octet-stream" };
}

function contentDisposition(name, mode) {
  const cleaned = (name || "download").replace(/[\r\n"]/g, "_").slice(0, 180);
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, "_") || "download";
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}

function statement(db, sql, params) {
  return params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
}

async function rows(db, sql, params = []) {
  const result = await statement(db, sql, params).all();
  return result.results || [];
}

function createMemoryDb(tables) {
  function insert(table, columns, params) {
    const row = {};
    columns.forEach((column, index) => {
      row[column] = params[index];
    });
    const conflict = table === "file_chunks" ? ["file_id", "idx"] : ["id"];
    const exists = tables[table].some((item) => conflict.every((key) => item[key] === row[key]));
    if (!exists) tables[table].push(row);
  }

  function select(sql, params) {
    sql = sql.replace(/\s+/g, " ").trim();
    let rows = [];
    if (sql.includes("FROM projects")) rows = tables.projects.map((row) => ({ ...row }));
    else if (sql.includes("FROM files")) rows = tables.files.map((row) => ({ ...row }));
    else if (sql.includes("FROM file_chunks")) rows = tables.file_chunks.map((row) => ({ ...row }));
    else if (sql.includes("FROM revisions")) rows = tables.revisions.map((row) => ({ ...row }));
    const where = sql.match(/WHERE (.+?)(?: ORDER BY| LIMIT|$)/);
    if (where) {
      const clauses = where[1].split(" AND ");
      let index = 0;
      rows = rows.filter((row) =>
        clauses.every((clause) => {
          const column = clause.split("=")[0].trim();
          const expected = params[index];
          index += 1;
          return row[column] === expected;
        }),
      );
    }
    if (sql.includes("ORDER BY CASE WHEN status = 'archived'")) {
      rows.sort((a, b) => {
        const archived = (row) => (row.status === "archived" ? 1 : 0);
        return archived(a) - archived(b) || String(b.updated_at).localeCompare(String(a.updated_at));
      });
    } else if (sql.includes("ORDER BY updated_at DESC")) {
      rows.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    } else if (sql.includes("ORDER BY created_at DESC")) {
      rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    } else if (sql.includes("ORDER BY idx")) {
      rows.sort((a, b) => a.idx - b.idx);
    }
    const limit = sql.match(/LIMIT (\d+)/);
    if (limit) rows = rows.slice(0, Number(limit[1]));
    const selected = sql.match(/^SELECT (.+) FROM/);
    if (!selected || selected[1].trim() === "*") return rows;
    const columns = selected[1].split(",").map((column) => column.trim());
    return rows.map((row) => {
      const picked = {};
      for (const column of columns) picked[column] = row[column];
      return picked;
    });
  }

  function run(sql, params) {
    sql = sql.replace(/\s+/g, " ").trim();
    if (sql.startsWith("CREATE TABLE")) return;
    const match = sql.match(/INSERT INTO (\w+) \(([^)]+)\)/);
    if (!match) return;
    insert(
      match[1],
      match[2].split(",").map((column) => column.trim()),
      params,
    );
  }

  return {
    memory: true,
    prepare(sql) {
      const statement = {
        sql,
        params: [],
        bind(...params) {
          this.params = params;
          return this;
        },
        all() {
          return Promise.resolve({ results: select(this.sql, this.params) });
        },
        run() {
          run(this.sql, this.params);
          return Promise.resolve({});
        },
      };
      return statement;
    },
    async batch(statements) {
      for (const statement of statements) {
        if (statement.sql.startsWith("SELECT")) await statement.all();
        else await statement.run();
      }
    },
  };
}

const EMPTY_TABLES = () => ({ projects: [], files: [], file_chunks: [], revisions: [] });

async function openDatabase(env, request) {
  if (env.DB) return { db: env.DB, persist() {} };
  if (!globalThis.__previewTables) globalThis.__previewTables = EMPTY_TABLES();
  const tables = globalThis.__previewTables;
  const cacheKey = new Request(new URL("/__preview_state", request.url).toString(), { method: "GET" });
  try {
    const hit = await caches.default.match(cacheKey);
    if (hit && tables.files.length === 0 && tables.projects.length === 0) {
      const stored = await hit.json();
      for (const key of Object.keys(tables)) tables[key] = stored[key] || [];
    }
  } catch (error) {
    globalThis.__storeError = error instanceof Error ? error.message : String(error);
  }
  return {
    db: createMemoryDb(tables),
    async persist() {
      try {
        await caches.default.put(
          cacheKey,
          new Response(JSON.stringify(tables), {
            headers: { "content-type": "application/json", "cache-control": "public, max-age=31536000" },
          }),
        );
        globalThis.__storeError = "";
      } catch (error) {
        globalThis.__storeError = error instanceof Error ? error.message : String(error);
      }
    },
  };
}

function ensureSchema(db) {
  return (async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        summary TEXT NOT NULL,
        status TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        checksum_sha256 TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS file_chunks (
        file_id TEXT NOT NULL,
        idx INTEGER NOT NULL,
        content_b64 TEXT NOT NULL,
        PRIMARY KEY (file_id, idx)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS revisions (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`),
    ]);
    const now = new Date().toISOString();
    await db.batch(
      SEEDS.map(([id, name, summary, status, tags]) =>
        db
          .prepare(
            `INSERT INTO projects (id, name, summary, status, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO NOTHING`,
          )
          .bind(id, name, summary, status, JSON.stringify(tags), now, now),
      ),
    );
  })();
}

async function projects(db) {
  return (
    await rows(
      db,
      `SELECT id, name, summary, status, tags, updated_at
       FROM projects
       ORDER BY CASE WHEN status = 'archived' THEN 1 ELSE 0 END, updated_at DESC`,
    )
  ).map((row) => ({
    id: row.id,
    name: row.name,
    summary: row.summary,
    status: row.status,
    tags: JSON.parse(row.tags),
    updated_at: row.updated_at,
  }));
}

async function files(db, projectId) {
  const query = projectId
    ? `SELECT id, project_id, name, mime_type, size_bytes, checksum_sha256, updated_at
       FROM files WHERE project_id = ? ORDER BY updated_at DESC`
    : `SELECT id, project_id, name, mime_type, size_bytes, checksum_sha256, updated_at
       FROM files ORDER BY updated_at DESC`;
  const found = await rows(db, query, projectId ? [projectId] : []);
  return found.map((row) => ({
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    mime_type: row.mime_type,
    size_bytes: String(row.size_bytes),
    checksum_sha256: row.checksum_sha256,
    updated_at: row.updated_at,
  }));
}

async function insertFile(db, { id, projectId, name, mimeType, bytes }) {
  const checksum = await sha256Hex(bytes);
  const now = new Date().toISOString();
  const encoded = bytesToBase64(bytes);
  const parts = [];
  for (let i = 0; i < encoded.length; i += CHUNK_CHARS) parts.push(encoded.slice(i, i + CHUNK_CHARS));
  if (parts.length === 0) parts.push("");
  await db.batch([
    db
      .prepare(
        `INSERT INTO files (id, project_id, name, mime_type, size_bytes, checksum_sha256, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO NOTHING`,
      )
      .bind(id, projectId, name, mimeType, bytes.byteLength, checksum, now, now),
    ...parts.map((part, idx) =>
      db
        .prepare(
          `INSERT INTO file_chunks (file_id, idx, content_b64) VALUES (?, ?, ?)
           ON CONFLICT(file_id, idx) DO NOTHING`,
        )
        .bind(id, idx, part),
    ),
  ]);
  return {
    id,
    project_id: projectId,
    name,
    mime_type: mimeType,
    size_bytes: String(bytes.byteLength),
    checksum_sha256: checksum,
    updated_at: now,
  };
}

async function remember(db, projectId, payload) {
  const body = JSON.stringify(payload);
  const id = `rev:${payload.fingerprint || body.slice(0, 80)}`;
  await db
    .prepare(
      `INSERT INTO revisions (id, project_id, title, body, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
    )
    .bind(id, projectId, `historical-revision ${id.slice(0, 20)}`, body, new Date().toISOString())
    .run();
}

async function fileBytes(db, id) {
  const chunks = await rows(
    db,
    `SELECT content_b64 FROM file_chunks WHERE file_id = ? ORDER BY idx`,
    [id],
  );
  return base64ToBytes(chunks.map((row) => row.content_b64).join(""));
}

async function merge(db, incomingProjects, incomingFiles) {
  let insertedProjects = 0;
  let insertedFiles = 0;
  let preservedRevisions = 0;
  const keptProjectIds = [];
  const refusedFiles = [];
  for (const incoming of incomingProjects) {
    const id = String(incoming.id || "").trim();
    const name = String(incoming.name || "").trim();
    if (!id || !name) continue;
    const existing = (await rows(db, `SELECT id, name, summary, status FROM projects WHERE id = ?`, [id]))[0];
    if (existing) {
      keptProjectIds.push(id);
      if (
        existing.name !== name ||
        existing.summary !== String(incoming.summary || "") ||
        existing.status !== String(incoming.status || "active")
      ) {
        const fingerprint = await sha256Hex(new TextEncoder().encode(JSON.stringify(incoming)));
        await remember(db, id, { fingerprint, keptId: id, incoming });
        preservedRevisions += 1;
      }
      continue;
    }
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO projects (id, name, summary, status, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO NOTHING`,
      )
      .bind(
        id,
        name,
        String(incoming.summary || ""),
        String(incoming.status || "active"),
        JSON.stringify(incoming.tags || ["recovery-import"]),
        now,
        now,
      )
      .run();
    insertedProjects += 1;
  }
  for (const file of incomingFiles) {
    const projectId = String(file.projectId || file.project_id || "");
    const name = String(file.name || "");
    if (!projectId || !name || !(await rows(db, `SELECT id FROM projects WHERE id = ?`, [projectId]))[0]) {
      refusedFiles.push({ name: name || "(unnamed)", reason: "project_missing" });
      continue;
    }
    if (!file.contentBase64) {
      const fingerprint = await sha256Hex(new TextEncoder().encode(JSON.stringify(file)));
      await remember(db, projectId, { fingerprint, kind: "file-metadata-only", file });
      preservedRevisions += 1;
      continue;
    }
    const bytes = base64ToBytes(file.contentBase64);
    const checksum = await sha256Hex(bytes);
    const declared = String(file.checksum || file.checksum_sha256 || "").toLowerCase();
    if (declared && declared !== checksum) {
      refusedFiles.push({ name, reason: "checksum_mismatch" });
      continue;
    }
    const same = (
      await rows(
        db,
        `SELECT id FROM files WHERE project_id = ? AND name = ? AND checksum_sha256 = ?`,
        [projectId, name, checksum],
      )
    )[0];
    if (same) continue;
    let id = String(file.id || "");
    const occupied = id
      ? (await rows(db, `SELECT checksum_sha256 FROM files WHERE id = ?`, [id]))[0]
      : undefined;
    if (!id || (occupied && occupied.checksum_sha256 !== checksum)) {
      id = `preserve:${checksum.slice(0, 32)}`;
    }
    if (occupied && occupied.checksum_sha256 === checksum) continue;
    await insertFile(db, {
      id,
      projectId,
      name,
      mimeType: file.mimeType || file.mime_type || "application/octet-stream",
      bytes,
    });
    insertedFiles += 1;
  }
  return { insertedProjects, insertedFiles, preservedRevisions, keptProjectIds, refusedFiles };
}

async function handle(request, db) {
  await ensureSchema(db);
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === "POST" && !sameOrigin(request)) {
    return json({ error: "origin_required", message: "Missing or foreign Origin." }, 403);
  }
  if (path === "/api/auth/status" && request.method === "GET") {
    return json({
      ok: true,
      authReady: true,
      unlockCodeConfigured: false,
      sessionConfigured: false,
      faceIdRegistered: false,
      unlocked: true,
      viewerName: "Dev Viewer",
      platform: "AI Project Platform",
      preview: true,
    });
  }
  if (path === "/api/projects" && request.method === "GET") {
    const list = await projects(db);
    const ravin = list.find((project) => project.name.toLowerCase().includes("ravin"));
    const complete = SEEDS.every((seed) => list.some((project) => project.id === seed[0]));
    return json({
      ok: complete,
      count: list.length,
        source: db.memory ? "preview-memory" : "preview-d1",
      hosted: false,
      projects: list,
      apps: HUB_APPS,
      catalog: {
        expected: SEEDS.length,
        available: list.length,
        complete,
        ravinPaused: Boolean(ravin && ravin.status === "paused"),
      },
      recoveryImportAvailable: false,
      recoveryFileCount: 0,
      recoveryRecordCount: 0,
      recoveryMessage: "No recovery JSON is on this preview. Production Supabase was not written.",
    });
  }
  if (path === "/api/files" && request.method === "GET") {
    const list = await files(db, url.searchParams.get("projectId") || undefined);
    return json({ ok: true, count: list.length, files: list, sortedBy: "updated_at_desc" });
  }
  if (path === "/api/files" && request.method === "POST") {
    const form = await request.formData();
    const file = form.get("file");
    const projectId = String(form.get("projectId") || "");
    if (!(file instanceof File)) return json({ error: "file_required" }, 400);
    if (!(await projects(db)).some((project) => project.id === projectId)) {
      return json({ error: "project_required" }, 400);
    }
    if (file.size > MAX_FILE_BYTES) return json({ error: "file_too_large" }, 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await insertFile(db, {
      id: crypto.randomUUID(),
      projectId,
      name: file.name || "upload.bin",
      mimeType: file.type || "application/octet-stream",
      bytes,
    });
    return json({ ok: true, file: saved, sync: { preview: "stored-on-shared-preview" } });
  }
  if (path === "/api/files/download" && request.method === "GET") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id_required" }, 400);
    const row = (await rows(db, `SELECT id, name, mime_type, checksum_sha256 FROM files WHERE id = ?`, [id]))[0];
    if (!row) return json({ error: "not_found" }, 404);
    const bytes = await fileBytes(db, id);
    const digest = await sha256Hex(bytes);
    if (digest !== row.checksum_sha256) {
      return json({ error: "checksum_mismatch", expected: row.checksum_sha256, actual: digest }, 409);
    }
    const decision = previewDecision(row.mime_type, row.name);
    const inline = url.searchParams.get("inline") === "1" && decision.kind !== "none";
    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": inline ? decision.mime : row.mime_type || "application/octet-stream",
        "content-length": String(bytes.byteLength),
        "content-disposition": contentDisposition(row.name, inline ? "inline" : "attachment"),
        "x-checksum-sha256": digest,
        "x-preview-kind": decision.kind,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (path === "/api/sync" && request.method === "GET") {
    return json({
      ok: true,
      providers: [
        {
          provider: "preview-shared",
          role: "branch-preview",
          configured: true,
          missing: [],
          last: {
            status: "ok",
            detail: "Windows and iPhone clients of this preview read and write one D1 database. Production was not written.",
            last_success_at: null,
          },
        },
      ],
    });
  }
  if (path === "/api/memory" && request.method === "GET") {
    const entries = (
      await rows(db, `SELECT id, project_id, title, body, created_at FROM revisions ORDER BY created_at DESC LIMIT 200`)
    ).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      source: "preserve",
      updated_at: row.created_at,
    }));
    return json({ ok: true, entries });
  }
  if (path === "/api/sync/peers" && request.method === "GET") {
    return json({
      ok: true,
        source: db.memory ? "preview-memory" : "preview-d1",
      projects: await projects(db),
      files: await files(db),
      revisions: await rows(db, `SELECT id, project_id, title FROM revisions`),
    });
  }
  if (path === "/api/sync/peers" && request.method === "POST") {
    const body = await request.json();
    const applied = await merge(db, body.projects || [], body.files || []);
    return json({
      ok: true,
      applied,
      snapshot: { projects: await projects(db), files: await files(db) },
    });
  }
  if (path === "/api/health" && request.method === "GET") {
    return json({
      ok: true,
      modelCredentials: false,
      preview: true,
      store: db.memory ? "preview-memory" : "preview-d1",
      storeError: globalThis.__storeError || "",
    });
  }
  return json({ error: "not_found", path }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const opened = await openDatabase(env, request);
      const response = await handle(request, opened.db);
      await opened.persist();
      return response;
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ error: "assets_missing" }, 500);
  },
};
