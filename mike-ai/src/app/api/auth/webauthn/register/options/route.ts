import { requireUnlocked } from "@/lib/session";
import { registrationOptions } from "@/lib/webauthn";
import { assertTrustedOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = requireUnlocked(req);
  if (locked) return locked;
  return Response.json({ ok: true, options: registrationOptions(req) });
}
