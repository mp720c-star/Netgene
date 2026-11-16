import { createHash, randomBytes } from "node:crypto";
import { sql } from "./db";

function b64url(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(s: string): Buffer {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from((s + pad).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function rpIdFromRequest(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost";
  return host.split(":")[0] || "localhost";
}

const challenges = new Map<string, { exp: number; kind: "reg" | "auth" }>();

function putChallenge(kind: "reg" | "auth"): string {
  const challenge = b64url(randomBytes(32));
  challenges.set(challenge, { exp: Date.now() + 5 * 60 * 1000, kind });
  return challenge;
}

function takeChallenge(challenge: string, kind: "reg" | "auth"): boolean {
  const row = challenges.get(challenge);
  challenges.delete(challenge);
  return Boolean(row && row.kind === kind && row.exp >= Date.now());
}

export async function listCredentials() {
  return sql<{ id: string; public_key: string; counter: string; transports: unknown }>(
    `SELECT id, public_key, counter::text AS counter, transports FROM webauthn_credentials`,
  );
}

export async function hasFaceIdCredential(): Promise<boolean> {
  const rows = await sql<{ n: string }>(`SELECT COUNT(*)::text AS n FROM webauthn_credentials`);
  return Number(rows[0]?.n || 0) > 0;
}

export function registrationOptions(req: Request) {
  const challenge = putChallenge("reg");
  return {
    challenge,
    rp: { name: "AI Platform", id: rpIdFromRequest(req) },
    user: {
      id: b64url(Buffer.from("ai-platform-owner")),
      name: "owner",
      displayName: "Platform Owner",
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
    timeout: 120000,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    attestation: "none",
  };
}

export async function authenticationOptions(req: Request) {
  const creds = await listCredentials();
  const challenge = putChallenge("auth");
  return {
    challenge,
    timeout: 120000,
    rpId: rpIdFromRequest(req),
    userVerification: "required",
    allowCredentials: creds.map((c) => ({
      type: "public-key",
      id: c.id,
      transports: Array.isArray(c.transports) ? c.transports : undefined,
    })),
  };
}

export async function verifyRegistration(input: {
  id: string;
  clientDataJSON: string;
  publicKey: string;
  transports?: string[];
  challenge: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!takeChallenge(input.challenge, "reg")) return { ok: false, error: "challenge_invalid" };
  try {
    const client = JSON.parse(fromB64url(input.clientDataJSON).toString("utf8")) as {
      type?: string;
      challenge?: string;
    };
    if (client.type !== "webauthn.create") return { ok: false, error: "client_type" };
    if (client.challenge !== input.challenge) return { ok: false, error: "challenge_mismatch" };
  } catch {
    return { ok: false, error: "client_data" };
  }
  if (!input.id || !input.publicKey) return { ok: false, error: "missing_credential" };
  await sql(
    `INSERT INTO webauthn_credentials (id, public_key, counter, transports)
     VALUES ($1, $2, 0, $3::jsonb)
     ON CONFLICT (id) DO UPDATE SET public_key = EXCLUDED.public_key, transports = EXCLUDED.transports`,
    [input.id, input.publicKey, JSON.stringify(input.transports ?? [])],
  );
  return { ok: true };
}

export async function verifyAuthentication(input: {
  id: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  challenge: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!takeChallenge(input.challenge, "auth")) return { ok: false, error: "challenge_invalid" };
  const rows = await sql<{ id: string; public_key: string; counter: string }>(
    `SELECT id, public_key, counter::text AS counter FROM webauthn_credentials WHERE id = $1`,
    [input.id],
  );
  const cred = rows[0];
  if (!cred) return { ok: false, error: "unknown_credential" };

  try {
    const client = JSON.parse(fromB64url(input.clientDataJSON).toString("utf8")) as {
      type?: string;
      challenge?: string;
    };
    if (client.type !== "webauthn.get") return { ok: false, error: "client_type" };
    if (client.challenge !== input.challenge) return { ok: false, error: "challenge_mismatch" };
  } catch {
    return { ok: false, error: "client_data" };
  }

  const authData = fromB64url(input.authenticatorData);
  if (authData.length < 37) return { ok: false, error: "auth_data" };
  const counter = authData.readUInt32BE(33);
  const prev = Number(cred.counter);
  if (counter > 0 && counter <= prev) return { ok: false, error: "counter" };

  try {
    const clientHash = createHash("sha256").update(fromB64url(input.clientDataJSON)).digest();
    const signed = Buffer.concat([authData, clientHash]);
    const key = await crypto.subtle.importKey(
      "spki",
      new Uint8Array(fromB64url(cred.public_key)),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      new Uint8Array(fromB64url(input.signature)),
      new Uint8Array(signed),
    );
    if (!ok) return { ok: false, error: "signature" };
  } catch {
    return { ok: false, error: "signature_verify" };
  }

  await sql(`UPDATE webauthn_credentials SET counter = $2 WHERE id = $1`, [
    input.id,
    Math.max(counter, prev + 1),
  ]);
  return { ok: true };
}
