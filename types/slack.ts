// Slackチャンネル
export type SlackChannel = {
    id: string;
    name: string;
};

// 抽出メッセージ1件
export type SlackExtractedMessage = {
    type: "posted" | "reply";
    text: string;
    ts: string; // "2024-03-01 10:00"
};

// メッセージ抽出APIのレスポンス（= {channel_name}_messages.json の中身）
export type SlackMessagesPayload = {
    channel: string;
    period: {
      from: string; // "2024-01-01"
      to: string; // "2024-12-31"
    };
    messages: SlackExtractedMessage[];
};
