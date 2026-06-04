import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchChannels, fetchMessages } from "@/lib/slack";
import type { MessagesPayload } from "@/types";

export const dynamic = "force-dynamic";

// GET: チャンネル一覧取得
export async function GET() {
  try {
    const channels = await fetchChannels();
    return NextResponse.json({ channels });
  } catch (e) {
    const message = e instanceof Error ? e.message : "チャンネル一覧の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const PostBodySchema = z.object({
  channelId: z.string().min(1),
  channelName: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
});

// POST: メッセージ抽出
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "パラメータが不正です" }, { status: 400 });
  }

  const { channelId, channelName, from, to } = parsed.data;
  try {
    const messages = await fetchMessages(channelId, from, to);
    const payload: MessagesPayload = {
      channel: channelName,
      period: { from, to },
      messages,
    };
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "メッセージの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
