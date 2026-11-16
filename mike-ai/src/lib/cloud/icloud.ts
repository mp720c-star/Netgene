/**
 * Real iCloud sync via Apple CloudKit Web Services (server-to-server API token).
 * Requires a CloudKit container + server-to-server key/token from Apple Developer.
 * This is the primary cloud target when configured — no simulated sync.
 */

export function iCloudConfigured(): boolean {
  return Boolean(
    process.env.ICLOUD_CLOUDKIT_CONTAINER?.trim() &&
      process.env.ICLOUD_CLOUDKIT_API_TOKEN?.trim() &&
      process.env.ICLOUD_CLOUDKIT_ENV?.trim(),
  );
}

function cloudKitBase(): string {
  const env = process.env.ICLOUD_CLOUDKIT_ENV!.trim(); // development | production
  const container = process.env.ICLOUD_CLOUDKIT_CONTAINER!.trim();
  return `https://api.apple-cloudkit.com/database/1/${container}/${env}/public/records`;
}

export async function iCloudPing(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!iCloudConfigured()) return { ok: false, error: "icloud_not_configured" };
  try {
    // Lookup a sentinel record type to validate token/container. Empty results still prove auth.
    const res = await fetch(`${cloudKitBase()}/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ICLOUD_CLOUDKIT_API_TOKEN!.trim()}`,
      },
      body: JSON.stringify({
        records: [{ recordName: "ai-platform-health-probe" }],
      }),
    });
    // 200 or 404-not-found records are fine; 401/403 mean bad credentials
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: `icloud_auth_${res.status}` };
    }
    if (!res.ok && res.status !== 400) {
      return { ok: false, error: `icloud_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "icloud_error" };
  }
}

export async function iCloudUpsertFileRecord(params: {
  recordName: string;
  projectId: string;
  fileName: string;
  checksum: string;
  sizeBytes: number;
  updatedAt: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!iCloudConfigured()) return { ok: false, error: "icloud_not_configured" };
  try {
    const res = await fetch(`${cloudKitBase()}/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ICLOUD_CLOUDKIT_API_TOKEN!.trim()}`,
      },
      body: JSON.stringify({
        operations: [
          {
            operationType: "forceUpdate",
            record: {
              recordType: "PlatformFile",
              recordName: params.recordName,
              fields: {
                projectId: { value: params.projectId },
                fileName: { value: params.fileName },
                checksum: { value: params.checksum },
                sizeBytes: { value: params.sizeBytes },
                updatedAt: { value: params.updatedAt },
              },
            },
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false, error: `icloud_modify_${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "icloud_error" };
  }
}
