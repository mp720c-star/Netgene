import fs from "node:fs";
import path from "node:path";

export type UsageEvent = {
  id: string;
  at: string;
  kind: "chat" | "projects" | "health";
  tokensIn?: number;
  tokensOut?: number;
  ok: boolean;
  detail?: string;
};

export type UsageSnapshot = {
  events: UsageEvent[];
  totals: {
    chat: number;
    projects: number;
    health: number;
    tokensIn: number;
    tokensOut: number;
  };
};

const memoryEvents: UsageEvent[] = [];

function dataPath() {
  return path.join(process.cwd(), "data", "usage.json");
}

function readDisk(): UsageEvent[] {
  try {
    const raw = fs.readFileSync(dataPath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UsageEvent[]) : [];
  } catch {
    return [];
  }
}

function writeDisk(events: UsageEvent[]) {
  try {
    const dir = path.dirname(dataPath());
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath(), JSON.stringify(events.slice(-500), null, 2));
  } catch {
    // Ephemeral hosts may be read-only; memory store still works.
  }
}

function allEvents(): UsageEvent[] {
  const disk = readDisk();
  const map = new Map<string, UsageEvent>();
  for (const e of [...disk, ...memoryEvents]) map.set(e.id, e);
  return [...map.values()].sort((a, b) => a.at.localeCompare(b.at));
}

export function recordUsage(partial: Omit<UsageEvent, "id" | "at"> & { id?: string; at?: string }) {
  const event: UsageEvent = {
    id: partial.id ?? `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: partial.at ?? new Date().toISOString(),
    kind: partial.kind,
    tokensIn: partial.tokensIn,
    tokensOut: partial.tokensOut,
    ok: partial.ok,
    detail: partial.detail,
  };
  memoryEvents.push(event);
  writeDisk(allEvents());
  return event;
}

export function getUsageSnapshot(): UsageSnapshot {
  const events = allEvents().slice(-100);
  const totals = {
    chat: 0,
    projects: 0,
    health: 0,
    tokensIn: 0,
    tokensOut: 0,
  };
  for (const e of events) {
    totals[e.kind] += 1;
    totals.tokensIn += e.tokensIn ?? 0;
    totals.tokensOut += e.tokensOut ?? 0;
  }
  return { events, totals };
}
