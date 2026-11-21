import { clearSessionCookieHeader } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookieHeader() } },
  );
}
