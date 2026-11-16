import fs from "node:fs";
import path from "node:path";
import {
  validateAnnouncedExportBytes,
  validateLoadedRecords,
  type RegistryValidation,
} from "@/lib/registry-validate";

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
  /** Preview-only governance / count checks — never mutates records. */
  validation: RegistryValidation | null;
  /** Present when a recovery file was read from disk. */
  fingerprint: {
    bytes: number;
    sha256: string;
    matchesAnnouncedExport: boolean;
  } | null;
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
    const rawBuf = fs.readFileSync(chosen.full);
    const records = normalizeRecords(JSON.parse(rawBuf.toString("utf8")));
    const fp = validateAnnouncedExportBytes(rawBuf);
    return {
      source: "recovery-file",
      fileName: chosen.name,
      records,
      message:
        records.length > 0
          ? `Loaded ${records.length} project record(s) from recovery/${chosen.name}.`
          : `Found ${chosen.name} but it contained no project array.`,
      validation: validateLoadedRecords(records),
      fingerprint: {
        bytes: fp.bytes,
        sha256: fp.sha256,
        matchesAnnouncedExport: fp.ok,
      },
    };
  } catch (err) {
    return {
      source: "recovery-file",
      fileName: chosen.name,
      records: [],
      message: `Failed to parse recovery/${chosen.name}: ${err instanceof Error ? err.message : String(err)}`,
      validation: null,
      fingerprint: null,
    };
  }
}

function loadFromEnvJson(): ProjectRecordsLoad | null {
  const raw = process.env.AI_PLATFORM_PROJECT_RECORDS_JSON;
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, "utf8");
    const records = normalizeRecords(JSON.parse(raw));
    const fp = validateAnnouncedExportBytes(buf);
    return {
      source: "env-json",
      fileName: null,
      records,
      message:
        records.length > 0
          ? `Loaded ${records.length} project record(s) from AI_PLATFORM_PROJECT_RECORDS_JSON.`
          : "AI_PLATFORM_PROJECT_RECORDS_JSON was set but contained no project array.",
      validation: validateLoadedRecords(records),
      fingerprint: {
        bytes: fp.bytes,
        sha256: fp.sha256,
        matchesAnnouncedExport: fp.ok,
      },
    };
  } catch (err) {
    return {
      source: "env-json",
      fileName: null,
      records: [],
      message: `Failed to parse AI_PLATFORM_PROJECT_RECORDS_JSON: ${err instanceof Error ? err.message : String(err)}`,
      validation: null,
      fingerprint: null,
    };
  }
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
      "No project records found. After Gemini PASS, drop a copy of the verified Phase-2 export (Drive file 1ql5Jne7vuAc1D02igRVq6ADgMca2PKsQ) into mike-ai/recovery/ as AI_Platform_Project_Records_<timestamp>.json — append-only; do not overwrite existing recovery files or Drive backups.",
    validation: null,
    fingerprint: null,
  };
}
