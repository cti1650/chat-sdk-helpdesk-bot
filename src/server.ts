import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { waitUntil } from "@vercel/functions";
import dotenv from "dotenv";
import chat from "./bot.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stateAdapter: process.env.REDIS_URL ? "redis" : "memory",
  })
);

app.post("/webhook", (c) =>
  chat.webhooks.slack(c.req.raw, {
    waitUntil: process.env.VERCEL ? waitUntil : undefined,
  })
);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`🚀 Server running on port ${info.port}`);
  console.log(`📡 Webhook endpoint: http://localhost:${info.port}/webhook`);
  console.log(`💚 Health check: http://localhost:${info.port}/health`);

  if (!process.env.SLACK_BOT_TOKEN) {
    console.warn("⚠️  SLACK_BOT_TOKEN is not set");
  }
  if (!process.env.SLACK_SIGNING_SECRET) {
    console.warn("⚠️  SLACK_SIGNING_SECRET is not set");
  }
});

export default app;

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
