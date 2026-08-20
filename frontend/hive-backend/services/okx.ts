import { config, isRealMode } from "../config";

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

function sign(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string
): Promise<string> {
  const message = `${timestamp}${method}${requestPath}${body}`;
  const key = new TextEncoder().encode(config.okxSecretKey);
  const data = new TextEncoder().encode(message);
  return crypto.subtle
    .importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((cryptoKey) => crypto.subtle.sign("HMAC", cryptoKey, data))
    .then((sig) => {
      const bytes = new Uint8Array(sig);
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      return btoa(binary);
    });
}

async function okxRequest(
  method: string,
  path: string,
  body: Record<string, unknown> = {}
): Promise<{ data: unknown[] } | null> {
  const base = config.okxApiBase;
  const jsonBody = Object.keys(body).length ? JSON.stringify(body) : "";
  const timestamp = new Date().toISOString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.okxApiKey) {
    headers["OK-ACCESS-KEY"] = config.okxApiKey;
    headers["OK-ACCESS-TIMESTAMP"] = timestamp;
    headers["OK-ACCESS-PASSPHRASE"] = config.okxPassphrase;
    headers["OK-ACCESS-SIGN"] = await sign(timestamp, method, path, jsonBody);
  }
  const res = await fetchWithTimeout(base + path, {
    method,
    headers,
    body: jsonBody || undefined,
  });
  const json = (await res.json()) as { code?: string; data?: unknown[] };
  if (!res.ok || (json.code && json.code !== "0")) {
    throw new Error(`OKX ${path}: ${json.code} ${JSON.stringify(json).slice(0, 200)}`);
  }
  return { data: json.data ?? [] };
}

export interface PriceQuote {
  price: number;
  mode: "real" | "sim";
}

function simPrice(): number {
  const base = 1.0;
  const wave = Math.sin(Date.now() / 45_000) * 0.03;
  const noise = (Math.random() - 0.5) * 0.01;
  return Number((base + wave + noise).toFixed(4));
}

export async function getPrice(): Promise<PriceQuote> {
  if (!isRealMode()) {
    return { price: simPrice(), mode: "sim" };
  }
  try {
    const res = await okxRequest("GET", `/api/v6/market/ticker?instId=${config.instId}`);
    const ticker = res?.data?.[0] as { last?: string } | undefined;
    if (ticker?.last) {
      return { price: Number(ticker.last), mode: "real" };
    }
    throw new Error("no ticker data");
  } catch (err) {
    console.warn("price fetch failed, using simulated price:", (err as Error).message);
    return { price: simPrice(), mode: "sim" };
  }
}

export interface SignalCandidate {
  token: string;
  source: string;
  strength: number;
  price: number;
  direction: "buy" | "sell";
  mode: "real" | "sim";
}

export async function getSignals(): Promise<SignalCandidate[]> {
  if (isRealMode()) {
    const res = await okxRequest(
      "GET",
      "/api/v6/dex/signal/token/significant?period=24H&limit=10"
    );
    const rows = (res?.data ?? []) as Array<Record<string, unknown>>;
    return rows.slice(0, 5).map((r) => ({
      token: String(r["instId"] ?? "OKB-USDT").split("-")[0],
      source: "smart-money",
      strength: Number(r["strength"] ?? 50),
      price: Number(r["price"] ?? 0),
      direction: (Number(r["strength"] ?? 0) >= 50 ? "buy" : "sell") as "buy" | "sell",
      mode: "real",
    }));
  }
  const price = simPrice();
  return [
    {
      token: config.quoteToken,
      source: "volume-spike",
      strength: 40 + Math.round(Math.random() * 50),
      price,
      direction: (Math.random() > 0.3 ? "buy" : "sell") as "buy" | "sell",
      mode: "sim" as "sim" | "real",
    },
    {
      token: config.quoteToken,
      source: "hot-token",
      strength: 30 + Math.round(Math.random() * 55),
      price,
      direction: (Math.random() > 0.35 ? "buy" : "sell") as "buy" | "sell",
      mode: "sim" as "sim" | "real",
    },
  ].sort((a, b) => b.strength - a.strength);
}

export interface SwapResult {
  txHash: string | null;
  amountIn: number;
  amountOut: number;
  price: number;
  mode: "real" | "sim";
}

export async function executeSwap(
  fromToken: string,
  toToken: string,
  amount: number
): Promise<SwapResult> {
  if (!isRealMode()) {
    const price = simPrice();
    const drift = 1 + (Math.random() - 0.5) * 0.01;
    return {
      txHash: null,
      amountIn: amount,
      amountOut: Number((amount / price * drift).toFixed(6)),
      price,
      mode: "sim",
    };
  }
  const res = await okxRequest("POST", "/api/v6/dex/aggregator/swap", {
    fromToken,
    toToken,
    amount: String(amount),
  });
  const row = (res?.data?.[0] ?? {}) as Record<string, unknown>;
  return {
    txHash: String(row["txId"] ?? row["txHash"] ?? ""),
    amountIn: amount,
    amountOut: Number(row["toTokenAmount"] ?? 0),
    price: Number(row["price"] ?? 0),
    mode: "real",
  };
}

export async function getSecuritySummary(token: string): Promise<{
  honeypot: boolean;
  holders: number;
  liquidityUsd: number;
  mode: "real" | "sim";
}> {
  if (isRealMode()) {
    const res = await okxRequest(
      "GET",
      `/api/v6/dex/token/security?tokenAddress=${token}`
    );
    const row = (res?.data?.[0] ?? {}) as Record<string, unknown>;
    return {
      honeypot: String(row["honeypot"] ?? "false") === "true",
      holders: Number(row["holderCount"] ?? 0),
      liquidityUsd: Number(row["liquidity"] ?? 0),
      mode: "real",
    };
  }
  return {
    honeypot: false,
    holders: 100 + Math.round(Math.random() * 900),
    liquidityUsd: 50_000 + Math.round(Math.random() * 200_000),
    mode: "sim",
  };
}