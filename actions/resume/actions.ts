"use server";

import { ResumeFormSchema } from "@/schemas/validation";
import { saveResumeFiles } from "@/services/resumeDownloadService";
import type { ChannelFormValues } from "@/types/resume";
import type { SlackMessagesPayload } from "@/types/slack";

export type SaveResumeActionResult =
  | { ok: true; sequence: string; dir: string }
  | { ok: false; error: string };

/**
 * 入力フォームとメッセージを storage/<YYYYMMDDHHMMSS>/ に保存する Server Action。
 * 実際の保存処理は services/resumeStorageService に委譲する。
 */
export async function saveResumeAction(
  payload: SlackMessagesPayload,
  form: ChannelFormValues,
): Promise<SaveResumeActionResult> {
  const parsed = ResumeFormSchema.safeParse(form);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に不備があります。フォームをご確認ください。" };
  }

  try {
    const { sequence, dir } = await saveResumeFiles(payload, form);
    return { ok: true, sequence, dir };
  } catch (e) {
    const message = e instanceof Error ? e.message : "ファイルの保存に失敗しました";
    return { ok: false, error: message };
  }
}
