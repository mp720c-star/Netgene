import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { getIdentity } from "../../cursor/identity";

const COOKIE = "ai_platform_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

function sessionSecret(): string | null {
  const s = process.env.SESSION_SECRET?.trim();
  return s || null;
}

export function unlockCodeConfigured(): boolean {
  return Boolean(process.env.PLATFORM_UNLOCK_CODE?.trim());
}

export function sessionConfigured(): boolean {
  return Boolean(sessionSecret());
}

export function authReady(): boolean {
  return unlockCodeConfigured() && sessionConfigured();
}

export function checkUnlockCode(candidate: string): boolean {
  const expected = process.env.PLATFORM_UNLOCK_CODE?.trim();
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET_missing");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(method: "passcode" | "webauthn"): string {
  const body = Buffer.from(
    JSON.stringify({
      v: 1,
      method,
      iat: Date.now(),
      nonce: randomBytes(8).toString("hex"),
    }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || !sessionSecret()) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  try {
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      iat?: number;
    };
    if (!parsed.iat || Date.now() - parsed.iat > MAX_AGE_SEC * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)ai_platform_session=([^;]+)/);
  return match?.[1] ?? null;
}

/** Cursor sign-in on the published private app, or the optional password session. */
export async function hasPlatformAccess(req: Request): Promise<boolean> {
  const identity = await getIdentity(req);
  if (identity.verified && identity.kind === "person") return true;
  if (!authReady()) return false;
  return verifySessionToken(readSessionCookie(req.headers.get("cookie")));
}

export async function requireUnlocked(req: Request): Promise<Response | null> {
  if (await hasPlatformAccess(req)) return null;
  return Response.json(
    {
      error: "locked",
      message: authReady()
        ? "Unlock with Face ID or password."
        : "Sign in with Cursor to open this app.",
    },
    { status: 401, headers: { "cache-control": "private, no-store" } },
  );
}
