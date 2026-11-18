import { requireUnlocked } from "@/lib/session";
import { registrationOptions } from "@/lib/webauthn";
import { assertTrustedOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = await requireUnlocked(req);
  if (locked) return locked;
  const options = await registrationOptions(req);
  return Response.json({ ok: true, options });
}
