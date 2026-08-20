export const HIVE_API =
  process.env.NEXT_PUBLIC_HIVE_API || "http://localhost:3001";

export interface AgentInfo {
  name: string;
  role: string;
  status: "idle" | "working" | "error";
  lastAction: string;
  lastActionAt: number | null;
}

export interface LoopInfo {
  running: boolean;
  lastTickAt: number | null;
  nextTickAt: number | null;
  tickCount: number;
}

export interface StatusResponse {
  agents: Record<string, AgentInfo>;
  loop: LoopInfo;
  mode: "real" | "sim";
}

export interface Trade {
  id: string;
  type: "BUY" | "SELL";
  token: string;
  amountIn: number;
  amountOut: number;
  price: number;
  txHash: string | null;
  mode: "real" | "sim";
  createdAt: number;
}

export interface Summary {
  capital: number;
  trades: number;
  payments: number;
  earn: number;
  spend: number;
  ratio: number;
  profit: number;
}

export interface Signal {
  id: string;
  token: string;
  source: string;
  strength: number;
  direction: "buy" | "sell";
  mode: "real" | "sim";
  createdAt: number;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${HIVE_API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>("/hive/status");
}

export async function getSummary(): Promise<Summary> {
  return getJson<Summary>("/hive/summary");
}

export async function getTrades(): Promise<Trade[]> {
  return getJson<Trade[]>("/hive/trades");
}

export async function getSignals(): Promise<Signal[]> {
  return getJson<Signal[]>("/hive/signals");
}

export async function getBalances(): Promise<Record<string, Record<string, number>>> {
  return getJson<Record<string, Record<string, number>>>("/hive/balances");
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${HIVE_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export async function postTick(): Promise<{ ok: boolean; log: string[] }> {
  return postJson<{ ok: boolean; log: string[] }>("/hive/tick");
}

export async function postStart(): Promise<{ ok: boolean; running: boolean }> {
  return postJson<{ ok: boolean; running: boolean }>("/hive/start");
}

export async function postStop(): Promise<{ ok: boolean; running: boolean }> {
  return postJson<{ ok: boolean; running: boolean }>("/hive/stop");
}

export async function postDeposit(amount: number): Promise<{ ok: boolean; capital: number }> {
  return postJson<{ ok: boolean; capital: number }>("/hive/deposit", { amount });
}

export function timeAgo(ts: number | null): string {
  if (!ts) return "never";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}