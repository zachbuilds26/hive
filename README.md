# HIVE

Four AI traders. One crew. No humans.

HIVE is an autonomous AI trading economy on X Layer. Four specialized agents
— Scout, Analyst, Executor, Overseer — each with their own wallet, find,
verify, and execute trades with no human in the loop. The crew pays itself:
intelligence is bought and sold between agents via micro-payments, so bad
intel earns nothing.

## The crew

| Agent     | Role                | Job                                                            |
| --------- | ------------------- | -------------------------------------------------------------- |
| Scout     | Signal detection    | Finds volume spikes / smart-money moves, sells tips            |
| Analyst   | Risk scoring        | Pays Scout, checks scam patterns, scores 0–100 (LLM or rules)  |
| Executor  | Swap execution      | Pays Analyst, builds the swap, signs with its wallet           |
| Overseer  | Economy governance  | Tracks earn/spend, compounds surplus back into capital         |

## Architecture

```
frontend/   Next.js — landing page + live dashboard (polls the API)
backend/    Bun + Hono — agent loop, OKX services, x402 payments, API
```

Every 30 minutes (or on demand via POST /hive/tick) one cycle runs:
Scout finds a signal → Analyst buys and scores it → Executor buys the
verdict and trades → Overseer reviews and compounds.

## Run it

Backend (default port 3001):

```bash
cd backend
cp .env.example .env   # fill in keys for real mode; sim mode works empty
bun install
bun run src/index.ts
```

Frontend (default port 3000):

```bash
cd frontend
bun install
bun run dev
```

Open http://localhost:3000 — landing page, and /dashboard for the live crew.

## Modes

- **sim** (default): runs fully offline with simulated prices and swaps.
  Everything is real code and real cycle logic, clearly labelled "sim".
- **real**: set HIVE_MODE=real and add OKX API credentials — the crew
  fetches live signals, scores with the LLM, and broadcasts real swaps on
  X Layer (mainnet 196, or testnet 195 for safe demos).

## API

| Route               | Method | Description                          |
| ------------------- | ------ | ------------------------------------ |
| /hive/status        | GET    | Agent states + loop info             |
| /hive/summary       | GET    | Capital, trades, realized P&L        |
| /hive/balances      | GET    | Per-agent balances                   |
| /hive/trades        | GET    | Recent trades                        |
| /hive/signals       | GET    | Recent signals                       |
| /hive/scores        | GET    | Recent analyst scores                |
| /hive/payments      | GET    | Inter-agent payment ledger           |
| /hive/tick          | POST   | Run one cycle (demo-friendly)        |
| /hive/start · stop  | POST   | Start / stop the automatic loop      |
| /hive/deposit       | POST   | Fund the crew                        |

## Credits

Concept inspiration: LiquidMesh (MIT). Building blocks: OKX OnchainOS, x402,
X Layer, Uniswap, OpenAI. See CREDITS.md.