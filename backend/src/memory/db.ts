export interface AgentState {
  name: string;
  role: string;
  wallet: string;
  status: "idle" | "working" | "error";
  lastAction: string;
  lastActionAt: number | null;
  balance: Record<string, number>;
}

export interface Signal {
  id: string;
  token: string;
  source: string;
  strength: number;
  price: number;
  direction: "buy" | "sell";
  mode: "real" | "sim";
  createdAt: number;
  boughtBy: string | null;
}

export interface Score {
  id: string;
  signalId: string;
  token: string;
  score: number;
  reasons: string[];
  mode: "real" | "sim";
  createdAt: number;
  boughtBy: string | null;
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

export interface Payment {
  id: string;
  from: string;
  to: string;
  amount: number;
  token: string;
  txHash: string | null;
  mode: "real" | "sim";
  createdAt: number;
}

interface Store {
  agents: Record<string, AgentState>;
  signals: Signal[];
  scores: Score[];
  trades: Trade[];
  payments: Payment[];
  capital: number;
  loopIntervalMinutes: number;
  modeLabel: string;
  loop: {
    running: boolean;
    lastTickAt: number | null;
    nextTickAt: number | null;
    tickCount: number;
  };
}

export const store: Store = {
  agents: {
    scout: {
      name: "Scout",
      role: "Signal detection",
      wallet: "0xScout",
      status: "idle",
      lastAction: "Awaiting first cycle",
      lastActionAt: null,
      balance: { USDG: 0, OKB: 0 },
    },
    analyst: {
      name: "Analyst",
      role: "Risk scoring",
      wallet: "0xAnalyst",
      status: "idle",
      lastAction: "Awaiting first cycle",
      lastActionAt: null,
      balance: { USDG: 0, OKB: 0 },
    },
    executor: {
      name: "Executor",
      role: "Swap execution",
      wallet: "0xExecutor",
      status: "idle",
      lastAction: "Awaiting first cycle",
      lastActionAt: null,
      balance: { USDG: 0, OKB: 0 },
    },
    overseer: {
      name: "Overseer",
      role: "Economy governance",
      wallet: "0xOverseer",
      status: "idle",
      lastAction: "Awaiting first cycle",
      lastActionAt: null,
      balance: { USDG: 0, OKB: 0 },
    },
  },
  signals: [],
  scores: [],
  trades: [],
  payments: [],
  capital: 0,
  loopIntervalMinutes: 30,
  modeLabel: "sim",
  loop: {
    running: false,
    lastTickAt: null,
    nextTickAt: null,
    tickCount: 0,
  },
};

let seq = 0;
export function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export function setAgentAction(name: string, action: string, status: AgentState["status"] = "working") {
  const agent = store.agents[name];
  if (!agent) return;
  agent.lastAction = action;
  agent.lastActionAt = Date.now();
  agent.status = status;
}

export function addSignal(signal: Signal) {
  store.signals.unshift(signal);
  store.signals = store.signals.slice(0, 200);
}

export function addScore(score: Score) {
  store.scores.unshift(score);
  store.scores = store.scores.slice(0, 200);
}

export function addTrade(trade: Trade) {
  store.trades.unshift(trade);
  store.trades = store.trades.slice(0, 200);
}

export function addPayment(payment: Payment) {
  store.payments.unshift(payment);
  store.payments = store.payments.slice(0, 200);
}