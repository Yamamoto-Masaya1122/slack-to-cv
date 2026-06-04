// Slackチャンネル
export interface SlackChannel {
  id: string;
  name: string;
}

// 抽出メッセージ1件
export interface ExtractedMessage {
  type: "posted" | "reply";
  text: string;
  ts: string; // "2024-03-01 10:00"
}

// メッセージ抽出APIのレスポンス（= {channel_name}_messages.json の中身）
export interface MessagesPayload {
  channel: string;
  period: {
    from: string; // "2024-01-01"
    to: string; // "2024-12-31"
  };
  messages: ExtractedMessage[];
}

// Step1（初期設定）フォーム値
export interface Step1Values {
  dateFrom: string;
  dateTo: string;
  channelId: string;
}

// Step2（職務経歴書作成）フォーム値
export interface ChannelFormValues {
  periodFrom: { year: string; month: string };
  periodTo: { year: string; month: string };
  jobTitle: string;
  role: string;
  teamSize: string;
  jobDescription: string;
  technologies: string[];
}

// API共通エラー形
export interface ApiError {
  error: string;
}
