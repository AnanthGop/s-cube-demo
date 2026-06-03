import React from "react";

interface ReportHeaderFiltersProps {
  financialYearOptions: string[];
  selectedFinancialYear: string;
  onFinancialYearChange: (value: string) => void;
  bookOptions: string[];
  selectedBook: string;
  onBookChange: (value: string) => void;
}

const selectClassName =
  "min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40";

const ReportHeaderFilters: React.FC<ReportHeaderFiltersProps> = ({
  financialYearOptions,
  selectedFinancialYear,
  onFinancialYearChange,
  bookOptions,
  selectedBook,
  onBookChange,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Financial Year
        <select
          value={selectedFinancialYear}
          onChange={(event) => onFinancialYearChange(event.target.value)}
          className={selectClassName}>
          {financialYearOptions.map((financialYear) => (
            <option
              key={financialYear}
              value={financialYear}
              className="text-slate-900">
              {financialYear}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Select Books of Accounts
        <select
          value={selectedBook}
          onChange={(event) => onBookChange(event.target.value)}
          className={selectClassName}>
          {bookOptions.map((book) => (
            <option
              key={book}
              value={book}
              className="text-slate-900">
              {book}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default ReportHeaderFilters;
