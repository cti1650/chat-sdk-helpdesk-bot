import { createRedisState } from "@chat-adapter/state-redis";
import { createMemoryState } from "@chat-adapter/state-memory";

/**
 * State Adapterを初期化
 *
 * REDIS_URL が設定されている場合は Redis State Adapter を使用し、
 * 未設定の場合は Memory State Adapter を使用する。
 *
 * Memory State Adapter は開発環境向けで、単一プロセスでのみ有効。
 * Redis State Adapter は本番環境向けで、永続化と複数インスタンス対応。
 */
export function initializeState() {
  if (process.env.REDIS_URL) {
    console.log("✅ Using Redis State Adapter");
    return createRedisState({ url: process.env.REDIS_URL });
  }

  console.log("⚠️  Using Memory State Adapter (development only)");
  return createMemoryState();
}
