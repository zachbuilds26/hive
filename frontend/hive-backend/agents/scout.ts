import { getSignals, SignalCandidate } from "../services/okx";
import { store, nextId, addSignal, setAgentAction } from "../memory/db";

export async function scoutRun(): Promise<SignalCandidate | null> {
  setAgentAction("scout", "Scanning the network for signals");
  try {
    const signals = await getSignals();
    if (!signals.length) {
      setAgentAction("scout", "No signals found this cycle");
      return null;
    }
    const best = signals[0];
    const signal = {
      id: nextId("sig"),
      token: best.token,
      source: best.source,
      strength: best.strength,
      price: best.price,
      direction: best.direction,
      mode: best.mode,
      createdAt: Date.now(),
      boughtBy: null,
    };
    addSignal(signal);
    setAgentAction(
      "scout",
      `Found signal on ${signal.token} (strength ${signal.strength}) from ${signal.source}`
    );
    return best;
  } catch (err) {
    setAgentAction("scout", `Error: ${(err as Error).message}`, "error");
    return null;
  }
}