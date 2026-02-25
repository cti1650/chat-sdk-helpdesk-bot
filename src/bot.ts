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

/**
 * 1️⃣ help メンション
 * ユーザーが @helpdeskbot help と投稿すると、カテゴリ選択カードを表示
 */
chat.onNewMention(async (thread, message) => {
  if (message.text?.toLowerCase().includes("help")) {
    await thread.post(
      Card({
        title: "お問い合わせカテゴリを選択してください",
        children: [
          Actions([
            Button({
              id: "bug",
              label: "🐛 バグ報告",
              style: "primary"
            }),
            Button({
              id: "feature",
              label: "✨ 機能要望"
            }),
          ]),
        ],
      })
    );
  }
});

/**
 * 2️⃣ カテゴリボタン押下
 * ボタンが押されたらモーダルフォームを開く
 */
chat.onAction(["bug", "feature"], async (event) => {
  console.log(`🔘 Action received: ${event.actionId}`);
  const category = event.actionId;
  const title = category === "bug" ? "バグ報告フォーム" : "機能要望フォーム";

  await event.openModal(
    Modal({
      callbackId: `helpdesk_submit_${category}`,
      title,
      submitLabel: "送信",
      children: [
        TextInput({
          id: "title",
          label: "件名",
        }),
        TextInput({
          id: "description",
          label: "詳細",
          multiline: true,
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
 * フォーム送信後、受付完了メッセージをスレッドに投稿
 */
chat.onModalSubmit(["helpdesk_submit_bug", "helpdesk_submit_feature"], async (event): Promise<ModalResponse | undefined> => {
  const { title, description, priority } = event.values;

  // チケットIDを生成
  const ticketId = `HD-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

  // カテゴリを取得（callbackIdから）
  const category = event.callbackId.includes("bug") ? "バグ報告" : "機能要望";

  await event.relatedThread?.post({
    markdown: [
      `**受付完了 ✅**`,
      `受付番号: ${ticketId}`,
      `カテゴリ: ${category}`,
      `件名: ${title}`,
      `優先度: ${priority}`,
      `---`,
      description,
    ].join("\n"),
  });

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
