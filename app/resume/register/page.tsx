"use client";

import { useEffect, useState } from "react";
import type { ChannelFormValues, MessagesPayload, SlackChannel } from "@/types";
import { ChannelFormSchema, Step1Schema } from "@/constants/validation";
import LoadingOverlay from "@/components/LoadingOverlay";
import DateRangePicker from "@/components/DateRangePicker";
import ChannelSelector from "@/components/ChannelSelector";
import ChannelForm, { type ChannelFormErrors } from "@/components/ChannelForm";

type Step = 1 | 2;

const EMPTY_FORM: ChannelFormValues = {
  periodFrom: { year: "", month: "" },
  periodTo: { year: "", month: "" },
  jobTitle: "",
  role: "",
  teamSize: "",
  jobDescription: "",
  technologies: [],
};

/** Zodのissueを { フィールド名: メッセージ } に畳み込む（最初のpath要素をキーに） */
function collectErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

function buildResumeDraft(channel: string, form: ChannelFormValues): string {
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
■ Situation（状況）: どんなプロジェクト・チーム環境だったかを文章で
■ Task（課題）: どんな問題・課題があったかを文章で
■ Action（行動）: 課題に対して具体的に何をしたかを文章で
■ Result（結果）: 成果を文章で。可能な限り数値・割合・時間で定量表現

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

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 連続ダウンロードでrevokeが早すぎないよう少し遅延
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);

  // --- チャンネル一覧（ページ初期表示時に取得） ---
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState<string>();

  // --- Step1 状態 ---
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [channelId, setChannelId] = useState("");
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // --- 取得処理 ---
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string>();
  const [payload, setPayload] = useState<MessagesPayload | null>(null);

  // --- Step2 状態 ---
  const [form, setForm] = useState<ChannelFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ChannelFormErrors>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/messages");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "チャンネル一覧の取得に失敗しました");
        if (!cancelled) setChannels(data.channels ?? []);
      } catch (e) {
        if (!cancelled) {
          setChannelsError(e instanceof Error ? e.message : "チャンネル一覧の取得に失敗しました");
        }
      } finally {
        if (!cancelled) setChannelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedChannel = channels.find((c) => c.id === channelId);

  // Step1 → メッセージ取得 → Step2
  const handleStep1Submit = async () => {
    setFetchError(undefined);
    const result = Step1Schema.safeParse({ dateFrom, dateTo, channelId });
    if (!result.success) {
      setStep1Errors(collectErrors(result.error.issues));
      return;
    }
    setStep1Errors({});
    if (!selectedChannel) return;

    setFetching(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          channelName: selectedChannel.name,
          from: dateFrom,
          to: dateTo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "メッセージの取得に失敗しました");
      setPayload(data as MessagesPayload);
      setStep(2);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "メッセージの取得に失敗しました");
    } finally {
      setFetching(false);
    }
  };

  // Step2 → 2ファイルダウンロード
  const handleDownload = () => {
    const result = ChannelFormSchema.safeParse(form);
    if (!result.success) {
      setFormErrors(collectErrors(result.error.issues) as ChannelFormErrors);
      return;
    }
    setFormErrors({});
    if (!payload) return;

    const channel = payload.channel;
    downloadBlob(
      `${channel}_messages.json`,
      JSON.stringify(payload, null, 2),
      "application/json",
    );
    downloadBlob(`resume_draft.md`, buildResumeDraft(channel, form), "text/markdown");
  };

  return (
    <div className="relative min-h-screen px-5 py-10 sm:py-16">
      <LoadingOverlay show={fetching} />

      <div className="mx-auto w-full max-w-2xl">
        {/* マストヘッド */}
        <header className="animate-rise mb-10 flex items-start gap-4">
          <div>
            <h1 className="font-display text-[26px] font-bold leading-tight text-ink sm:text-[30px]">
              職務経歴書ジェネレーター
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              Slackの会話から、プロジェクト詳細の下書きを仕立てる。
            </p>
          </div>
        </header>

        {/* ステップインジケーター */}
        <ol className="animate-rise mb-7 flex items-center gap-3 [animation-delay:80ms]">
          <StepBadge index={1} label="設定" active={step === 1} done={step > 1} />
          <span className="h-px flex-1 bg-line-strong" />
          <StepBadge index={2} label="作成" active={step === 2} done={false} />
        </ol>

        {/* カード本体 */}
        <main className="animate-rise relative rounded-[6px] border border-line bg-surface p-6 shadow-[0_20px_50px_-30px_rgba(33,30,26,0.5)] [animation-delay:160ms] sm:p-9">
          {/* 紙の上辺アクセント */}
          <span className="absolute inset-x-0 top-0 h-[3px] rounded-t-[6px] bg-gradient-to-r from-accent via-accent-deep to-accent/40" />

          {step === 1 ? (
            <section className="space-y-7">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">対象期間とチャンネル</h2>
                <p className="mt-1 text-[13px] text-ink-soft">
                  経歴書に反映したい会話の期間と、対象のSlackチャンネルを選んでください。
                </p>
              </div>

              <DateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChangeFrom={setDateFrom}
                onChangeTo={setDateTo}
                errorFrom={step1Errors.dateFrom}
                errorTo={step1Errors.dateTo}
              />

              <ChannelSelector
                channels={channels}
                selectedId={channelId}
                onSelect={setChannelId}
                loading={channelsLoading}
                loadError={channelsError}
                error={step1Errors.channelId}
              />

              {fetchError && (
                <p
                  role="alert"
                  className="animate-fade rounded border border-accent/30 bg-accent-soft/50 px-4 py-3 text-[13px] text-accent-deep"
                >
                  {fetchError}
                </p>
              )}

              <button
                type="button"
                onClick={handleStep1Submit}
                disabled={channelsLoading || Boolean(channelsError)}
                className="flex w-full items-center justify-center gap-2 rounded bg-ink px-6 py-4 text-[15px] font-medium tracking-wide text-paper transition-all hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                メッセージを取得して次へ
                <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 10h11m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </section>
          ) : (
            <section className="space-y-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">プロジェクト情報の入力</h2>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    入力内容をもとに、生成指示ファイルを書き出します。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFetchError(undefined);
                  }}
                  className="shrink-0 text-[13px] text-ink-soft underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  ← 設定に戻る
                </button>
              </div>

              {/* 取得結果バナー */}
              {payload && (
                <div className="animate-fade flex items-center gap-2.5 rounded border border-success/25 bg-success/8 px-4 py-3 text-[13px] text-ink-soft">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="m3 8 3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <span className="font-medium text-ink">#&nbsp;{payload.channel}</span> から{" "}
                    <span className="tnum font-medium text-ink">{payload.messages.length}</span> 件のメッセージを取得しました
                  </span>
                </div>
              )}

              <ChannelForm
                values={form}
                errors={formErrors}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                onSubmit={handleDownload}
              />
            </section>
          )}
        </main>

        <footer className="animate-fade mt-8 text-center text-[12px] text-ink-faint [animation-delay:240ms]">
          ローカル動作・メッセージは保存されません — 書き出したファイルをClaude Codeに渡して生成します。
        </footer>
      </div>
    </div>
  );
}

interface StepBadgeProps {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}

function StepBadge({ index, label, active, done }: StepBadgeProps) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-bold transition-colors ${
          active
            ? "border-accent bg-accent text-paper"
            : done
              ? "border-accent/40 bg-accent-soft text-accent-deep"
              : "border-line-strong bg-surface text-ink-faint"
        }`}
      >
        {done ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m3 8 3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="tnum">{String(index).padStart(2, "0")}</span>
        )}
      </span>
      <span
        className={`font-display text-[14px] tracking-wide ${
          active ? "text-ink" : "text-ink-faint"
        }`}
      >
        {label}
      </span>
    </li>
  );
}
