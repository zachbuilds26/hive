import { store, setAgentAction } from "../memory/db";
import { config } from "../config";

export interface CrewMetrics {
  totalUsdg: number;
  earn: number;
  spend: number;
  ratio: number;
  trades: number;
  profit: number;
}

export function computeMetrics(): CrewMetrics {
  const usdg =
    Object.values(store.agents).reduce((sum, a) => sum + (a.balance.USDG ?? 0), 0) +
    store.trades
      .filter((t) => t.type === "SELL")
      .reduce((s, t) => s + t.amountOut, 0);
  const earn = store.payments
    .filter((p) => p.to === "Scout" || p.to === "Analyst")
    .reduce((s, p) => s + p.amount, 0);
  const spend = store.payments
    .filter((p) => p.from === "Analyst" || p.from === "Executor")
    .reduce((s, p) => s + p.amount, 0);
  const invested = store.trades
    .filter((t) => t.type === "BUY")
    .reduce((s, t) => s + t.amountIn, 0);
  const returned = store.trades
    .filter((t) => t.type === "SELL")
    .reduce((s, t) => s + t.amountOut, 0);
  return {
    totalUsdg: usdg,
    earn,
    spend,
    ratio: spend > 0 ? earn / spend : 0,
    trades: store.trades.length,
    profit: returned - invested,
  };
}

export function overseerRun(): void {
  const metrics = computeMetrics();
  const executor = store.agents.executor;
  const target = 0.5 * config.executorSwapAmount;
  let action = `Cycle review: ${metrics.trades} trades, ${metrics.earn.toFixed(3)} earned, ${metrics.spend.toFixed(3)} spent, ratio ${metrics.ratio.toFixed(2)}`;
  if (metrics.ratio > 1 && (executor.balance.USDG ?? 0) > target) {
    const compound = target;
    executor.balance.USDG = (executor.balance.USDG ?? 0) - compound;
    store.capital += compound;
    action += `. Compounded ${compound.toFixed(3)} USDG of surplus into capital.`;
  }
  setAgentAction("overseer", action);
}