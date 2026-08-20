import { store, nextId, addScore, setAgentAction, Signal } from "../memory/db";
import { getSecuritySummary } from "../services/okx";
import { pay } from "../services/payments";
import { config } from "../config";

async function llmScore(
  token: string,
  security: { honeypot: boolean; holders: number; liquidityUsd: number }
): Promise<number | null> {
  if (!config.openaiApiKey) return null;
  const prompt = [
    `You are a crypto risk analyst. Score the token ${token} from 0 (scam) to 100 (safe investment).`,
    `Security data: honeypot=${security.honeypot}, holders=${security.holders}, liquidityUsd=${security.liquidityUsd}.`,
    "Reply with only a number.",
  ].join("\n");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8,
    }),
  });
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  const parsed = Number(content.trim());
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
}

function heuristicScore(security: {
  honeypot: boolean;
  holders: number;
  liquidityUsd: number;
}): number {
  let score = 50;
  if (security.honeypot) score -= 40;
  if (security.holders > 500) score += 10;
  else if (security.holders < 100) score -= 15;
  if (security.liquidityUsd > 100_000) score += 15;
  else if (security.liquidityUsd < 20_000) score -= 15;
  return Math.max(0, Math.min(100, score));
}

export async function analystRun(): Promise<void> {
  setAgentAction("analyst", "Looking for an unbought signal");
  const signal = store.signals.find((s) => s.boughtBy === null);
  if (!signal) {
    setAgentAction("analyst", "No new signals to score");
    return;
  }
  const paid = await pay("analyst", "scout", config.signalPrice, "USDG");
  if (!paid.ok) {
    setAgentAction("analyst", `Cannot pay Scout: ${paid.error}`, "error");
    return;
  }
  signal.boughtBy = "analyst";
  setAgentAction("analyst", `Bought signal on ${signal.token}, running risk checks`);
  try {
    const security = await getSecuritySummary(signal.token);
    const llm = await llmScore(signal.token, security);
    const scoreValue = llm ?? heuristicScore(security);
    const reasons = [
      `honeypot: ${security.honeypot ? "flagged" : "clear"}`,
      `holders: ${security.holders}`,
      `liquidity: ${security.liquidityUsd.toFixed(0)} USD`,
      llm !== null ? "scored by LLM" : "scored by rules",
    ];
    const score = {
      id: nextId("scr"),
      signalId: signal.id,
      token: signal.token,
      score: scoreValue,
      reasons,
      mode: signal.mode,
      createdAt: Date.now(),
      boughtBy: null,
    };
    addScore(score);
    setAgentAction(
      "analyst",
      `Scored ${signal.token}: ${scoreValue}/100 (${llm !== null ? "LLM" : "rules"})`
    );
  } catch (err) {
    setAgentAction("analyst", `Error: ${(err as Error).message}`, "error");
  }
}