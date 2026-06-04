import ErrorMessage from "./ErrorMessage";

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  errorFrom?: string;
  errorTo?: string;
}

const inputClass =
  "focus-ink w-full rounded border border-line bg-surface-raised px-3.5 py-2.5 text-[15px] text-ink tnum transition-colors placeholder:text-ink-faint hover:border-line-strong";

/** Step1: 開始日・終了日のDatePicker（type=date） */
export default function DateRangePicker({
  dateFrom,
  dateTo,
  onChangeFrom,
  onChangeTo,
  errorFrom,
  errorTo,
}: DateRangePickerProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="dateFrom" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
          開始日
        </label>
        <input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => onChangeFrom(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errorFrom)}
        />
        <ErrorMessage message={errorFrom} />
      </div>
      <div>
        <label htmlFor="dateTo" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
          終了日
        </label>
        <input
          id="dateTo"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => onChangeTo(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errorTo)}
        />
        <ErrorMessage message={errorTo} />
      </div>
    </div>
  );
}
