import ErrorMessage from "./ErrorMessage";

interface YearMonth {
  year: string;
  month: string;
}

interface MonthRangePickerProps {
  periodFrom: YearMonth;
  periodTo: YearMonth;
  onChangeFrom: (value: YearMonth) => void;
  onChangeTo: (value: YearMonth) => void;
  errorFrom?: string;
  errorTo?: string;
}

const YEARS: string[] = Array.from({ length: 28 }, (_, i) => String(2027 - i));
const MONTHS: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1));

const selectClass =
  "focus-ink appearance-none rounded border border-line bg-surface-raised py-2.5 pl-3.5 pr-9 text-[15px] text-ink tnum transition-colors hover:border-line-strong";

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="m2.5 4.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function YearMonthRow({
  label,
  value,
  onChange,
  idPrefix,
  invalid,
}: {
  label: string;
  value: YearMonth;
  onChange: (v: YearMonth) => void;
  idPrefix: string;
  invalid: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[13px] font-medium text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            id={`${idPrefix}-year`}
            value={value.year}
            onChange={(e) => onChange({ ...value, year: e.target.value })}
            className={selectClass}
            aria-invalid={invalid}
          >
            <option value="">年</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <Chevron />
        </div>
        <div className="relative">
          <select
            id={`${idPrefix}-month`}
            value={value.month}
            onChange={(e) => onChange({ ...value, month: e.target.value })}
            className={selectClass}
            aria-invalid={invalid}
          >
            <option value="">月</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>
    </div>
  );
}

/** Step2: 開始年月・終了年月（年・月のセレクトボックス） */
export default function MonthRangePicker({
  periodFrom,
  periodTo,
  onChangeFrom,
  onChangeTo,
  errorFrom,
  errorTo,
}: MonthRangePickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <YearMonthRow
          label="開始年月"
          value={periodFrom}
          onChange={onChangeFrom}
          idPrefix="periodFrom"
          invalid={Boolean(errorFrom)}
        />
        <ErrorMessage message={errorFrom} />
      </div>
      <div>
        <YearMonthRow
          label="終了年月"
          value={periodTo}
          onChange={onChangeTo}
          idPrefix="periodTo"
          invalid={Boolean(errorTo)}
        />
        <ErrorMessage message={errorTo} />
      </div>
    </div>
  );
}
