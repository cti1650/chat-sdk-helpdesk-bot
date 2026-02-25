import {
  Chat,
  Card,
  Actions,
  Button,
  Modal,
  TextInput,
  Select,
  SelectOption,
  ConsoleLogger,
  type ModalResponse,
} from "chat";
import { SlackAdapter } from "@chat-adapter/slack";
import { initializeState } from "./state.js";

const logger = new ConsoleLogger();
const state = initializeState();

const chat = new Chat({
  adapters: {
    slack: new SlackAdapter({
      botToken: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      logger,
    }),
  },
  state,
  userName: "helpdeskbot",
  logger,
});

const helpCard = Card({
  title: "お問い合わせカテゴリを選択してください",
  children: [
    Actions([
      Button({ id: "bug", label: "🐛 バグ報告", style: "primary" }),
      Button({ id: "feature", label: "✨ 機能要望" }),
    ]),
  ],
});

/**
 * 1️⃣ help メンション
 * ユーザーが @helpdeskbot help と投稿すると、カテゴリ選択カードを表示
 */
chat.onNewMention(async (thread, message) => {
  if (message.text?.toLowerCase().includes("help")) {
    await thread.post(helpCard);
  }
});

/**
 * 1️⃣' /help スラッシュコマンド
 * ユーザーが /help と入力すると、カテゴリ選択カードを表示
 */
chat.onSlashCommand("/help", async (event) => {
  await event.channel.post(helpCard);
});

/**
 * 2️⃣ カテゴリボタン押下
 * ボタンが押されたらモーダルフォームを開く
 */
chat.onAction(["bug", "feature"], async (event) => {
  console.log(`🔘 Action received: ${event.actionId}`);
  const category = event.actionId;
  const title = category === "bug" ? "バグ報告フォーム" : "機能要望フォーム";

  // threadId が未定義 or messageId で終わる = チャンネルルートのカード（スラッシュコマンド）
  // threadId は "slack:C123:1234567890.123456" 形式、messageId は "1234567890.123456" 形式のため endsWith で比較
  const isInThread = !!event.threadId && !event.threadId.endsWith(event.messageId);

  // チャンネルルート用に threadId から "slack:C123ABC" 形式のチャンネルIDを抽出
  const [adapter, channelPart] = event.threadId?.split(":") ?? [];
  const channelId = adapter && channelPart ? `${adapter}:${channelPart}` : undefined;

  await event.openModal(
    Modal({
      callbackId: `helpdesk_submit_${category}`,
      title,
      submitLabel: "送信",
      privateMetadata: JSON.stringify({ isInThread, channelId }),
      children: [
        TextInput({
          id: "title",
          label: "件名",
        }),
        TextInput({
          id: "description",
          label: "詳細",
          multiline: true,
          optional: true,
        }),
        Select({
          id: "priority",
          label: "優先度",
          options: [
            SelectOption({ label: "低", value: "low" }),
            SelectOption({ label: "中", value: "medium" }),
            SelectOption({ label: "高", value: "high" }),
          ],
        }),
      ],
    })
  );
});

/**
 * 3️⃣ モーダル送信
 * フォーム送信後、受付完了メッセージを投稿しボタンカードを削除
 * - スレッド内（メンション起因）: スレッドへの返信として投稿
 * - チャンネルルート（スラッシュコマンド起因）: チャンネルへ独立メッセージとして投稿
 */
chat.onModalSubmit(["helpdesk_submit_bug", "helpdesk_submit_feature"], async (event): Promise<ModalResponse | undefined> => {
  const { title, description, priority } = event.values;

  // チケットIDを生成
  const ticketId = `HD-${Date.now().toString(36).slice(-6).toUpperCase()}`;

  // カテゴリを取得（callbackIdから）
  const category = event.callbackId.includes("bug") ? "バグ報告" : "機能要望";

  // onAction で設定した privateMetadata からスレッド内かどうか・チャンネルIDを取得
  const { isInThread, channelId } = JSON.parse(event.privateMetadata || "{}") as { isInThread?: boolean; channelId?: string };

  const completionMessage = {
    markdown: [
      `**受付完了 ✅**`,
      `受付番号: ${ticketId}`,
      `カテゴリ: ${category}`,
      `件名: ${title}`,
      `優先度: ${priority}`,
      ...(description ? [`---`, description] : []),
    ].join("\n"),
  };

  if (isInThread) {
    // メンション起因: スレッド返信として投稿
    await event.relatedThread?.post(completionMessage);
  } else if (channelId) {
    // スラッシュコマンド起因: onAction で取得したチャンネルIDへ独立メッセージとして投稿
    await chat.channel(channelId).post(completionMessage);
  }

  // フォーム送信後にボタンカードを削除
  await event.relatedMessage?.delete();

  // ログ出力（実際の運用ではDBに保存など）
  console.log(`📝 New ticket created: ${ticketId}`, {
    category,
    title,
    priority,
    description,
  });

  return undefined;
});

export default chat;
