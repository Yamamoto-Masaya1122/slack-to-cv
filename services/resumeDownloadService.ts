import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ChannelFormValues } from "@/types/resume";
import type { SlackMessagesPayload } from "@/types/slack";

/** ダウンロードファイルの保存ルート（プロジェクト直下 storage/） */
const STORAGE_ROOT = path.join(process.cwd(), "storage");

/** YYYYMMDDHHMMSS 形式のシーケンスを生成（ローカルタイム） */
export function buildSequence(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}` +
    `${pad(date.getHours())}` +
    `${pad(date.getMinutes())}` +
    `${pad(date.getSeconds())}`
  );
}

/** ファイル名に使えない文字を除去（パストラバーサル対策含む） */
function sanitizeChannelName(channel: string): string {
  return channel.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "channel";
}

/** resume_draft.md の本文を生成 */
export function buildResumeDraft(channel: string, form: ChannelFormValues): string {
  const periodFrom = `${form.periodFrom.year}年${form.periodFrom.month}月`;
  const periodTo = `${form.periodTo.year}年${form.periodTo.month}月`;
  return `# 職務経歴書生成指示

## あなたへのお願い
このファイルと同梱の \`${channel}_messages.json\` を元に、
「プロジェクト詳細・担当業務・主な実績」を生成してください。

## 生成ルール
以下のフォーマットを厳守してください。

▼担当業務
（担当した業務の概要・開発フェーズを1〜2文で）

▼詳細
STAR（Situation→Task→Action→Result）の流れに沿って、一つの文章（地の文）で記述してください。
- Situation: どんなプロジェクト・チーム環境だったか
- Task: どんな問題・課題があったか
- Action: 課題に対して具体的に何をしたか
- Result: 成果。可能な限り数値・割合・時間で定量表現
※「Situation」等のラベルや箇条書きは出力に含めず、つながった文章として書くこと。

## 制約
- 全体400文字以内で出力すること
- Slackメッセージから読み取れない情報は根拠なく作らないこと
- 推測が必要な場合は合理的な範囲にとどめること
- 生成完了後はMarkdown形式でターミナルに表示すること

---

## プロジェクト情報

- チャンネル: ${channel}
- 期間: ${periodFrom}〜${periodTo}
- 職種: ${form.jobTitle}
- 役割: ${form.role}
- チーム規模: ${form.teamSize}
- 仕事内容: ${form.jobDescription}
- 利用技術: ${form.technologies.join("、")}

### プロジェクト詳細・担当業務・主な実績
<!-- ここをClaude Codeが埋める -->
`;
}

export interface SaveResumeResult {
  /** 生成したシーケンス（フォルダ名） */
  sequence: string;
  /** 保存先ディレクトリの絶対パス */
  dir: string;
  /** 保存した2ファイルのファイル名 */
  files: { messages: string; resumeDraft: string };
}

/**
 * storage/<YYYYMMDDHHMMSS>/ に messages.json と resume_draft.md を保存する。
 * 保存先ディレクトリ情報を返す。
 */
export async function saveResumeFiles(
  payload: SlackMessagesPayload,
  form: ChannelFormValues,
): Promise<SaveResumeResult> {
  const channel = sanitizeChannelName(payload.channel);
  const messagesFile = `${channel}_messages.json`;
  const resumeDraftFile = "resume_draft.md";

  const sequence = buildSequence();
  const dir = path.join(STORAGE_ROOT, sequence);
  await mkdir(dir, { recursive: true });

  await Promise.all([
    writeFile(path.join(dir, messagesFile), JSON.stringify(payload, null, 2), "utf-8"),
    writeFile(path.join(dir, resumeDraftFile), buildResumeDraft(payload.channel, form), "utf-8"),
  ]);

  return {
    sequence,
    dir,
    files: { messages: messagesFile, resumeDraft: resumeDraftFile },
  };
}
