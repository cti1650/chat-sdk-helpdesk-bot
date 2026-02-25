import {
  Chat,
  Card,
  Actions,
  Button,
  Modal,
  TextInput,
  Select,
  SelectOption,
  root,
  paragraph,
  strong,
  text,
} from "chat";
import { initializeState } from "./state";

const state = initializeState();
const chat = new Chat({ state });

/**
 * 1️⃣ help トリガー
 * ユーザーが "help" と投稿すると、カテゴリ選択カードを表示
 */
chat.on("message.create", async ({ message, thread }) => {
  if (message.text?.toLowerCase() === "help") {
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
chat.on("action", async ({ event }) => {
  const category = event.action.id;

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
          required: true
        }),
        TextInput({
          id: "description",
          label: "詳細",
          multiline: true,
          required: true
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
chat.on("modal.submit", async ({ event, thread }) => {
  const { title, description, priority } = event.values;

  // チケットIDを生成
  const ticketId = `HD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  // カテゴリを取得（callbackIdから）
  const category = event.callbackId.includes("bug") ? "バグ報告" : "機能要望";

  await thread.post(
    root([
      paragraph([strong([text("受付完了 ✅")])]),
      paragraph([text(`受付番号: ${ticketId}`)]),
      paragraph([text(`カテゴリ: ${category}`)]),
      paragraph([text(`件名: ${title}`)]),
      paragraph([text(`優先度: ${priority}`)]),
      paragraph([text("---")]),
      paragraph([text(description)]),
    ])
  );

  // ログ出力（実際の運用ではDBに保存など）
  console.log(`📝 New ticket created: ${ticketId}`, {
    category,
    title,
    priority,
    description,
  });
});

export default chat;
