"use client";

import { useEffect, useState } from "react";
import type { ChannelFormValues } from "@/types/resume";
import type { SlackChannel, SlackMessagesPayload } from "@/types/slack";
import { ResumeFormSchema, InitialSettingSchema } from "@/schemas/validation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
import DateRangePicker from "@/components/DateRangePicker";
import ChannelSelector from "@/components/ChannelSelector";
import ChannelForm, { type ChannelFormErrors } from "@/components/ChannelForm";
import HelpTooltip from "@/components/HelpTooltip";
import { saveResumeAction } from "../../../actions/resume/actions";

type Step = 1 | 2;

const EMPTY_FORM: ChannelFormValues = {
  periodFrom: { year: "", month: "" },
  periodTo: { year: "", month: "" },
  ongoing: false,
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
  const [payload, setPayload] = useState<SlackMessagesPayload | null>(null);

  // --- Step2 状態 ---
  const [form, setForm] = useState<ChannelFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ChannelFormErrors>({});
  const [saving, setSaving] = useState(false);

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
      const result = data as SlackMessagesPayload;
      setPayload(result);
      setStep(2);
      toast.success(`# ${result.channel} から ${result.messages.length} 件のメッセージを取得しました`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "メッセージの取得に失敗しました");
    } finally {
      setFetching(false);
    }
  };

  // Step2 → storage/<YYYYMMDDHHMMSS>/ に2ファイルを保存
  const handleSave = async () => {
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
        toast.error(res.error);
        return;
      }
      toast.success(`保存しました。storage/${res.sequence}/ に2ファイルを書き出しました`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ファイルの保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen px-5 py-10 sm:py-16">
      <LoadingOverlay show={fetching} />

      <div className="mx-auto w-full max-w-2xl">
        {/* ステップインジケーター */}
        <ol className="animate-rise mb-7 flex items-center gap-3 [animation-delay:80ms]">
          <StepBadge index={1} label="設定" active={step === 1} done={step > 1} />
          <span className="h-px flex-1 bg-border" />
          <StepBadge index={2} label="作成" active={step === 2} done={false} />
        </ol>

        {step === 2 && (
          <div className="mb-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="animate-fade"
            >
              ← 設定に戻る
            </Button>
          </div>
        )}

        {/* カード本体 */}
        <Card className="animate-rise gap-0 overflow-visible p-6 shadow-sm [animation-delay:160ms] sm:p-9">
          {step === 1 ? (
            <section className="space-y-7">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-semibold text-foreground">対象期間とチャンネル</h2>
                <HelpTooltip text="経歴書に反映したい会話の期間と、対象のSlackチャンネルを選んでください。" />
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

              <Button
                type="button"
                onClick={handleStep1Submit}
                disabled={channelsLoading || Boolean(channelsError)}
                className="h-11 w-full gap-2 text-[15px] hover:bg-accent-deep"
              >
                メッセージを取得して次へ
                <ArrowRight className="size-[18px]" />
              </Button>
            </section>
          ) : (
            <section className="space-y-7">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-semibold text-foreground">プロジェクト情報の入力</h2>
                <HelpTooltip text="入力内容をもとに、生成指示ファイルを書き出します。書き出したファイル（messages.json と resume_draft.md）は storage/ 配下に保存され、そのファイルをClaude Codeに渡して生成します。" />
              </div>

              <ChannelForm
                values={form}
                errors={formErrors}
                submitting={saving}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                onSubmit={handleSave}
              />
            </section>
          )}
        </Card>
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
    <li className="flex items-center gap-2.5" aria-current={active ? "step" : undefined}>
      <span
        className={`flex size-8 items-center justify-center rounded-full border text-[13px] font-bold transition-colors ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : done
              ? "border-primary/40 bg-accent-soft text-primary"
              : "border-line-strong bg-card text-muted-foreground"
        }`}
      >
        {done ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : (
          <span className="tnum">{String(index).padStart(2, "0")}</span>
        )}
      </span>
      <span
        className={`text-sm tracking-wide ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </li>
  );
}
