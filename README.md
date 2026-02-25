# Chat SDK ベース Helpdesk Bot

Vercel Chat SDK を使った簡易ヘルプデスクBot
Slack / Teams などマルチプラットフォーム対応

## 🧠 概要

本Botは **Vercel Chat SDK** を使って構築する簡易ヘルプデスクBotで、
複数プラットフォームへのイベントハンドリング・UI表現を統一的に扱えます。

### 主な機能

- ✅ `help` コマンドでカテゴリ選択カードを表示
- ✅ ボタン押下でモーダルフォームを開く
- ✅ フォーム送信後にスレッドへ受付完了メッセージを投稿
- ✅ Redis / Memory State Adapter の自動切替

## 📁 プロジェクト構造

```
chat-sdk-helpdesk-bot/
├── .env.example          # 環境変数サンプル
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── bot.ts            # Bot ロジック
    ├── server.ts         # Express サーバー
    └── state.ts          # State Adapter 初期化
```

## ⚙️ 前提条件

- **Node.js**: 24 以上
- **TypeScript**: 5.x 以上
- **Redis**: 本番環境で使用する場合（開発時は不要）

## 🚀 セットアップ（30分以内）

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd chat-sdk-helpdesk-bot
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.example` をコピーして `.env` を作成

```bash
cp .env.example .env
```

`.env` ファイルを編集

```env
# Slack Bot API Keys
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# Redis (Optional - 未設定の場合 Memory State Adapter を使用)
# REDIS_URL=redis://username:password@host:port

# Server
PORT=3000
```

### 4. Slack App の作成と設定

#### 4.1. Slack App を作成

1. [Slack API Console](https://api.slack.com/apps) にアクセス
2. **Create New App** → **From scratch**
3. App Name と Workspace を選択

#### 4.2. Bot Token Scopes を追加

**OAuth & Permissions** → **Bot Token Scopes** で以下を追加

- `chat:write`
- `chat:write.public`
- `commands`
- `im:history`
- `channels:history`

#### 4.3. Install App to Workspace

**Install App** からワークスペースにインストール

#### 4.4. Bot Token と Signing Secret をコピー

- **OAuth & Permissions** → **Bot User OAuth Token** をコピー → `SLACK_BOT_TOKEN`
- **Basic Information** → **Signing Secret** をコピー → `SLACK_SIGNING_SECRET`

#### 4.5. Event Subscriptions を設定

**Event Subscriptions** を有効化し、Request URL を設定

```
https://your-domain.com/webhook
```

**Subscribe to bot events** で以下を追加

- `message.channels`
- `message.im`

### 5. 開発サーバーを起動

```bash
npm run dev
```

起動確認

```
🚀 Server running on port 3000
📡 Webhook endpoint: http://localhost:3000/webhook
💚 Health check: http://localhost:3000/health
✅ Using Memory State Adapter (development only)
```

### 6. ngrok でローカルサーバーを公開（開発時）

別ターミナルで ngrok を起動

```bash
ngrok http 3000
```

表示された URL（例: `https://xxxx.ngrok.io`）を Slack の Request URL に設定

```
https://xxxx.ngrok.io/webhook
```

## 🎯 使い方

### 1. Slack で Bot を招待

チャンネルまたはDMで Bot を招待

```
/invite @YourBotName
```

### 2. help コマンドを実行

```
help
```

### 3. カテゴリを選択

表示されたカードのボタン（🐛 バグ報告 / ✨ 機能要望）を押下

### 4. モーダルフォームを入力

- 件名
- 詳細
- 優先度

### 5. 受付完了メッセージを確認

スレッドに受付番号と内容が投稿される

## 🔄 State Adapter の切り替え

### Memory State Adapter（開発用）

`REDIS_URL` を設定しない場合に自動的に使用

- ✅ セットアップ不要
- ❌ 単一プロセスのみ
- ❌ 再起動でデータ消失

### Redis State Adapter（本番用）

`REDIS_URL` を設定すると自動的に使用

- ✅ 永続化
- ✅ 複数インスタンス対応
- ✅ 分散ロック

**設定例**

```env
REDIS_URL=redis://username:password@host:6379
```

## 📦 ビルドとデプロイ

### ビルド

```bash
npm run build
```

### 本番起動

```bash
npm start
```

### Vercel にデプロイ

```bash
vercel
```

### Cloudflare Workers / AWS Lambda

Serverless 環境でも動作可能（設定は別途必要）

## 🧪 型チェック

```bash
npm run type-check
```

## 🔒 セキュリティ

- **Bot Token と Signing Secret は必ず環境変数で管理**
- `.env` ファイルは `.gitignore` に追加済み
- 本番環境では HTTPS を使用

## 🛠 拡張アイデア

- [ ] Redis でチケット情報を永続化
- [ ] GitHub / Linear 連携で Issue 化
- [ ] LLM 自動要約機能の導入
- [ ] スレッド購読で追加質問対応

## 📌 トラブルシューティング

### Bot が反応しない

1. **Bot Token が正しいか確認**
2. **Event Subscriptions の Request URL が正しいか確認**
3. **ngrok が起動しているか確認**（開発時）
4. **Bot がチャンネルに招待されているか確認**

### Memory State Adapter の警告

開発環境では問題ありません。本番環境では Redis を設定してください。

### Webhook エラー

- Slack の **Event Subscriptions** → **Request URL** が Verified になっているか確認
- サーバーログでエラーを確認

## 📚 参考リンク

- [Vercel Chat SDK](https://vercel.com/blog/introducing-chat-sdk)
- [Slack API Documentation](https://api.slack.com/)
- [Redis Documentation](https://redis.io/docs/)

## 📄 ライセンス

ISC

---

**開発時間**: 初回セットアップ約30分
**メンテナンス性**: ⭐⭐⭐⭐⭐ 高（TypeScript + 明確な構造）
**学習コスト**: ⭐⭐⭐ 中（Chat SDK の理解が必要）
