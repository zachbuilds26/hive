import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config";
import { store } from "./memory/db";
import { hive } from "./routes/hive";
import { seedCrew } from "./services/payments";

store.loopIntervalMinutes = config.checkIntervalMinutes;
store.modeLabel = config.mode;
seedCrew();

const app = new Hono();
app.use("/hive/*", cors());
app.route("/hive", hive);

app.get("/", (c) =>
  c.json({ name: "HIVE backend", mode: config.mode, chainId: config.chainId })
);

async function runCycleSafe() {
  try {
    const { runCycle } = await import("./routes/hive");
    await runCycle();
  } catch (err) {
    console.error("cycle failed:", (err as Error).message);
  }
}

const timer = setInterval(() => {
  if (store.loop.running) {
    runCycleSafe();
  }
}, config.checkIntervalMinutes * 60_000);

if (process.env.AUTO_START === "true") {
  store.loop.running = true;
}

export { timer };

console.log(`HIVE backend on :${config.port} (mode: ${config.mode}, chain: ${config.chainId})`);
export default { port: config.port, fetch: app.fetch };