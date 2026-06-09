import { WebClient } from "@slack/web-api";
import type { SlackChannel, SlackExtractedMessage } from "@/types/slack";
import { dateToUnixRange, formatTs, shiftDate } from "@/utils/date";

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

/** 取得系で共通の前処理: クライアント・userId・期間(文字列/数値)を一括で用意する */
function prepareFetch(from: string, to: string) {
  const { token, userId } = getEnv();
  const { oldest, latest } = dateToUnixRange(from, to);
  return {
    client: new WebClient(token),
    userId,
    oldest,
    latest,
    oldestNum: Number(oldest),
    latestNum: Number(latest),
  };
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

/** rawTs で古い順にソートし、内部用 rawTs を落として返す */
function sortAndStrip(collected: CollectedMessage[]): SlackExtractedMessage[] {
  return collected
    .sort((a, b) => a.rawTs - b.rawTs)
    .map(({ type, text, ts }) => ({ type, text, ts }));
}

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
 *
 * 一次取得は search.messages（高速・スレッドを個別に辿らずレート制限に強い）。
 * search が使えない／0件の場合は history+replies 方式にフォールバックする。
 */
export async function fetchMessages(
  channelId: string,
  from: string,
  to: string,
): Promise<SlackExtractedMessage[]> {
  try {
    const viaSearch = await fetchMessagesBySearch(channelId, from, to);
    // 0件は search のインデックス未反映等の可能性があるため history で確認する
    if (viaSearch.length > 0) return viaSearch;
  } catch (e) {
    // scope不足(search:read)やEnterprise Grid制限などで失敗しうるためフォールバック
    console.warn("search.messages に失敗したため history 方式にフォールバックします:", e);
  }
  return fetchMessagesByHistory(channelId, from, to);
}

/**
 * search.messages を用いて、本人が指定チャンネル・期間に投稿したメッセージ
 * （トップレベル＋スレッド返信）を一括取得する。
 *
 * 注: search はインデックス遅延があり直近の投稿が欠ける場合がある。
 * posted/reply の区別は permalink の thread_ts 有無から推定する。
 */
async function fetchMessagesBySearch(
  channelId: string,
  from: string,
  to: string,
): Promise<SlackExtractedMessage[]> {
  const { client, userId, oldestNum, latestNum } = prepareFetch(from, to);

  // after:/before: は日単位かつ指定日を含まないため、前後1日ずらして期間を包含する
  const after = shiftDate(from, -1);
  const before = shiftDate(to, 1);
  const query = `from:<@${userId}> in:<#${channelId}> after:${after} before:${before}`;

  const collected: CollectedMessage[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await client.search.messages({
      query,
      count: 100,
      page,
      sort: "timestamp",
      sort_dir: "asc",
    });
    totalPages = res.messages?.paging?.pages ?? 1;
    for (const m of res.messages?.matches ?? []) {
      if (m.user && m.user !== userId) continue; // from: で絞れている前提だが念のため
      const text = (m.text ?? "").trim();
      if (!text) continue;
      const rawTs = Number(m.ts);
      if (!Number.isFinite(rawTs)) continue;
      // 日単位検索の境界誤差を、秒単位で厳密に除外する
      if (rawTs < oldestNum || rawTs > latestNum) continue;
      // スレッド返信の permalink には thread_ts= が付く
      const isReply = (m.permalink ?? "").includes("thread_ts=");
      collected.push({
        type: isReply ? "reply" : "posted",
        text,
        ts: formatTs(m.ts ?? "0"),
        rawTs,
      });
    }
    page += 1;
  } while (page <= totalPages);

  return sortAndStrip(collected);
}

/**
 * 【フォールバック】history+replies でメッセージを抽出する。
 * トップレベル投稿に加え、スレッド返信(本人分)も取得する。
 * システムメッセージ(join等)や空メッセージは除外。古い順に並べる。
 *
 * 注: 期間内に本人が返信していても、スレッドの親メッセージが期間より前にある場合は
 * historyに親が現れないため、そのスレッドの返信は取得対象外となる。
 */
async function fetchMessagesByHistory(
  channelId: string,
  from: string,
  to: string,
): Promise<SlackExtractedMessage[]> {
  const { client, userId, oldest, latest, oldestNum, latestNum } = prepareFetch(from, to);

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
      // 返信のあるスレッド親のうち、本人が返信している可能性があるものだけを記録する。
      // 全スレッドにreplies APIを呼ぶとレート制限に当たりやすいため、reply_usersで事前に絞る。
      if (m.thread_ts && m.reply_count && m.reply_count > 0) {
        const repliers = m.reply_users ?? [];
        // reply_usersは最大5件で打ち切られる。打ち切られていなければ判定を信用できる。
        const repliersComplete =
          m.reply_users_count != null && repliers.length >= m.reply_users_count;
        // リストが完全かつ本人が含まれない場合のみスキップ。
        // 不完全（返信者6人以上）なら判定不能なので安全側で取得する。
        if (!repliersComplete || repliers.includes(userId)) {
          threadParents.add(m.thread_ts);
        }
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
  return sortAndStrip(collected);
}
