import express from "express";
import dotenv from "dotenv";
import chat from "./bot";

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parser
app.use(express.json());

// ヘルスチェックエンドポイント
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stateAdapter: process.env.REDIS_URL ? "redis" : "memory"
  });
});

// Webhook エンドポイント
// Chat SDK の router() メソッドを使用してイベントハンドリング
app.post("/webhook", chat.router());

// ローカル開発時のみサーバー起動（Vercel はエクスポートされたアプリを使用）
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);

    // 設定状況を表示
    if (!process.env.SLACK_BOT_TOKEN) {
      console.warn("⚠️  SLACK_BOT_TOKEN is not set");
    }
    if (!process.env.SLACK_SIGNING_SECRET) {
      console.warn("⚠️  SLACK_SIGNING_SECRET is not set");
    }
  });
}

export default app;

// エラーハンドリング
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
