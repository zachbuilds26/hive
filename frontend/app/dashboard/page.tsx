"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBalances,
  getStatus,
  getSummary,
  getTrades,
  postDeposit,
  postStart,
  postStop,
  postTick,
  timeAgo,
  type AgentInfo,
  type Summary,
  type Trade,
} from "@/lib/api";

const ORDER = ["scout", "analyst", "executor", "overseer"] as const;

function formatAmount(n: number, digits = 4): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function StatusDot({ status }: { status: AgentInfo["status"] }) {
  const color =
    status === "error" ? "bg-down" : status === "working" ? "bg-accent" : "bg-ink-faint";
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
  );
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Record<string, AgentInfo> | null>(null);
  const [loop, setLoop] = useState<{ running: boolean; tickCount: number; lastTickAt: number | null } | null>(null);
  const [mode, setMode] = useState<"real" | "sim">("sim");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balances, setBalances] = useState<Record<string, Record<string, number>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState("");
  const [investing, setInvesting] = useState(false);
  const [tickLog, setTickLog] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const firstLoad = useRef(false);

  const load = useCallback(async () => {
    try {
      const [s, sum, t, b] = await Promise.all([
        getStatus(),
        getSummary(),
        getTrades(),
        getBalances(),
      ]);
      setAgents(s.agents);
      setLoop(s.loop);
      setMode(s.mode);
      setSummary(sum);
      setTrades(t);
      setBalances(b);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      load();
    }
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function run(action: "start" | "stop" | "tick") {
    setBusy(true);
    try {
      if (action === "start") await postStart();
      else if (action === "stop") await postStop();
      else {
        const r = await postTick();
        setTickLog(r.log);
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function invest() {
    const amount = Number(investAmount);
    if (!amount || amount <= 0) return;
    setInvesting(true);
    try {
      await postDeposit(amount);
      setInvestAmount("");
      setTickLog(["Deposit received — the hive is funded"]);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setInvesting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-ink-dim">Connecting to the hive…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="panel rounded-md p-6 max-w-md w-full">
          <h1 className="font-display font-semibold">Hive is unreachable</h1>
          <p className="mt-3 text-sm text-ink-dim">
            Start the backend with <code className="text-ink">bun run src/index.ts</code>{" "}
            in <code className="text-ink">hive/backend</code>, then reload.
          </p>
          <p className="mt-4 text-xs text-ink-faint">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b hairline">
        <div className="px-6 py-4 max-w-6xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display font-semibold tracking-wide">
              HIVE
            </Link>
            <span className="text-xs uppercase tracking-[0.2em] text-ink-faint">
              {mode === "sim" ? "simulation" : "live on X Layer"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-dim">
            <span className="flex items-center gap-2">
              <span className={loop?.running ? "accent-dot" : "inline-block w-2 h-2 rounded-full bg-ink-faint"} />
              {loop?.running ? "running" : "paused"}
            </span>
            <span>cycles: {loop?.tickCount ?? 0}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
        <section className="grid md:grid-cols-3 gap-4">
          <div className="panel rounded-md p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">Capital</p>
            <p className="mt-2 font-display font-semibold text-2xl">
              {summary ? `${formatAmount(summary.capital, 2)} USDG` : "—"}
            </p>
          </div>
          <div className="panel rounded-md p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">Realized P&L</p>
            <p
              className={`mt-2 font-display font-semibold text-2xl ${
                summary && summary.profit < 0 ? "text-down" : "text-up"
              }`}
            >
              {summary ? `${summary.profit >= 0 ? "+" : ""}${formatAmount(summary.profit, 2)} USDG` : "—"}
            </p>
          </div>
          <div className="panel rounded-md p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">Trades</p>
            <p className="mt-2 font-display font-semibold text-2xl">
              {summary ? summary.trades : "—"}
            </p>
          </div>
        </section>

        <section className="mt-8 panel rounded-md p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-medium">Fund the hive</h2>
              <p className="mt-1 text-sm text-ink-dim">
                Deposit USDG into the crew. The loop trades it every cycle.
              </p>
            </div>
            <form
              className="flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                invest();
              }}
            >
              <input
                type="number"
                min="1"
                step="1"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                placeholder="Amount"
                className="panel rounded-md px-4 py-2 w-32 bg-panel-raised text-sm focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                disabled={investing || !investAmount}
                className="rounded-md bg-accent text-accent-ink font-semibold px-5 py-2 text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {investing ? "Sending…" : "Invest"}
              </button>
            </form>
          </div>
        </section>

        <section className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => run("start")}
            disabled={busy || loop?.running}
            className="panel rounded-md px-4 py-2 text-sm disabled:opacity-40 hover:border-zinc-500 transition-colors"
          >
            Start loop
          </button>
          <button
            onClick={() => run("stop")}
            disabled={busy || !loop?.running}
            className="panel rounded-md px-4 py-2 text-sm disabled:opacity-40 hover:border-zinc-500 transition-colors"
          >
            Stop loop
          </button>
          <button
            onClick={() => run("tick")}
            disabled={busy}
            className="panel rounded-md px-4 py-2 text-sm disabled:opacity-40 hover:border-zinc-500 transition-colors"
          >
            Run one cycle
          </button>
          {tickLog && (
            <ol className="text-xs text-ink-faint font-mono">
              {tickLog.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ORDER.map((key) => {
            const a = agents?.[key];
            if (!a) return null;
            return (
              <div key={key} className="panel rounded-md p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{a.name}</h3>
                  <StatusDot status={a.status} />
                </div>
                <p className="text-xs text-ink-faint mt-1">{a.role}</p>
                <p className="mt-4 text-sm text-ink-dim leading-relaxed min-h-[3rem]">
                  {a.lastAction}
                </p>
                <p className="mt-2 text-xs text-ink-faint">{timeAgo(a.lastActionAt)}</p>
                <div className="mt-3 border-t hairline pt-3 text-xs text-ink-faint">
                  <p>USDG: {balances?.[key]?.USDG !== undefined ? formatAmount(balances[key].USDG) : "—"}</p>
                  <p className="mt-1">OKB: {balances?.[key]?.OKB !== undefined ? formatAmount(balances[key].OKB) : "—"}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-medium">Recent trades</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-ink-faint">
              {mode === "sim" ? "simulated" : "onchain"}
            </span>
          </div>
          {trades.length === 0 ? (
            <div className="mt-4 panel rounded-md p-6 text-sm text-ink-dim">
              No trades yet. Hit "Run one cycle" to start the crew.
            </div>
          ) : (
            <div className="mt-4 panel rounded-md overflow-hidden">
              {trades.slice(0, 12).map((t, i) => (
                <div
                  key={t.id}
                  className={`live-row flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm ${i > 0 ? "border-t hairline" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-xs ${t.type === "BUY" ? "text-up" : "text-down"}`}>
                      {t.type}
                    </span>
                    <span className="font-mono">{t.token}</span>
                    <span className="text-ink-faint font-mono text-xs">
                      {formatAmount(t.amountIn)} → {formatAmount(t.amountOut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-ink-faint text-xs">
                    <span className="font-mono">@{formatAmount(t.price)}</span>
                    <span>{timeAgo(t.createdAt)}</span>
                    {t.txHash ? (
                      <a
                        href={`https://www.oklink.com/xlayer/tx/${t.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink underline underline-offset-4 hover:text-accent transition-colors"
                      >
                        {t.txHash.slice(0, 10)}…
                      </a>
                    ) : (
                      <span>sim</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t hairline">
        <div className="px-6 py-6 max-w-6xl w-full mx-auto flex items-center justify-between text-xs text-ink-faint">
          <span>HIVE · X Layer testnet (chain 195)</span>
          <span>{mode === "sim" ? "Simulation mode — no real funds moved" : "Live mode — real funds on X Layer"}</span>
        </div>
      </footer>
    </div>
  );
}