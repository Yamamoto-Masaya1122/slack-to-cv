import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface YearMonthRowProps {
  label: string;
  value: YearMonth;
  onChange: (v: YearMonth) => void;
  idPrefix: string;
  invalid: boolean;
}

function YearMonthRow({ label, value, onChange, idPrefix, invalid }: YearMonthRowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm font-medium text-muted-foreground sm:w-16 sm:shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <Select value={value.year} onValueChange={(year) => onChange({ ...value, year })}>
          <SelectTrigger id={`${idPrefix}-year`} aria-invalid={invalid} className="tnum h-10 w-28">
            <SelectValue placeholder="年" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y} className="tnum">
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.month} onValueChange={(month) => onChange({ ...value, month })}>
          <SelectTrigger id={`${idPrefix}-month`} aria-invalid={invalid} className="tnum h-10 w-24">
            <SelectValue placeholder="月" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={m} className="tnum">
                {m}月
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
