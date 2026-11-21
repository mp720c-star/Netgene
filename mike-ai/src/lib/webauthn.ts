import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type VerifiedAuthenticationResponse,
  type VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { sql } from "./db";

const challenges = new Map<string, { exp: number; kind: "reg" | "auth" }>();

function putChallenge(kind: "reg" | "auth", challenge: string) {
  challenges.set(challenge, { exp: Date.now() + 5 * 60 * 1000, kind });
}

function takeChallenge(challenge: string, kind: "reg" | "auth"): boolean {
  const row = challenges.get(challenge);
  challenges.delete(challenge);
  return Boolean(row && row.kind === kind && row.exp >= Date.now());
}

export function rpIdFromRequest(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost";
  return host.split(":")[0] || "localhost";
}

function originsFor(req: Request): string[] {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const extras = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([origin, ...extras]));
}

export async function listCredentials() {
  return sql<{
    id: string;
    public_key: string;
    counter: string;
    transports: unknown;
  }>(`SELECT id, public_key, counter::text AS counter, transports FROM webauthn_credentials`);
}

export async function hasFaceIdCredential(): Promise<boolean> {
  const rows = await sql<{ n: string }>(`SELECT COUNT(*)::text AS n FROM webauthn_credentials`);
  return Number(rows[0]?.n || 0) > 0;
}

export async function registrationOptions(req: Request) {
  const existing = await listCredentials();
  const options = await generateRegistrationOptions({
    rpName: "AI Project Platform",
    rpID: rpIdFromRequest(req),
    userName: "owner",
    userDisplayName: "Platform Owner",
    userID: new TextEncoder().encode("ai-platform-owner"),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: Array.isArray(c.transports)
        ? (c.transports as AuthenticatorTransportFuture[])
        : undefined,
    })),
  });
  putChallenge("reg", options.challenge);
  return options;
}

export async function authenticationOptions(req: Request) {
  const creds = await listCredentials();
  const options = await generateAuthenticationOptions({
    rpID: rpIdFromRequest(req),
    userVerification: "required",
    allowCredentials: creds.map((c) => ({
      id: c.id,
      transports: Array.isArray(c.transports)
        ? (c.transports as AuthenticatorTransportFuture[])
        : undefined,
    })),
  });
  putChallenge("auth", options.challenge);
  return options;
}

export async function verifyRegistration(input: {
  req: Request;
  response: unknown;
  expectedChallenge: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!takeChallenge(input.expectedChallenge, "reg")) {
    return { ok: false, error: "challenge_invalid" };
  }
  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response: input.response as Parameters<typeof verifyRegistrationResponse>[0]["response"],
      expectedChallenge: input.expectedChallenge,
      expectedOrigin: originsFor(input.req),
      expectedRPID: rpIdFromRequest(input.req),
      requireUserVerification: true,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "registration_verify_failed",
    };
  }
  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: "registration_not_verified" };
  }
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  // Store credential public key bytes from server verification (never trust client-supplied SPKI alone).
  const publicKey = Buffer.from(credential.publicKey).toString("base64url");
  await sql(
    `INSERT INTO webauthn_credentials (id, public_key, counter, transports)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       public_key = EXCLUDED.public_key,
       counter = EXCLUDED.counter,
       transports = EXCLUDED.transports`,
    [
      credential.id,
      publicKey,
      credential.counter,
      JSON.stringify({
        transports: credential.transports ?? [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      }),
    ],
  );
  return { ok: true };
}

export async function verifyAuthentication(input: {
  req: Request;
  response: unknown;
  expectedChallenge: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!takeChallenge(input.expectedChallenge, "auth")) {
    return { ok: false, error: "challenge_invalid" };
  }
  const body = input.response as { id?: string };
  if (!body.id) return { ok: false, error: "missing_credential_id" };

  const rows = await sql<{ id: string; public_key: string; counter: string; transports: unknown }>(
    `SELECT id, public_key, counter::text AS counter, transports FROM webauthn_credentials WHERE id = $1`,
    [body.id],
  );
  const cred = rows[0];
  if (!cred) return { ok: false, error: "unknown_credential" };

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response: input.response as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
      expectedChallenge: input.expectedChallenge,
      expectedOrigin: originsFor(input.req),
      expectedRPID: rpIdFromRequest(input.req),
      requireUserVerification: true,
      credential: {
        id: cred.id,
        publicKey: Buffer.from(cred.public_key, "base64url"),
        counter: Number(cred.counter),
        transports: Array.isArray((cred.transports as { transports?: unknown })?.transports)
          ? ((cred.transports as { transports: AuthenticatorTransportFuture[] }).transports)
          : Array.isArray(cred.transports)
            ? (cred.transports as AuthenticatorTransportFuture[])
            : undefined,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "authentication_verify_failed",
    };
  }
  if (!verification.verified || !verification.authenticationInfo) {
    return { ok: false, error: "authentication_not_verified" };
  }
  await sql(`UPDATE webauthn_credentials SET counter = $2 WHERE id = $1`, [
    cred.id,
    verification.authenticationInfo.newCounter,
  ]);
  return { ok: true };
}
