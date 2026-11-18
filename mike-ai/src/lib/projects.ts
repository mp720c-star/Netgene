import fs from "node:fs";
import path from "node:path";

export type ProjectRecord = {
  id: string;
  name: string;
  summary?: string;
  status?: string;
  tags?: string[];
  updatedAt?: string;
  [key: string]: unknown;
};

export type ProjectRecordsLoad = {
  source: "recovery-file" | "env-json" | "none";
  fileName: string | null;
  records: ProjectRecord[];
  message: string;
};

const RECORDS_NAME = /^AI_Platform_Project_Records_(.+)\.json$/i;

function recoveryDir() {
  return path.join(process.cwd(), "recovery");
}

function normalizeRecords(raw: unknown): ProjectRecord[] {
  if (Array.isArray(raw)) {
    return raw.filter((r) => r && typeof r === "object") as ProjectRecord[];
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["records", "projects", "items", "data"]) {
      if (Array.isArray(obj[key])) {
        return obj[key] as ProjectRecord[];
      }
    }
  }
  return [];
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/** Prefer newest AI_Platform_Project_Records_<timestamp>.json from recovery/. */
function loadFromRecoveryDrop(): ProjectRecordsLoad | null {
  const dir = recoveryDir();
  if (!fs.existsSync(dir)) return null;

  const matches = fs
    .readdirSync(dir)
    .filter((name) => RECORDS_NAME.test(name))
    .map((name) => {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      const stamp = name.match(RECORDS_NAME)?.[1] ?? "";
      return { name, full, mtime: stat.mtimeMs, stamp };
    })
    .sort((a, b) => {
      // Prefer lexicographic timestamp in filename, then mtime
      if (a.stamp !== b.stamp) return a.stamp < b.stamp ? 1 : -1;
      return b.mtime - a.mtime;
    });

  if (matches.length === 0) return null;

  const chosen = matches[0];
  try {
    const records = normalizeRecords(readJsonFile(chosen.full));
    return {
      source: "recovery-file",
      fileName: chosen.name,
      records,
      message:
        records.length > 0
          ? `Loaded ${records.length} project record(s) from recovery/${chosen.name}.`
          : `Found ${chosen.name} but it contained no project array.`,
    };
  } catch (err) {
    return {
      source: "recovery-file",
      fileName: chosen.name,
      records: [],
      message: `Failed to parse recovery/${chosen.name}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function loadFromEnvJson(): ProjectRecordsLoad | null {
  const raw = process.env.AI_PLATFORM_PROJECT_RECORDS_JSON;
  if (!raw) return null;
  try {
    const records = normalizeRecords(JSON.parse(raw));
    return {
      source: "env-json",
      fileName: null,
      records,
      message:
        records.length > 0
          ? `Loaded ${records.length} project record(s) from AI_PLATFORM_PROJECT_RECORDS_JSON.`
          : "AI_PLATFORM_PROJECT_RECORDS_JSON was set but contained no project array.",
    };
  } catch (err) {
    return {
      source: "env-json",
      fileName: null,
      records: [],
      message: `Failed to parse AI_PLATFORM_PROJECT_RECORDS_JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export type RecoveryDrop = {
  fileName: string;
  records: ProjectRecord[];
  message: string;
};

/**
 * Read every recovery JSON. Older files stay on disk and stay in the merge.
 * Nothing in recovery/ is deleted or rewritten.
 */
export function loadAllRecoveryRecords(): {
  files: RecoveryDrop[];
  records: ProjectRecord[];
  message: string;
} {
  const dir = recoveryDir();
  if (!fs.existsSync(dir)) {
    return { files: [], records: [], message: "recovery directory is missing." };
  }
  const names = fs
    .readdirSync(dir)
    .filter((name) => RECORDS_NAME.test(name))
    .sort();
  const files: RecoveryDrop[] = [];
  const records: ProjectRecord[] = [];
  for (const name of names) {
    try {
      const loaded = normalizeRecords(readJsonFile(path.join(dir, name)));
      files.push({
        fileName: name,
        records: loaded,
        message: `Loaded ${loaded.length} record(s).`,
      });
      records.push(...loaded);
    } catch (err) {
      files.push({
        fileName: name,
        records: [],
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return {
    files,
    records,
    message:
      files.length > 0
        ? `Read ${files.length} recovery file(s), ${records.length} record(s), without changing the files.`
        : "No AI_Platform_Project_Records_*.json in recovery/.",
  };
}

/**
 * Real project records only — no invented placeholders.
 * Sources (in order): recovery/AI_Platform_Project_Records_*.json, then env JSON.
 */
export function loadProjectRecords(): ProjectRecordsLoad {
  const fromRecovery = loadFromRecoveryDrop();
  if (fromRecovery) return fromRecovery;

  const fromEnv = loadFromEnvJson();
  if (fromEnv) return fromEnv;

  return {
    source: "none",
    fileName: null,
    records: [],
    message:
      "No project records found. Drop a real AI_Platform_Project_Records_<timestamp>.json into mike-ai/recovery/ (exported from Drive staging or OneDrive). Production Drive folder 1z8LAubkUm-DJ9MZoE9dsNYXGnySMzKQP returned empty/404; staging folder 1y_-7bD4F6iVT63CB0esv59gqamOIOYcY still requires authenticated export.",
  };
}
