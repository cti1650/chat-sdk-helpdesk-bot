import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import { waitUntil } from "@vercel/functions";
import chat from "./bot.js";

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ヘルスチェックエンドポイント
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stateAdapter: process.env.REDIS_URL ? "redis" : "memory"
  });
});

// Webhook エンドポイント
// Slack 署名検証のため生ボディを保持し、Web API Request に変換して渡す
app.post("/webhook", express.raw({ type: "*/*" }), async (req: Request, res: Response) => {
  const host = req.get("host") ?? "localhost";
  const url = `${req.protocol}://${host}${req.originalUrl}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }
  }

  const webRequest = new Request(url, {
    method: req.method,
    headers,
    body: req.body as Buffer,
  });

  const webResponse = await chat.webhooks.slack(webRequest, {
    waitUntil: process.env.VERCEL ? waitUntil : undefined,
  });

  res.status(webResponse.status);
  for (const [key, value] of webResponse.headers.entries()) {
    res.setHeader(key, value);
  }
  res.end(Buffer.from(await webResponse.arrayBuffer()));
});

// Vercel は export default app を検出した場合 app.listen() を無視するため条件分岐不要
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);

  if (!process.env.SLACK_BOT_TOKEN) {
    console.warn("⚠️  SLACK_BOT_TOKEN is not set");
  }
  if (!process.env.SLACK_SIGNING_SECRET) {
    console.warn("⚠️  SLACK_SIGNING_SECRET is not set");
  }
});

export default app;

// エラーハンドリング
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
