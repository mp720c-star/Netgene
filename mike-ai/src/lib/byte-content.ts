import { createHash } from "node:crypto";

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function pushUnique(out: Buffer[], buf: Buffer | null) {
  if (!buf) return;
  if (out.some((existing) => existing.equals(buf))) return;
  out.push(buf);
}

/**
 * Stored file bytes may come back as a Buffer, a Uint8Array, a pg `\x` hex
 * string, or base64. Pick the decoding whose SHA-256 matches the row when
 * one was recorded.
 */
export function decodeStoredBytes(value: unknown, expectedSha256?: string | null): Buffer | null {
  const candidates: Buffer[] = [];
  if (Buffer.isBuffer(value)) pushUnique(candidates, value);
  else if (value instanceof Uint8Array) pushUnique(candidates, Buffer.from(value));
  else if (value instanceof ArrayBuffer) pushUnique(candidates, Buffer.from(value));
  else if (
    Array.isArray(value) &&
    value.every((n) => typeof n === "number" && n >= 0 && n <= 255)
  ) {
    pushUnique(candidates, Buffer.from(value));
  } else if (value && typeof value === "object" && "type" in value && "data" in value) {
    const wrapped = value as { type?: unknown; data?: unknown };
    if (wrapped.type === "Buffer" && Array.isArray(wrapped.data)) {
      pushUnique(candidates, Buffer.from(wrapped.data as number[]));
    }
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") pushUnique(candidates, Buffer.alloc(0));
    const hexBody = trimmed.replace(/^\\x/i, "");
    if (/^(?:\\x)?[0-9a-fA-F]*$/i.test(trimmed) && hexBody.length % 2 === 0) {
      pushUnique(candidates, Buffer.from(hexBody, "hex"));
    }
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length % 4 === 0) {
      pushUnique(candidates, Buffer.from(trimmed, "base64"));
    }
  } else if (value == null) {
    return null;
  }

  if (candidates.length === 0) return null;
  if (expectedSha256) {
    const match = candidates.find((buf) => sha256Hex(buf) === expectedSha256.toLowerCase());
    if (match) return match;
  }
  return candidates[0];
}
