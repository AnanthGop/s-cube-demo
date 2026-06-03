import React, { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDateLabel = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const buildCalendarDays = (month: Date) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: Array<{ iso: string; day: number; isCurrentMonth: boolean }> = [];

  for (let i = 0; i < firstDay; i += 1) {
    days.push({ iso: `empty-${i}`, day: 0, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      iso: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      isCurrentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      iso: `empty-tail-${days.length}`,
      day: 0,
      isCurrentMonth: false,
    });
  }

  return days;
};

export interface CompactDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  popupClassName?: string;
  disabled?: boolean;
}

export const CompactDatePicker: React.FC<CompactDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  popupClassName = "",
  disabled = false,
}) => {
  const parsedValue = value ? new Date(value) : null;
  const initialMonth =
    parsedValue && !Number.isNaN(parsedValue.getTime()) ?
      parsedValue
    : new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "year">("day");
  const [viewMonth, setViewMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!value) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return;
    setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setMode("day");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const visibleYear = viewMonth.getFullYear();
  const visibleMonthIndex = viewMonth.getMonth();
  const selectedYear = value ? Number(value.split("-")[0]) : NaN;
  const years = useMemo(() => {
    const yearGridStart = Math.floor(visibleYear / 12) * 12;
    return Array.from({ length: 12 }, (_, index) => yearGridStart + index);
  }, [visibleYear]);
  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  return (
    <div
      ref={wrapperRef}
      className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold outline-none transition-colors hover:border-slate-300 focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 ${className}`}>
        <span className={value ? "" : "text-slate-400 dark:text-slate-500"}>
          {value ? formatDateLabel(value) : placeholder}
        </span>
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute left-0 top-[calc(100%+6px)] z-30 w-[280px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 ${popupClassName}`}>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(
                    mode === "year" ? visibleYear - 12 : visibleYear,
                    visibleMonthIndex - (mode === "day" ? 1 : 0),
                    1,
                  ),
                )
              }
              className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              {"<"}
            </button>

            <button
              type="button"
              onClick={() => setMode((prev) => (prev === "day" ? "year" : "day"))}
              className="rounded-lg px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800">
              {mode === "day" ?
                `${MONTH_LABELS[visibleMonthIndex]} ${visibleYear}`
              : `${years[0]} - ${years[years.length - 1]}`}
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(
                    mode === "year" ? visibleYear + 12 : visibleYear,
                    visibleMonthIndex + (mode === "day" ? 1 : 0),
                    1,
                  ),
                )
              }
              className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              {">"}
            </button>
          </div>

          {mode === "year" ?
            <div className="grid grid-cols-3 gap-1.5">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setViewMonth(new Date(year, visibleMonthIndex, 1));
                    setMode("day");
                  }}
                  className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
                    year === selectedYear ?
                      "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}>
                  {year}
                </button>
              ))}
            </div>
          : <>
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((day) => (
                  <div
                    key={day}
                    className="py-1 text-center text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) =>
                  day.isCurrentMonth ?
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => {
                        onChange(day.iso);
                        setIsOpen(false);
                        setMode("day");
                      }}
                      className={`aspect-square rounded-md text-xs font-semibold transition-colors ${
                        day.iso === value ?
                          "bg-brand-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}>
                      {day.day}
                    </button>
                  : <div
                      key={day.iso}
                      className="aspect-square"
                    />,
                )}
              </div>
              <div className="mt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                    setMode("day");
                  }}
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                    onChange(iso);
                    setViewMonth(
                      new Date(today.getFullYear(), today.getMonth(), 1),
                    );
                    setIsOpen(false);
                    setMode("day");
                  }}
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                  Today
                </button>
              </div>
            </>
          }
        </div>
      )}
    </div>
  );
};
