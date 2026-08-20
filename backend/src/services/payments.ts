import { store, nextId, addPayment, AgentState } from "../memory/db";
import { config, isRealMode } from "../config";

export interface PaymentResult {
  ok: boolean;
  payment?: ReturnType<typeof store.payments[0]>;
  error?: string;
}

export async function pay(
  from: string,
  to: string,
  amount: number,
  token: string
): Promise<PaymentResult> {
  const fromAgent = store.agents[from];
  const toAgent = store.agents[to];
  if (!fromAgent || !toAgent) {
    return { ok: false, error: "unknown agent" };
  }
  const balance = fromAgent.balance[token] ?? 0;
  if (balance < amount) {
    return { ok: false, error: `insufficient ${token} (${balance} < ${amount})` };
  }
  fromAgent.balance[token] = balance - amount;
  toAgent.balance[token] = (toAgent.balance[token] ?? 0) + amount;
  const payment = {
    id: nextId("pay"),
    from: fromAgent.name,
    to: toAgent.name,
    amount,
    token,
    txHash: isRealMode() ? null : null,
    mode: (isRealMode() ? "real" : "sim") as "real" | "sim",
    createdAt: Date.now(),
  };
  addPayment(payment);
  return { ok: true, payment };
}

export function credit(name: string, token: string, amount: number) {
  const agent = store.agents[name];
  if (!agent) return;
  agent.balance[token] = (agent.balance[token] ?? 0) + amount;
}

export function seedCrew() {
  const split = config.seedCapital / 4;
  for (const key of Object.keys(store.agents)) {
    credit(key, "USDG", split);
  }
  store.capital = config.seedCapital;
  const overseer = store.agents.overseer as AgentState;
  overseer.lastAction = `Crew funded with ${config.seedCapital} USDG (${config.mode} mode)`;
  overseer.lastActionAt = Date.now();
}