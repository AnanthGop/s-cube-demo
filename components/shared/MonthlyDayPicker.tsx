import React, { useEffect, useRef, useState } from "react";

export const getMonthlyPostingLabel = (day: number) => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
};

export const MONTHLY_POSTING_OPTIONS = Array.from({ length: 31 }, (_, index) =>
  getMonthlyPostingLabel(index + 1),
);

export const normalizeMonthlyPostingDay = (value: unknown): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (MONTHLY_POSTING_OPTIONS.includes(raw)) return raw;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return getMonthlyPostingLabel(Number(isoMatch[3]));

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return getMonthlyPostingLabel(Number(slashMatch[1]));

  const leadingDay = raw.match(/^(\d{1,2})/);
  if (leadingDay) {
    const day = Number(leadingDay[1]);
    if (day >= 1 && day <= 31) return getMonthlyPostingLabel(day);
  }

  return raw;
};

interface MonthlyDayPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  popupClassName?: string;
  disabled?: boolean;
}

export const MonthlyDayPicker: React.FC<MonthlyDayPickerProps> = ({
  value,
  onChange,
  placeholder = "Select auto posting date",
  className = "",
  popupClassName = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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
        className={`w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold outline-none transition-colors hover:border-slate-300 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ${popupClassName}`}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Select Day
            </div>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100">
              Clear
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              const label = getMonthlyPostingLabel(day);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onChange(label);
                    setIsOpen(false);
                  }}
                  className={`aspect-square rounded-md text-xs font-bold transition-colors ${
                    value === label ?
                      "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                  title={label}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
