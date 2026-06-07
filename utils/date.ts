/** "YYYY-MM-DD" → その日の 00:00:00 / 23:59:59 (JST) のUNIX秒 */
export function dateToUnixRange(from: string, to: string): { oldest: string; latest: string } {
  // JST(+09:00)固定で日付境界を解釈する
  const oldest = Math.floor(new Date(`${from}T00:00:00+09:00`).getTime() / 1000);
  const latest = Math.floor(new Date(`${to}T23:59:59+09:00`).getTime() / 1000);
  return { oldest: String(oldest), latest: String(latest) };
}

/** Slackのts(エポック秒.マイクロ秒) を "YYYY-MM-DD HH:mm" (JST) に整形 */
export function formatTs(ts: string): string {
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
