/**
 * Authoritative board + workspace project catalog.
 * Board names come from the Shared AI Status Board (2026-10-18 export).
 * Forma + Vehicle Genius are real Netgene hub apps included so the platform
 * surfaces every workspace project (13 total with the 11 board rows).
 */

export type BoardProjectSeed = {
  name: string;
  summary: string;
  status: "active" | "paused" | "archived";
  tags: string[];
  /** Stable id used when inserting into an empty database. */
  seedId?: string;
};

export const BOARD_PROJECTS: BoardProjectSeed[] = [
  {
    seedId: "seed-ai-platform",
    name: "AI Project Platform",
    summary:
      "Canonical cross-device platform — OneDrive primary; Google Drive + iCloud backups.",
    status: "active",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-revo-roku",
    name: "REVO + Roku Camera Dashboard",
    summary: "Camera feeds and TV display project.",
    status: "active",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-mike-ai",
    name: "MIKE AI (iPhone & Android)",
    summary: "Separate branded assistant project inside the platform.",
    status: "active",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-family-pc",
    name: "Family Computer Build & Dell Upgrade",
    summary: "Hardware allocation within $1000 ceiling.",
    status: "active",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-sara",
    name: "Operation Keep Sara Working",
    summary: "Urgent filing/review project.",
    status: "active",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-auto-truck",
    name: "Auto Truck Diagnostics for Dummies",
    summary: "Priority OBD / truck diagnostics — signed Windows baseline 1.2.0.",
    status: "active",
    tags: ["board-seed", "priority"],
  },
  {
    seedId: "seed-cdi",
    name: "CDI Genius",
    summary: "Ignition diagnostics Expo / Windows baseline.",
    status: "active",
    tags: ["board-seed", "hub-app"],
  },
  {
    seedId: "seed-kathy",
    name: "Kathy's Health App",
    summary: "Health client + AI-ready server.",
    status: "active",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-ravin",
    name: "Ravin Lookup Tool / TITAN",
    summary: "Vehicle lookup tool and Windows installers — governance: PAUSED.",
    status: "paused",
    tags: ["board-seed", "hub-app"],
  },
  {
    seedId: "seed-dead-end",
    name: "Dead End Road Music & Video Album",
    summary: "Final 12-track album; only three original videos kept.",
    status: "active",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-mike-cd",
    name: "Mike Paine CD Album",
    summary: "Archived — superseded by Dead End Road.",
    status: "archived",
    tags: ["board-seed"],
  },
  {
    seedId: "seed-forma",
    name: "Forma",
    summary: "On-device browser photo editor — Netgene hub app under /apps/forma.",
    status: "active",
    tags: ["workspace-app", "hub-app"],
  },
  {
    seedId: "seed-vehicle-genius",
    name: "Vehicle Genius",
    summary: "Offline symptom helper — Netgene hub app under /apps/vehicle-genius.",
    status: "active",
    tags: ["workspace-app", "hub-app"],
  },
];

export const HUB_APPS = [
  {
    name: "Forma",
    href: "/apps/forma",
    blurb: "Private on-device photo editor",
  },
  {
    name: "Vehicle Genius",
    href: "/apps/vehicle-genius",
    blurb: "Offline vehicle symptom helper",
  },
  {
    name: "CDI Genius",
    href: "/apps/cdi-genius",
    blurb: "CDI diagnostic decision tree",
  },
  {
    name: "Apps hub",
    href: "/apps",
    blurb: "Full Netgene project index",
  },
  {
    name: "Ravin downloads",
    href: "/downloads",
    blurb: "Windows portable installers (product paused)",
  },
] as const;
