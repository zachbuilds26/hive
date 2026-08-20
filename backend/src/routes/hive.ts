import { Hono } from "hono";
import { store, setAgentAction } from "../memory/db";
import { scoutRun } from "../agents/scout";
import { analystRun } from "../agents/analyst";
import { executorRun } from "../agents/executor";
import { overseerRun, computeMetrics } from "../agents/overseer";
import { seedCrew } from "../services/payments";
import { config, isRealMode } from "../config";

export const hive = new Hono();

let seeded = false;

async function runCycle(): Promise<string[]> {
  const log: string[] = [];
  const scout = await scoutRun();
  if (scout) log.push(`scout: ${scout.token} (${scout.strength})`);
  await analystRun();
  log.push("analyst: scored");
  await executorRun();
  log.push("executor: acted");
  overseerRun();
  log.push("overseer: reviewed");
  store.loop.lastTickAt = Date.now();
  store.loop.tickCount += 1;
  if (store.loop.running) {
    store.loop.nextTickAt = Date.now() + store.loopIntervalMinutes * 60_000;
  }
  return log;
}

hive.get("/status", (c) => {
  const agents = Object.fromEntries(
    Object.entries(store.agents).map(([key, a]) => [
      key,
      { name: a.name, role: a.role, status: a.status, lastAction: a.lastAction, lastActionAt: a.lastActionAt },
    ])
  );
  return c.json({ agents, loop: store.loop, mode: isRealMode() ? "real" : config.mode });
});

hive.get("/summary", (c) => {
  const metrics = computeMetrics();
  return c.json({
    capital: store.capital,
    trades: store.trades.length,
    payments: store.payments.length,
    earn: metrics.earn,
    spend: metrics.spend,
    ratio: metrics.ratio,
    profit: metrics.profit,
  });
});

hive.get("/balances", (c) => {
  return c.json(
    Object.fromEntries(
      Object.entries(store.agents).map(([key, a]) => [key, a.balance])
    )
  );
});

hive.get("/trades", (c) => c.json(store.trades.slice(0, 50)));
hive.get("/signals", (c) => c.json(store.signals.slice(0, 50)));
hive.get("/scores", (c) => c.json(store.scores.slice(0, 50)));
hive.get("/payments", (c) => c.json(store.payments.slice(0, 50)));

hive.post("/tick", async (c) => {
  const log = await runCycle();
  return c.json({ ok: true, log });
});

hive.post("/start", (c) => {
  store.loop.running = true;
  return c.json({ ok: true, running: true });
});

hive.post("/stop", (c) => {
  store.loop.running = false;
  store.loop.nextTickAt = null;
  return c.json({ ok: true, running: false });
});

hive.post("/deposit", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const amount = Number(body.amount ?? 0);
  if (!amount || amount <= 0) {
    return c.json({ ok: false, error: "amount must be a positive number" }, 400);
  }
  if (!seeded) {
    seedCrew();
    seeded = true;
  }
  store.capital += amount;
  const executor = store.agents.executor;
  executor.balance.USDG = (executor.balance.USDG ?? 0) + amount;
  setAgentAction("executor", `Received deposit of ${amount} USDG into the hive`);
  return c.json({ ok: true, capital: store.capital });
});