import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorMessage from "./ErrorMessage";

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  errorFrom?: string;
  errorTo?: string;
}

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
        <Label htmlFor="dateFrom" className="mb-1.5 text-sm font-medium text-muted-foreground">
          開始日
        </Label>
        <Input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => onChangeFrom(e.target.value)}
          className="tnum h-10"
          aria-invalid={Boolean(errorFrom)}
        />
        <ErrorMessage message={errorFrom} />
      </div>
      <div>
        <Label htmlFor="dateTo" className="mb-1.5 text-sm font-medium text-muted-foreground">
          終了日
        </Label>
        <Input
          id="dateTo"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => onChangeTo(e.target.value)}
          className="tnum h-10"
          aria-invalid={Boolean(errorTo)}
        />
        <ErrorMessage message={errorTo} />
      </div>
    </div>
  );
}
