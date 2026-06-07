import type { ChannelFormValues } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowDownToLine } from "lucide-react";
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
      <Label htmlFor={id} className="mb-1.5 text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="resize-y leading-relaxed"
          aria-invalid={Boolean(error)}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10"
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
        <p className="mb-2.5 text-sm font-medium text-muted-foreground">期間</p>
        <MonthRangePicker
          periodFrom={values.periodFrom}
          periodTo={values.periodTo}
          onChangeFrom={(periodFrom) => onChange({ periodFrom })}
          onChangeTo={(periodTo) => onChange({ periodTo })}
          errorFrom={errors.periodFrom}
          errorTo={errors.periodTo}
        />
      </div>

      <div className="h-px bg-border" />

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

      <div className="h-px bg-border" />

      <TechTagInput
        value={values.technologies}
        onChange={(technologies) => onChange({ technologies })}
        error={errors.technologies}
      />

      {/* 保存ボタン */}
      <div className="pt-1">
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full gap-2 text-[15px] hover:bg-accent-deep"
        >
          <ArrowDownToLine className="size-[18px]" />
          {submitting ? "保存中..." : "ファイルを保存"}
        </Button>
      </div>
    </form>
  );
}
