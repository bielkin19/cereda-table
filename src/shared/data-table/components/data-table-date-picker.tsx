import * as Popover from '@radix-ui/react-popover';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useDataTableLocale } from './data-table-locale-context';

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

function formatDisplay(value: string, months: readonly string[]): string {
  const parts = parseYMD(value);
  if (!parts) return '';
  const day = Number(value.slice(8, 10));
  return `${months[parts.month].slice(0, 3)} ${day}, ${parts.year}`;
}

interface CalendarDay {
  ymd: string;
  dayOfMonth: number;
  label: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

function buildCalendarDays(
  viewYear: number,
  viewMonth: number,
  selectedYmd: string,
  todayYmd: string,
  min: string | undefined,
  max: string | undefined,
): CalendarDay[] {
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startPad = firstDay.getDay();
  const endPad = 6 - new Date(viewYear, viewMonth, daysInMonth).getDay();
  const days: CalendarDay[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(viewYear, viewMonth, -i);
    const ymd = toYMD(date);
    days.push({
      ymd,
      dayOfMonth: date.getDate(),
      label: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      isCurrentMonth: false,
      isToday: ymd === todayYmd,
      isSelected: ymd === selectedYmd,
      isDisabled: (!!min && ymd < min) || (!!max && ymd > max),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    const ymd = toYMD(date);
    days.push({
      ymd,
      dayOfMonth: d,
      label: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      isCurrentMonth: true,
      isToday: ymd === todayYmd,
      isSelected: ymd === selectedYmd,
      isDisabled: (!!min && ymd < min) || (!!max && ymd > max),
    });
  }

  for (let i = 1; i <= endPad; i++) {
    const date = new Date(viewYear, viewMonth + 1, i);
    const ymd = toYMD(date);
    days.push({
      ymd,
      dayOfMonth: i,
      label: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      isCurrentMonth: false,
      isToday: ymd === todayYmd,
      isSelected: ymd === selectedYmd,
      isDisabled: (!!min && ymd < min) || (!!max && ymd > max),
    });
  }

  return days;
}

interface DataTableCalendarProps {
  max?: string;
  min?: string;
  onChange: (ymd: string) => void;
  value: string;
}

function DataTableCalendar({ max, min, onChange, value }: DataTableCalendarProps) {
  const locale = useDataTableLocale();
  const today = new Date();
  const todayYmd = toYMD(today);
  const parts = parseYMD(value);

  const [viewYear, setViewYear] = useState(() => parts?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parts?.month ?? today.getMonth());

  const days = useMemo(
    () => buildCalendarDays(viewYear, viewMonth, value, todayYmd, min, max),
    [viewYear, viewMonth, value, todayYmd, min, max],
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="cereda-table__calendar">
      <div className="cereda-table__calendar-header">
        <button
          type="button"
          className="cereda-table__calendar-nav"
          onClick={prevMonth}
          aria-label={locale.datePicker.prevMonthAriaLabel}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <span className="cereda-table__calendar-month-label">
          {locale.datePicker.months[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          className="cereda-table__calendar-nav"
          onClick={nextMonth}
          aria-label={locale.datePicker.nextMonthAriaLabel}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="cereda-table__calendar-grid" role="grid" aria-label={locale.datePicker.calendarAriaLabel}>
        {locale.datePicker.weekdays.map((label) => (
          <span
            key={label}
            className="cereda-table__calendar-weekday"
            role="columnheader"
          >
            {label}
          </span>
        ))}
        {days.map((day) => {
          let className = 'cereda-table__calendar-day';
          if (!day.isCurrentMonth) className += ' cereda-table__calendar-day--outside';
          if (day.isToday && !day.isSelected) className += ' cereda-table__calendar-day--today';
          if (day.isSelected) className += ' cereda-table__calendar-day--selected';
          if (day.isDisabled) className += ' cereda-table__calendar-day--disabled';

          return (
            <button
              key={day.ymd}
              type="button"
              role="gridcell"
              className={className}
              disabled={day.isDisabled}
              aria-label={day.label}
              aria-pressed={day.isSelected}
              tabIndex={day.isCurrentMonth && !day.isDisabled ? 0 : -1}
              onClick={() => onChange(day.ymd)}
            >
              {day.dayOfMonth}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface DataTableDatePickerProps {
  inputLabel?: string;
  label: string;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  value: string;
}

export function DataTableDatePicker({
  inputLabel,
  label,
  max,
  min,
  onChange,
  onClear,
  placeholder,
  value,
}: DataTableDatePickerProps) {
  const locale = useDataTableLocale();
  const [open, setOpen] = useState(false);
  const displayText = formatDisplay(value, locale.datePicker.months);

  function handleSelect(ymd: string) {
    onChange(ymd);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="cereda-table__date-picker">
        <Popover.Trigger asChild>
          <button
            type="button"
            className={
              displayText
                ? 'cereda-table__date-picker-trigger'
                : 'cereda-table__date-picker-trigger cereda-table__date-picker-trigger--empty'
            }
            aria-label={`${label}: ${displayText || placeholder || locale.datePicker.selectDatePlaceholder}`}
          >
            <CalendarDays className="cereda-table__date-picker-icon" aria-hidden="true" />
            <span className="cereda-table__date-picker-trigger-text">
              {displayText || placeholder || label}
            </span>
          </button>
        </Popover.Trigger>
        {/* Visually hidden date input — keeps keyboard entry and programmatic change events working */}
        <input
          type="date"
          className="cereda-table__date-picker-hidden-input"
          aria-label={inputLabel ?? label}
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.currentTarget.value)}
          tabIndex={-1}
        />
        {onClear && value ? (
          <button
            type="button"
            className="cereda-table__column-filter-clear"
            onClick={onClear}
            aria-label={locale.datePicker.clearAriaLabel(label)}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {open ? (
        <Popover.Portal>
          <Popover.Content
            className="cereda-table__date-picker-popover"
            sideOffset={6}
            align="start"
          >
            <DataTableCalendar
              value={value}
              onChange={handleSelect}
              min={min}
              max={max}
            />
          </Popover.Content>
        </Popover.Portal>
      ) : null}
    </Popover.Root>
  );
}

