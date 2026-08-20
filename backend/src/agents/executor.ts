import { store, nextId, addTrade, setAgentAction, Score } from "../memory/db";
import { executeSwap } from "../services/okx";
import { pay } from "../services/payments";
import { config } from "../config";

export async function executorRun(): Promise<void> {
  setAgentAction("executor", "Looking for an unscored purchase");
  const score: Score | undefined = store.scores.find((s) => s.boughtBy === null);
  if (!score) {
    setAgentAction("executor", "No scored opportunities to act on");
    return;
  }
  if (score.score < config.analystThreshold) {
    score.boughtBy = "executor";
    setAgentAction(
      "executor",
      `Skipped ${score.token}: score ${score.score} below threshold ${config.analystThreshold}`
    );
    return;
  }
  const paid = await pay("executor", "analyst", config.scorePrice, "USDG");
  if (!paid.ok) {
    setAgentAction("executor", `Cannot pay Analyst: ${paid.error}`, "error");
    return;
  }
  score.boughtBy = "executor";
  const signal = store.signals.find((s) => s.id === score.signalId);
  const direction = signal?.direction ?? "buy";
  const buy = direction === "buy";
  const fromToken = buy ? config.baseToken : config.quoteToken;
  const toToken = buy ? config.quoteToken : config.baseToken;
  setAgentAction(
    "executor",
    `Executing ${buy ? "BUY" : "SELL"} ${config.quoteToken} (score ${score.score}/100)`
  );
  try {
    const result = await executeSwap(fromToken, toToken, config.executorSwapAmount);
    const trade = {
      id: nextId("trd"),
      type: (buy ? "BUY" : "SELL") as "BUY" | "SELL",
      token: score.token,
      amountIn: result.amountIn,
      amountOut: result.amountOut,
      price: result.price,
      txHash: result.txHash,
      mode: result.mode,
      createdAt: Date.now(),
    };
    addTrade(trade);
    const executor = store.agents.executor;
    executor.balance[fromToken] = (executor.balance[fromToken] ?? 0) - result.amountIn;
    executor.balance[toToken] = (executor.balance[toToken] ?? 0) + result.amountOut;
    setAgentAction(
      "executor",
      `${trade.type} ${result.amountIn} ${fromToken} -> ${result.amountOut.toFixed(4)} ${toToken}` +
        (result.txHash ? ` tx ${result.txHash.slice(0, 10)}...` : " (simulated)")
    );
  } catch (err) {
    setAgentAction("executor", `Error: ${(err as Error).message}`, "error");
  }
}