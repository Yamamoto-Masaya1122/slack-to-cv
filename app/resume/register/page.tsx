"use client";

import { useEffect, useState } from "react";
import type { ChannelFormValues } from "@/types/resume";
import type { SlackChannel, SlackMessagesPayload } from "@/types/slack";
import { ResumeFormSchema, InitialSettingSchema } from "@/schemas/validation";
import LoadingOverlay from "@/components/LoadingOverlay";
import DateRangePicker from "@/components/DateRangePicker";
import ChannelSelector from "@/components/ChannelSelector";
import ChannelForm, { type ChannelFormErrors } from "@/components/ChannelForm";
import { saveResumeAction } from "../../../actions/resume/actions";

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
  const [payload, setPayload] = useState<SlackMessagesPayload | null>(null);

  // --- Step2 状態 ---
  const [form, setForm] = useState<ChannelFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ChannelFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [savedSequence, setSavedSequence] = useState<string>();

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
    const result = InitialSettingSchema.safeParse({ dateFrom, dateTo, channelId });
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
      setPayload(data as SlackMessagesPayload);
      setStep(2);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "メッセージの取得に失敗しました");
    } finally {
      setFetching(false);
    }
  };

  // Step2 → storage/<YYYYMMDDHHMMSS>/ に2ファイルを保存
  const handleSave = async () => {
    setSaveError(undefined);
    setSavedSequence(undefined);

    const result = ResumeFormSchema.safeParse(form);
    if (!result.success) {
      setFormErrors(collectErrors(result.error.issues) as ChannelFormErrors);
      return;
    }
    setFormErrors({});
    if (!payload) return;

    setSaving(true);
    try {
      const res = await saveResumeAction(payload, form);
      if (!res.ok) {
        setSaveError(res.error);
        return;
      }
      setSavedSequence(res.sequence);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "ファイルの保存に失敗しました");
    } finally {
      setSaving(false);
    }
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
                submitting={saving}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                onSubmit={handleSave}
              />

              {savedSequence && (
                <div className="animate-fade mt-5 rounded border border-line bg-surface-raised px-4 py-3 text-[13px] text-ink-soft">
                  <span className="font-medium text-ink">保存しました。</span>{" "}
                  <code className="tnum">storage/{savedSequence}/</code> に2ファイルを書き出しました。
                </div>
              )}
              {saveError && (
                <div className="animate-fade mt-5 rounded border border-line bg-surface-raised px-4 py-3 text-[13px] text-red-600">
                  {saveError}
                </div>
              )}
            </section>
          )}
        </main>

        <footer className="animate-fade mt-8 text-center text-[12px] text-ink-faint [animation-delay:240ms]">
          書き出したファイルは storage/ 配下に保存されます — そのファイルをClaude Codeに渡して生成します。
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
