import { WebClient } from "@slack/web-api";
import type { SlackChannel, SlackExtractedMessage } from "@/types/slack";
import { dateToUnixRange, formatTs } from "@/utils/date";

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

// 並べ替え用に元のts(数値)を保持した抽出メッセージ
type CollectedMessage = SlackExtractedMessage & { rawTs: number };

/** SlackメッセージがSLACK_USER_IDの有効な発言かを判定し、textを返す（除外時はnull） */
function pickOwnText(
  m: { user?: string; subtype?: string; text?: string },
  userId: string,
): string | null {
  if (m.user !== userId) return null;
  if (m.subtype) return null; // join/leave等のシステムメッセージを除外
  const text = (m.text ?? "").trim();
  return text || null;
}

/**
 * 指定チャンネル・期間内の、本人(SLACK_USER_ID)が投稿したメッセージを抽出する。
 * トップレベル投稿に加え、スレッド返信(本人分)も取得する。
 * システムメッセージ(join等)や空メッセージは除外。古い順に並べる。
 *
 * 注: 期間内に本人が返信していても、スレッドの親メッセージが期間より前にある場合は
 * historyに親が現れないため、そのスレッドの返信は取得対象外となる。
 */
export async function fetchMessages(
  channelId: string,
  from: string,
  to: string,
): Promise<SlackExtractedMessage[]> {
  const { userId } = getEnv();
  const client = getClient();
  const { oldest, latest } = dateToUnixRange(from, to);
  const oldestNum = Number(oldest);
  const latestNum = Number(latest);

  const collected: CollectedMessage[] = [];
  // 返信を後で取得するスレッド親のts（投稿者を問わず収集）
  const threadParents = new Set<string>();
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
      // 返信が存在するスレッド親を記録（本人が返信している可能性があるため投稿者不問）
      if (m.thread_ts && m.reply_count && m.reply_count > 0) {
        threadParents.add(m.thread_ts);
      }
      const text = pickOwnText(m, userId);
      if (!text) continue;
      // historyが返すのはトップレベル/スレッド親なので "posted"
      collected.push({ type: "posted", text, ts: formatTs(m.ts ?? "0"), rawTs: Number(m.ts) });
    }
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  // 各スレッドの返信を取得し、本人の返信(期間内)を抽出する
  for (const threadTs of threadParents) {
    let rCursor: string | undefined;
    do {
      const rres = await client.conversations.replies({
        channel: channelId,
        ts: threadTs,
        oldest,
        latest,
        inclusive: true,
        limit: 200,
        cursor: rCursor,
      });
      for (const m of rres.messages ?? []) {
        if (m.ts === threadTs) continue; // 親はhistory側で処理済み
        const rawTs = Number(m.ts);
        if (rawTs < oldestNum || rawTs > latestNum) continue; // 念のため期間外を除外
        const text = pickOwnText(m, userId);
        if (!text) continue;
        collected.push({ type: "reply", text, ts: formatTs(m.ts ?? "0"), rawTs });
      }
      rCursor = rres.response_metadata?.next_cursor || undefined;
    } while (rCursor);
  }

  // history/repliesを混在させたため、元のtsで古い順に並べ替える
  return collected
    .sort((a, b) => a.rawTs - b.rawTs)
    .map(({ rawTs: _rawTs, ...rest }) => rest);
}
