/**
 * Fail-closed Origin check for mutating API routes.
 * Allows same-host Origin/Referer, localhost during local/dev, and optional ALLOWED_ORIGINS.
 */
export function assertTrustedOrigin(req: Request): Response | null {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  const allowed = new Set<string>();
  allowed.add(`http://${host}`);
  allowed.add(`https://${host}`);
  allowed.add("http://localhost:3000");
  allowed.add("http://127.0.0.1:3000");
  allowed.add("http://localhost:3001");
  allowed.add("http://127.0.0.1:3001");

  const extra = process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  for (const o of extra) allowed.add(o);

  let candidate = origin ?? null;
  if (!candidate && referer) {
    try {
      candidate = new URL(referer).origin;
    } catch {
      candidate = null;
    }
  }

  // Server-to-server / health probes without browser Origin are rejected for POST.
  if (!candidate) {
    return Response.json(
      { error: "origin_required", message: "Missing Origin/Referer — request refused (fail-closed)." },
      { status: 403 },
    );
  }

  if (!allowed.has(candidate)) {
    return Response.json(
      { error: "origin_forbidden", message: `Origin ${candidate} is not allowed.` },
      { status: 403 },
    );
  }

  return null;
}

export function hasModelCredentials() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY);
}
