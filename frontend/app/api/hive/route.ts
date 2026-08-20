import { hive } from "../../../../hive-backend/routes/hive";
import { loadStore, saveStore } from "../../../../hive-backend/persist";
import { store } from "../../../../hive-backend/memory/db";
import { scoutRun } from "../../../../hive-backend/agents/scout";
import { analystRun } from "../../../../hive-backend/agents/analyst";
import { executorRun } from "../../../../hive-backend/agents/executor";
import { overseerRun } from "../../../../hive-backend/agents/overseer";

export const runtime = "nodejs";
export const maxDuration = 30;

async function tickIfDue() {
  if (!store.loop.running) return;
  const interval = store.loopIntervalMinutes * 60_000;
  const last = store.loop.lastTickAt ?? 0;
  if (Date.now() - last < interval) return;
  await scoutRun();
  await analystRun();
  await executorRun();
  overseerRun();
  store.loop.lastTickAt = Date.now();
  store.loop.tickCount += 1;
  store.loop.nextTickAt = Date.now() + store.loopIntervalMinutes * 60_000;
}

async function handle(req: Request) {
  await loadStore();
  await tickIfDue();
  const res = await hive.fetch(req);
  await saveStore();
  return res;
}

export async function GET(req: Request) { return handle(req); }
export async function POST(req: Request) { return handle(req); }
