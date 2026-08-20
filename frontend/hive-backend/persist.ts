import { store, seedCrewIfNeeded } from "./memory/db";

const KV_URL = process.env.VERCEL_KV_REST_API_URL || "";
const KV_TOKEN = process.env.VERCEL_KV_REST_API_TOKEN || "";

const KEY = "hive:store";

export function kvAvailable(): boolean {
  return KV_URL.length > 0 && KV_TOKEN.length > 0;
}

async function kvGet(key: string): Promise<string | null> {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: string };
  return json.result ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  await fetch(`${KV_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
}

export async function loadStore(): Promise<void> {
  seedCrewIfNeeded();
  if (!kvAvailable()) return;
  try {
    const raw = await kvGet(KEY);
    if (!raw) {
      seedCrewIfNeeded();
      await saveStore();
      return;
    }
    const parsed = JSON.parse(raw) as typeof store;
    Object.assign(store, parsed);
    seedCrewIfNeeded();
  } catch {
    // fall through to in-memory seed
  }
}

export async function saveStore(): Promise<void> {
  if (!kvAvailable()) return;
  try {
    await kvSet(KEY, JSON.stringify(store));
  } catch {
    // storage hiccup — state survives in memory for this request
  }
}