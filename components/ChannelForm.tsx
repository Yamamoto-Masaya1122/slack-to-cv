import type { ChannelFormValues } from "@/types";
import MonthRangePicker from "./MonthRangePicker";
import TechTagInput from "./TechTagInput";
import ErrorMessage from "./ErrorMessage";

export type ChannelFormErrors = Partial<Record<keyof ChannelFormValues, string>>;

interface ChannelFormProps {
  values: ChannelFormValues;
  errors: ChannelFormErrors;
  submitting?: boolean;
  onChange: (patch: Partial<ChannelFormValues>) => void;
  onSubmit: () => void;
}

const fieldClass =
  "focus-ink w-full rounded border border-line bg-surface-raised px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong";

interface TextFieldProps {
  id: keyof ChannelFormValues;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}

function TextField({ id, label, placeholder, value, error, multiline, onChange }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${fieldClass} resize-y leading-relaxed`}
          aria-invalid={Boolean(error)}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClass}
          aria-invalid={Boolean(error)}
        />
      )}
      <ErrorMessage message={error} />
    </div>
  );
}

/** Step2: 職務経歴書作成フォーム全体 */
export default function ChannelForm({ values, errors, submitting, onChange, onSubmit }: ChannelFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-7"
    >
      {/* 期間 */}
      <div>
        <p className="mb-2.5 text-[13px] font-medium text-ink-soft">期間</p>
        <MonthRangePicker
          periodFrom={values.periodFrom}
          periodTo={values.periodTo}
          onChangeFrom={(periodFrom) => onChange({ periodFrom })}
          onChangeTo={(periodTo) => onChange({ periodTo })}
          errorFrom={errors.periodFrom}
          errorTo={errors.periodTo}
        />
      </div>

      <div className="h-px bg-line" />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="jobTitle"
          label="職種"
          placeholder="例: バックエンドエンジニア"
          value={values.jobTitle}
          error={errors.jobTitle}
          onChange={(jobTitle) => onChange({ jobTitle })}
        />
        <TextField
          id="role"
          label="役割"
          placeholder="例: メンバー / リーダー"
          value={values.role}
          error={errors.role}
          onChange={(role) => onChange({ role })}
        />
        <TextField
          id="teamSize"
          label="チーム規模"
          placeholder="例: 20人"
          value={values.teamSize}
          error={errors.teamSize}
          onChange={(teamSize) => onChange({ teamSize })}
        />
        <div className="sm:col-span-2">
          <TextField
            id="jobDescription"
            label="仕事内容"
            placeholder="例: 求人サービスのシステム開発"
            value={values.jobDescription}
            error={errors.jobDescription}
            multiline
            onChange={(jobDescription) => onChange({ jobDescription })}
          />
        </div>
      </div>

      <div className="h-px bg-line" />

      <TechTagInput
        value={values.technologies}
        onChange={(technologies) => onChange({ technologies })}
        error={errors.technologies}
      />

      {/* 保存ボタン */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded bg-ink px-6 py-4 text-[15px] font-medium tracking-wide text-paper transition-all hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M10 3v10m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16.5h12" strokeLinecap="round" />
          </svg>
          {submitting ? "保存中..." : "ファイルを保存"}
        </button>
        <p className="mt-2.5 text-center text-[12px] text-ink-faint">
          messages.json と resume_draft.md の2ファイルを storage/ に書き出します
        </p>
      </div>
    </form>
  );
}
