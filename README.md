# Chat SDK ベース Helpdesk Bot

Vercel Chat SDK を使った簡易ヘルプデスクBot
Slack / Teams などマルチプラットフォーム対応

## 🧠 概要

本Botは **Vercel Chat SDK** を使って構築する簡易ヘルプデスクBotで、
複数プラットフォームへのイベントハンドリング・UI表現を統一的に扱えます。

### 主な機能

- ✅ `/help` スラッシュコマンドまたは `@helpdeskbot help` メンションでカテゴリ選択カードを表示
- ✅ ボタン押下でモーダルフォームを開く
- ✅ フォーム送信後にスレッドへ受付完了メッセージを投稿
- ✅ フォーム送信後にボタンカードを自動削除
- ✅ Redis / Memory State Adapter の自動切替
- ✅ Vercel `waitUntil` による Slack `expired_trigger_id` 対策済み

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

#### 4.1. Slack App を作成（manifest から）

1. [Slack API Console](https://api.slack.com/apps) にアクセス
2. **Create New App** → **From an app manifest** を選択
3. ワークスペースを選択
4. 以下の YAML を貼り付けて **「Create」**

```yaml
_metadata:
  major_version: 1
  minor_version: 1

display_information:
  name: "Helpdesk Bot"
  description: "Slack上でヘルプデスク対応を自動化するBot。バグ報告・機能要望をフォームで受け付けます。"

features:
  bot_user:
    display_name: "helpdeskbot"
    always_online: false
  slash_commands:
    - command: "/help"
      description: "ヘルプデスクのお問い合わせフォームを表示"
      usage_hint: ""
      should_escape: false

oauth_config:
  scopes:
    bot:
      - app_mentions:read  # @helpdeskbot help のメンション受信
      - chat:write         # Botが参加済みチャンネルへの投稿
      - chat:write.public  # Botが未参加のパブリックチャンネルへの投稿
      - commands           # スラッシュコマンド（/help）の使用
      - channels:history   # パブリックチャンネルのメッセージ履歴読み取り
      - im:history         # DM（ダイレクトメッセージ）の履歴読み取り

settings:
  socket_mode_enabled: false
  org_deploy_enabled: false
  token_rotation_enabled: false
  event_subscriptions:
    request_url: "https://your-domain.com/webhook"
    bot_events:
      - app_mention      # @helpdeskbot が含むメッセージを受信
      - message.channels # パブリックチャンネルのメッセージ受信
      - message.im       # DM のメッセージ受信
  interactivity:
    is_enabled: true
    request_url: "https://your-domain.com/webhook"
```

> `your-domain.com` はデプロイ後の実際のドメインに置き換えてください

#### 4.2. Install App to Workspace

**Install App** からワークスペースにインストール

#### 4.3. Bot Token と Signing Secret をコピー

- **OAuth & Permissions** → **Bot User OAuth Token** をコピー → `SLACK_BOT_TOKEN`
- **Basic Information** → **Signing Secret** をコピー → `SLACK_SIGNING_SECRET`

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

### 2. help を呼び出す

スラッシュコマンドまたはメンションで呼び出し

```
/help
```

```
@helpdeskbot help
```

### 3. カテゴリを選択

表示されたカードのボタン（🐛 バグ報告 / ✨ 機能要望）を押下

### 4. モーダルフォームを入力

- 件名
- 詳細
- 優先度

### 5. 受付完了メッセージを確認

スレッドに受付番号と内容が投稿され、ボタンカードが自動削除される

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

Vercel 環境では `@vercel/functions` の `waitUntil` が自動的に有効になり、
Slack の 3 秒以内レスポンス要件（`expired_trigger_id` 問題）に対応します。

## 🧪 型チェック

```bash
npm run type-check
```

## 📌 トラブルシューティング

### Bot が反応しない

1. **Bot Token が正しいか確認**
2. **Event Subscriptions の Request URL が正しいか確認**
3. **ngrok が起動しているか確認**（開発時）
4. **Bot がチャンネルに招待されているか確認**

### Webhook エラー

- Slack の **Event Subscriptions** → **Request URL** が Verified になっているか確認
- サーバーログでエラーを確認

## 📚 参考リンク

- [Chat SDK ドキュメント](https://www.chat-sdk.dev/docs)
- [Slack API Documentation](https://api.slack.com/)
- [Redis Documentation](https://redis.io/docs/)

## 📄 ライセンス

ISC
