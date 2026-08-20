"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTrades, getStatus, timeAgo, type Trade, type StatusResponse } from "@/lib/api";

const CREW = [
  {
    key: "scout",
    name: "Scout",
    role: "Signal detection",
    blurb: "Watches the network for volume spikes and smart-money moves, and sells its tips to the Analyst.",
  },
  {
    key: "analyst",
    name: "Analyst",
    role: "Risk scoring",
    blurb: "Pays Scout for signals, then checks them against scam patterns and scores each opportunity out of 100.",
  },
  {
    key: "executor",
    name: "Executor",
    role: "Swap execution",
    blurb: "Buys verified opportunities, builds the swap, signs it with its own wallet, and broadcasts to X Layer.",
  },
  {
    key: "overseer",
    name: "Overseer",
    role: "Economy governance",
    blurb: "Reviews the crew's earnings, spends against income, and compounds surplus back into capital.",
  },
];

const STEPS = [
  { n: "01", title: "Fund the hive", text: "Give the crew capital — a few USDG is enough to see the economy run." },
  { n: "02", title: "Scout hunts", text: "Every cycle, Scout finds the strongest signal on the network." },
  { n: "03", title: "Analyst verifies", text: "The signal is scored for scam risk. Nothing trades blind." },
  { n: "04", title: "Executor trades", text: "A real swap is signed and broadcast on X Layer. Every tx is public." },
  { n: "05", title: "Overseer compounds", text: "Surplus earnings are reinvested into capital. The hive grows itself." },
];

function Icon({ kind, className }: { kind: string; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "signal":
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <path d="M4 12h2l2-7 4 14 2-7h2" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
          <path d="M9.5 12l2 2 3.5-4" />
        </svg>
      );
    case "swap":
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <path d="M7 4v13m0 0l-3-3m3 3l3-3" />
          <path d="M17 20V7m0 0l-3 3m3-3l3 3" />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    default:
      return null;
  }
}

function formatAmount(n: number, digits = 4): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export default function Landing() {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [tradesError, setTradesError] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [t, s] = await Promise.all([getTrades(), getStatus()]);
        if (!alive) return;
        setTrades(t.slice(0, 3));
        setStatus(s);
        setTradesError(false);
      } catch {
        if (alive) setTradesError(true);
      }
    }
    load();
    const timer = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <Icon kind="eye" className="w-5 h-5 text-accent" />
          <span className="font-display font-semibold tracking-wide">HIVE</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-ink-dim">
          <a href="#crew" className="hover:text-ink transition-colors">The crew</a>
          <a href="#how" className="hover:text-ink transition-colors">How it works</a>
          <a href="#live" className="hover:text-ink transition-colors">Live proof</a>
          <Link
            href="/dashboard"
            className="panel rounded-md px-4 py-2 hover:border-zinc-500 transition-colors"
          >
            Open dashboard
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="px-6 pt-20 pb-16 max-w-6xl w-full mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-faint mb-6">
            Autonomous AI trading economy · X Layer
          </p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl leading-[1.05] max-w-3xl">
            Four AI traders.
            <br />
            One crew. No humans.
          </h1>
          <p className="mt-6 max-w-xl text-ink-dim text-lg leading-relaxed">
            HIVE is a crew of specialized AI agents — Scout, Analyst, Executor,
            Overseer — that find, verify, and execute trades on X Layer with no
            human in the loop. Fund it. Watch it work. Audit everything.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-md bg-accent text-accent-ink font-semibold px-6 py-3 hover:opacity-90 transition-opacity"
            >
              Fund the hive
            </Link>
            <a
              href="#how"
              className="panel rounded-md px-6 py-3 hover:border-zinc-500 transition-colors"
            >
              How it works
            </a>
          </div>
          {status && (
            <div className="mt-10 flex items-center gap-3 text-sm text-ink-faint">
              <span className="accent-dot" />
              <span>
                Crew online ·{" "}
                {status.mode === "sim"
                  ? "simulation mode — add OKX credentials for live swaps"
                  : "live mode — real swaps on X Layer"}
              </span>
            </div>
          )}
        </section>

        <section id="crew" className="px-6 py-16 max-w-6xl w-full mx-auto border-t hairline">
          <h2 className="font-display font-medium text-2xl md:text-3xl">Meet the crew</h2>
          <p className="mt-3 text-ink-dim max-w-xl">
            Four specialized workers, each with its own wallet, its own revenue
            stream, and one job. They pay each other for information — bad intel
            earns nothing.
          </p>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREW.map((m) => (
              <div key={m.key} className="panel rounded-md p-5">
                <div className="flex items-center gap-3">
                  <span className="text-accent">
                    <Icon kind={m.key === "scout" ? "signal" : m.key === "analyst" ? "shield" : m.key === "executor" ? "swap" : "eye"} className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{m.name}</h3>
                    <p className="text-xs text-ink-faint">{m.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink-dim leading-relaxed">{m.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="px-6 py-16 max-w-6xl w-full mx-auto border-t hairline">
          <h2 className="font-display font-medium text-2xl md:text-3xl">How it works</h2>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="panel rounded-md p-5">
                <p className="font-display text-sm text-ink-faint">{s.n}</p>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-dim leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="live" className="px-6 py-16 max-w-6xl w-full mx-auto border-t hairline">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-medium text-2xl md:text-3xl">Live proof</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-ink-faint">data: real API</span>
          </div>
          {tradesError && (
            <div className="mt-8 panel rounded-md p-6 text-sm text-ink-dim">
              Backend is offline. Start it with{" "}
              <code className="text-ink">bun run src/index.ts</code> to see live
              trades.
            </div>
          )}
          {!tradesError && !trades && (
            <div className="mt-8 panel rounded-md p-6 text-sm text-ink-dim">
              Loading latest trades…
            </div>
          )}
          {!tradesError && trades && trades.length === 0 && (
            <div className="mt-8 panel rounded-md p-6 text-sm text-ink-dim">
              No trades yet. The crew acts on a cycle — give it a kick from the
              dashboard.
            </div>
          )}
          {!tradesError && trades && trades.length > 0 && (
            <div className="mt-8 panel rounded-md overflow-hidden">
              {trades.map((t, i) => (
                <div
                  key={t.id}
                  className={`live-row flex items-center justify-between px-5 py-4 text-sm ${i > 0 ? "border-t hairline" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-xs ${t.type === "BUY" ? "text-up" : "text-down"}`}>
                      {t.type}
                    </span>
                    <span className="font-mono">{t.token}</span>
                    <span className="text-ink-faint">
                      {formatAmount(t.amountIn)} → {formatAmount(t.amountOut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-ink-faint">
                    <span className="font-mono text-xs">@{formatAmount(t.price)}</span>
                    <span>{timeAgo(t.createdAt)}</span>
                    <span className="text-xs">{t.mode === "sim" ? "sim" : "onchain"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-6 text-sm text-ink-faint">
            Every executed trade is a signed transaction on X Layer — verify on
            the{" "}
            <a
              href="https://www.oklink.com/xlayer"
              target="_blank"
              rel="noreferrer"
              className="text-ink underline underline-offset-4 hover:text-accent transition-colors"
            >
              chain explorer
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="border-t hairline">
        <div className="px-6 py-8 max-w-6xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-ink-faint">
          <span className="font-display text-ink">HIVE</span>
          <span>Built for the BuildX AI Season Hackathon on X Layer · @XLayerOfficial</span>
          <a href="/api/hive/status" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors">
            API
          </a>
        </div>
      </footer>
    </div>
  );
}