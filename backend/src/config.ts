export const config = {
  port: Number(process.env.PORT || 3001),
  mode: process.env.HIVE_MODE || "sim",
  chainId: Number(process.env.XLAYER_CHAIN_ID || 195),
  rpcUrl:
    process.env.XLAYER_RPC_URL ||
    "https://xlayer-testnet.okx.com",
  okxApiBase: "https://www.okx.com",
  okxApiKey: process.env.OKX_API_KEY || "",
  okxSecretKey: process.env.OKX_SECRET_KEY || "",
  okxPassphrase: process.env.OKX_PASSPHRASE || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  llmApiBase: process.env.LLM_API_BASE || "https://api.openai.com/v1",
  llmApiKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
  baseToken: process.env.BASE_TOKEN || "USDG",
  quoteToken: process.env.QUOTE_TOKEN || "OKB",
  instId: process.env.OKX_INST_ID || "OKB-USDT",
  checkIntervalMinutes: Number(process.env.CHECK_INTERVAL_MINUTES || 30),
  executorSwapAmount: Number(process.env.EXECUTOR_SWAP_AMOUNT || 10),
  analystThreshold: Number(process.env.ANALYST_THRESHOLD || 40),
  signalPrice: 0.001,
  scorePrice: 0.002,
  seedCapital: Number(process.env.SEED_CAPITAL || 100),
};

export function isRealMode(): boolean {
  return config.mode === "real" && config.okxApiKey.length > 0;
}