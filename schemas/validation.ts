import { z } from "zod";

// --- 初期設定（期間・チャンネル選択） ---
export const InitialSettingSchema = z
  .object({
    dateFrom: z.string().min(1, "開始日を入力してください"),
    dateTo: z.string().min(1, "終了日を入力してください"),
    channelId: z.string().min(1, "チャンネルを選択してください"),
  })
  .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
    message: "終了日は開始日以降を指定してください",
    path: ["dateTo"],
  });

export type InitialSettingInput = z.infer<typeof InitialSettingSchema>;

// --- 職務経歴書作成フォーム ---
const yearMonthOrder = (ym: { year: string; month: string }): number =>
  Number(ym.year) * 100 + Number(ym.month);

export const ResumeFormSchema = z
  .object({
    periodFrom: z.object({
      year: z.string().min(1, "開始年月を入力してください"),
      month: z.string().min(1, "開始年月を入力してください"),
    }),
    periodTo: z.object({
      year: z.string().min(1, "終了年月を入力してください"),
      month: z.string().min(1, "終了年月を入力してください"),
    }),
    jobTitle: z.string().min(1, "職種を入力してください"),
    role: z.string().min(1, "役割を入力してください"),
    teamSize: z.string().min(1, "チーム規模を入力してください"),
    jobDescription: z.string().min(1, "仕事内容を入力してください"),
    technologies: z.array(z.string()).min(1, "利用技術を1つ以上選択してください"),
  })
  .refine(
    (v) => {
      const { periodFrom: f, periodTo: t } = v;
      if (!f.year || !f.month || !t.year || !t.month) return true;
      return yearMonthOrder(f) <= yearMonthOrder(t);
    },
    {
      message: "終了年月は開始年月以降を指定してください",
      path: ["periodTo"],
    },
  );

export type ResumeFormInput = z.infer<typeof ResumeFormSchema>;
