import { createHash } from "node:crypto";
import type { ProjectRecord } from "@/lib/projects";

/** Announced ChatGPT Phase-2 export (metadata only — bytes not stored in git). */
export const ANNOUNCED_EXPORT = {
  driveFileId: "1ql5Jne7vuAc1D02igRVq6ADgMca2PKsQ",
  driveViewUrl:
    "https://drive.google.com/file/d/1ql5Jne7vuAc1D02igRVq6ADgMca2PKsQ/view",
  destinationFolderId: "1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4",
  expectedBytes: 2_023_048,
  expectedSha256:
    "42ded3f6468ca76f113fc394e139f1cd658186f1e661e8ccb11b9d91530a5e4f",
  expectedRecordCount: 13,
} as const;

export type GovernanceFinding = {
  id: string;
  ok: boolean;
  detail: string;
};

export type RegistryValidation = {
  recordCount: number;
  expectThirteen: boolean;
  governance: GovernanceFinding[];
  ok: boolean;
  message: string;
};

function revisionOf(record: ProjectRecord): number | null {
  for (const key of ["revision", "rev", "version"]) {
    const v = record[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  }
  return null;
}

function statusOf(record: ProjectRecord): string {
  return String(record.status ?? "").trim().toLowerCase();
}

function nameOf(record: ProjectRecord): string {
  return String(record.name ?? "").trim().toLowerCase();
}

/** Preview-only governance checks — never mutates records. */
export function validateLoadedRecords(records: ProjectRecord[]): RegistryValidation {
  const governance: GovernanceFinding[] = [];

  const ravin = records.find((r) => nameOf(r).includes("ravin"));
  if (!ravin) {
    governance.push({
      id: "ravin-present",
      ok: false,
      detail: "Ravin Lookup record not found among loaded records.",
    });
  } else {
    const paused = statusOf(ravin) === "paused";
    const rev = revisionOf(ravin);
    governance.push({
      id: "ravin-paused-58",
      ok: paused && (rev === null || rev === 58),
      detail:
        rev === null
          ? `Ravin status=${ravin.status ?? "(missing)"}; revision field absent (preserve PAUSED when present).`
          : `Ravin status=${ravin.status ?? "(missing)"} revision=${rev} (require PAUSED / 58).`,
    });
  }

  const cdi = records.find((r) => nameOf(r).includes("cdi"));
  if (!cdi) {
    governance.push({
      id: "cdi-present",
      ok: false,
      detail: "CDI Genius record not found among loaded records.",
    });
  } else {
    const rev = revisionOf(cdi);
    governance.push({
      id: "cdi-unchanged-17",
      ok: rev === null || rev === 17,
      detail:
        rev === null
          ? "CDI present; revision field absent (leave unchanged when Gemini confirms)."
          : `CDI revision=${rev} (require 17 unchanged).`,
    });
  }

  const music = records.find(
    (r) => nameOf(r).includes("dead end road") || nameOf(r).includes("music"),
  );
  if (music) {
    const rev = revisionOf(music);
    governance.push({
      id: "music-rev-79",
      ok: rev === null || rev === 79,
      detail:
        rev === null
          ? "Music/Dead End Road present; revision field absent."
          : `Music revision=${rev} (require 79).`,
    });
  }

  const family = records.find((r) => nameOf(r).includes("family computer"));
  if (family) {
    const rev = revisionOf(family);
    governance.push({
      id: "family-rev-4",
      ok: rev === null || rev === 4,
      detail:
        rev === null
          ? "Family Computer Build present; revision field absent."
          : `Family Computer Build revision=${rev} (require 4).`,
    });
  }

  const archived = records.filter((r) => statusOf(r) === "archived");
  governance.push({
    id: "archived-preserved",
    ok: archived.length >= 2,
    detail: `Archived count=${archived.length} (require ≥2).`,
  });

  const expectThirteen = records.length === ANNOUNCED_EXPORT.expectedRecordCount;
  const govOk = governance.every((g) => g.ok);
  const ok = expectThirteen && govOk;

  return {
    recordCount: records.length,
    expectThirteen,
    governance,
    ok,
    message: ok
      ? `Preview validation PASS: ${records.length} records with governance checks.`
      : `Preview validation FAIL/incomplete: count=${records.length} (expect 13); see governance[].`,
  };
}

export function sha256Hex(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** Compare local bytes to announced ChatGPT export fingerprint (preview). */
export function validateAnnouncedExportBytes(buf: Buffer): {
  ok: boolean;
  bytes: number;
  sha256: string;
  bytesMatch: boolean;
  sha256Match: boolean;
  message: string;
} {
  const bytes = buf.byteLength;
  const sha256 = sha256Hex(buf);
  const bytesMatch = bytes === ANNOUNCED_EXPORT.expectedBytes;
  const sha256Match = sha256 === ANNOUNCED_EXPORT.expectedSha256;
  const ok = bytesMatch && sha256Match;
  return {
    ok,
    bytes,
    sha256,
    bytesMatch,
    sha256Match,
    message: ok
      ? "Local bytes match announced Phase-2 export fingerprint."
      : `Local bytes do not match announced export (bytesMatch=${bytesMatch}, sha256Match=${sha256Match}).`,
  };
}
