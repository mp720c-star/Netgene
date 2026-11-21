export type CloudProvider = "onedrive" | "google_drive" | "icloud";

export type ProviderStatus = {
  provider: CloudProvider;
  configured: boolean;
  missing: string[];
  role: "primary" | "replica";
};

export function cloudConfigStatus(): ProviderStatus[] {
  const need = (names: string[]) => names.filter((n) => !process.env[n]?.trim());

  return [
    {
      provider: "onedrive",
      role: "primary",
      missing: need(["ONEDRIVE_CLIENT_ID", "ONEDRIVE_CLIENT_SECRET", "ONEDRIVE_REFRESH_TOKEN"]),
      configured:
        need(["ONEDRIVE_CLIENT_ID", "ONEDRIVE_CLIENT_SECRET", "ONEDRIVE_REFRESH_TOKEN"]).length ===
        0,
    },
    {
      provider: "google_drive",
      role: "replica",
      missing: need([
        "GOOGLE_DRIVE_CLIENT_ID",
        "GOOGLE_DRIVE_CLIENT_SECRET",
        "GOOGLE_DRIVE_REFRESH_TOKEN",
      ]),
      configured:
        need([
          "GOOGLE_DRIVE_CLIENT_ID",
          "GOOGLE_DRIVE_CLIENT_SECRET",
          "GOOGLE_DRIVE_REFRESH_TOKEN",
        ]).length === 0,
    },
    {
      provider: "icloud",
      role: "replica",
      missing: need([
        "ICLOUD_CLOUDKIT_CONTAINER",
        "ICLOUD_CLOUDKIT_API_TOKEN",
        "ICLOUD_CLOUDKIT_ENV",
      ]),
      configured:
        need([
          "ICLOUD_CLOUDKIT_CONTAINER",
          "ICLOUD_CLOUDKIT_API_TOKEN",
          "ICLOUD_CLOUDKIT_ENV",
        ]).length === 0,
    },
  ];
}
