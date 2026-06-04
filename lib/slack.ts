import { WebClient } from "@slack/web-api";
import type { ExtractedMessage, SlackChannel } from "@/types";

function getEnv(): { token: string; userId: string } {
  const token = process.env.SLACK_USER_TOKEN;
  const userId = process.env.SLACK_USER_ID;
  if (!token) {
    throw new Error("環境変数 SLACK_USER_TOKEN が設定されていません");
  }
  if (!userId) {
    throw new Error("環境変数 SLACK_USER_ID が設定されていません");
  }
  return { token, userId };
}

function getClient(): WebClient {
  const { token } = getEnv();
  return new WebClient(token);
}

/**
 * チャンネル一覧を取得する（public + private、アーカイブ除外）。
 * 名前順にソートして返す。
 */
export async function fetchChannels(): Promise<SlackChannel[]> {
  const client = getClient();
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const res = await client.conversations.list({
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });
    for (const ch of res.channels ?? []) {
      // 参加済みチャンネルのみ（user tokenではhistoryを参加済みしか読めないため）。
      // privateチャンネルは一覧に出る時点で参加済み。
      const joined = ch.is_member === true || ch.is_private === true;
      if (ch.id && ch.name && joined) {
        channels.push({ id: ch.id, name: ch.name });
      }
    }
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return channels.sort((a, b) => a.name.localeCompare(b.name));
}

/** "YYYY-MM-DD" → その日の 00:00:00 / 23:59:59 (JST) のUNIX秒 */
function dateToUnixRange(from: string, to: string): { oldest: string; latest: string } {
  // JST(+09:00)固定で日付境界を解釈する
  const oldest = Math.floor(new Date(`${from}T00:00:00+09:00`).getTime() / 1000);
  const latest = Math.floor(new Date(`${to}T23:59:59+09:00`).getTime() / 1000);
  return { oldest: String(oldest), latest: String(latest) };
}

/** Slackのts(エポック秒.マイクロ秒) を "YYYY-MM-DD HH:mm" (JST) に整形 */
function formatTs(ts: string): string {
  const epochMs = Math.floor(Number(ts) * 1000);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(epochMs));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/**
 * 指定チャンネル・期間内の、本人(SLACK_USER_ID)が投稿したメッセージを抽出する。
 * システムメッセージ(join等)や空メッセージは除外。古い順に並べる。
 */
export async function fetchMessages(
  channelId: string,
  from: string,
  to: string,
): Promise<ExtractedMessage[]> {
  const { userId } = getEnv();
  const client = getClient();
  const { oldest, latest } = dateToUnixRange(from, to);

  const collected: ExtractedMessage[] = [];
  let cursor: string | undefined;

  do {
    let res;
    try {
      res = await client.conversations.history({
        channel: channelId,
        oldest,
        latest,
        inclusive: true,
        limit: 200,
        cursor,
      });
    } catch (e) {
      const code =
        typeof e === "object" && e !== null && "data" in e
          ? (e as { data?: { error?: string } }).data?.error
          : undefined;
      if (code === "not_in_channel") {
        throw new Error(
          "選択したチャンネルに参加していません。Slackでチャンネルに参加してから再度お試しください。",
        );
      }
      throw e;
    }

    for (const m of res.messages ?? []) {
      if (m.user !== userId) continue;
      if (m.subtype) continue; // join/leave等のシステムメッセージを除外
      const text = (m.text ?? "").trim();
      if (!text) continue;
      const isReply = Boolean(m.thread_ts && m.thread_ts !== m.ts);
      collected.push({
        type: isReply ? "reply" : "posted",
        text,
        ts: formatTs(m.ts ?? "0"),
      });
    }
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  // historyは新しい順で返るため、古い順に並べ替える
  return collected.reverse();
}
