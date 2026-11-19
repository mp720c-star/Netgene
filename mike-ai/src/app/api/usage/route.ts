import { getUsageSnapshot } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getUsageSnapshot());
}
