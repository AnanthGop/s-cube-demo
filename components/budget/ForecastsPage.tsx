import React, { useState, useMemo } from "react";
import {
  Calculator,
  CheckSquare,
  Square,
  RefreshCw,
  MessageSquare,
  X,
  AlignLeft,
} from "lucide-react";

interface ForecastsPageProps {
  themeColor: string;
  users?: UserItem[];
}

interface UserItem {
  id?: number | string;
  name?: string;
  status?: string;
}

type AdjustmentType = "percentage" | "flat";
type AdjustmentDirection = "increase" | "decrease";

interface ScenarioAdjustment {
  type: AdjustmentType;
  direction: AdjustmentDirection;
  value: number;
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({
  themeColor,
  users = [],
}) => {
  const [selectedLedgers, setSelectedLedgers] = useState<Set<string>>(
    new Set(),
  );
  const [scenarioAdjustments, setScenarioAdjustments] = useState<
    Record<string, ScenarioAdjustment>
  >({});

  // What-If input states
  const [adjValue, setAdjValue] = useState<number>(0);
  const [adjType, setAdjType] = useState<AdjustmentType>("percentage");
  const [adjDir, setAdjDir] = useState<AdjustmentDirection>("increase");

  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{
    ledgerKey: string;
    monthKey: string;
    ledgerName: string;
    monthLabel: string;
  } | null>(null);
  const [comments, setComments] = useState<
    Record<string, Record<string, string>>
  >({});
  const [assignedQueries, setAssignedQueries] = useState<
    Record<string, string>
  >({});
  const [queryDrafts, setQueryDrafts] = useState<Record<string, string>>({});

  const getFocusedCellKey = (ledgerKey: string, monthKey: string) =>
    `${ledgerKey}__${monthKey}`;

  const handleQueryDraftChange = (
    ledgerKey: string,
    monthKey: string,
    userName: string,
  ) => {
    const cellKey = getFocusedCellKey(ledgerKey, monthKey);
    setQueryDrafts((prev) => ({
      ...prev,
      [cellKey]: userName,
    }));
  };

  const handleAssignQuery = (ledgerKey: string, monthKey: string) => {
    const cellKey = getFocusedCellKey(ledgerKey, monthKey);
    const selectedUser = queryDrafts[cellKey] || "";

    if (!selectedUser) return;

    setAssignedQueries((prev) => ({
      ...prev,
      [cellKey]: selectedUser,
    }));
  };

  const userOptions = Array.from(
    new Set(
      users
        .map((user) => (typeof user?.name === "string" ? user.name.trim() : ""))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  // 6 months actuals, 6 months forecasts
  const actualMonths = [
    "Oct 25",
    "Nov 25",
    "Dec 25",
    "Jan 26",
    "Feb 26",
    "Mar 26",
  ];
  const forecastMonths = [
    "Apr 26",
    "May 26",
    "Jun 26",
    "Jul 26",
    "Aug 26",
    "Sep 26",
  ];

  const baseData = [
    {
      category: "Income",
      groups: [
        {
          name: "Grants & Donations",
          ledgers: [
            {
              code: "INC-001",
              desc: "UNESCO Core Grant",
              budget: 120000,
              actuals: [10000, 10000, 10000, 10000, 10000, 10000],
              forecasts: [10000, 10000, 10000, 10000, 10000, 10000],
            },
            {
              code: "INC-002",
              desc: "Corporate CSR - Tata",
              budget: 300000,
              actuals: [0, 0, 100000, 0, 0, 0],
              forecasts: [0, 0, 100000, 0, 0, 100000],
            },
          ],
        },
        {
          name: "Other Income",
          ledgers: [
            {
              code: "INC-003",
              desc: "Bank Interest",
              budget: 5000,
              actuals: [420, 410, 415, 400, 390, 395],
              forecasts: [380, 375, 370, 365, 360, 355],
            },
          ],
        },
      ],
    },
    {
      category: "Expenditure",
      groups: [
        {
          name: "Personnel Costs",
          ledgers: [
            {
              code: "EXP-101",
              desc: "Executive Salaries",
              budget: 180000,
              actuals: [15000, 15000, 15000, 15000, 15000, 15000],
              forecasts: [15000, 15000, 15000, 15000, 15000, 15000],
            },
            {
              code: "EXP-102",
              desc: "Consultant Fees",
              budget: 60000,
              actuals: [5000, 4000, 6000, 5000, 5000, 5000],
              forecasts: [5000, 5000, 5000, 5000, 5000, 5000],
            },
          ],
        },
        {
          name: "Operational Expenses",
          ledgers: [
            {
              code: "EXP-201",
              desc: "Office Rent - HQ",
              budget: 42000,
              actuals: [3500, 3500, 3500, 3500, 3500, 3500],
              forecasts: [3500, 3500, 3500, 3500, 3500, 3500],
            },
            {
              code: "EXP-202",
              desc: "Utilities (Power/Water)",
              budget: 12000,
              actuals: [950, 900, 850, 1100, 1050, 1000],
              forecasts: [950, 900, 1200, 1150, 1000, 950],
            },
            {
              code: "EXP-203",
              desc: "IT Infrastructure",
              budget: 25000,
              actuals: [2000, 1500, 1500, 2500, 1500, 1500],
              forecasts: [3000, 1500, 1500, 2500, 1500, 1500],
            },
          ],
        },
      ],
    },
  ];

  // Process data with What-If adjustments applied
  const processedData = useMemo(() => {
    return baseData.map((cat) => ({
      ...cat,
      groups: cat.groups.map((grp) => ({
        ...grp,
        ledgers: grp.ledgers.map((l) => {
          const adj = scenarioAdjustments[l.code];
          let updatedForecasts = [...l.forecasts];
          let forecastSum = updatedForecasts.reduce((a, b) => a + b, 0);

          if (adj) {
            // apply adjustment to the total remaining forecast and distribute, or modify each uniformly
            const factor = adj.direction === "increase" ? 1 : -1;

            if (adj.type === "percentage") {
              const multiplier = 1 + (factor * adj.value) / 100;
              updatedForecasts = updatedForecasts.map((v) =>
                Math.max(0, Math.round(v * multiplier)),
              );
            } else {
              // Flat amount distributed across the 6 forecast months
              const monthlyAdj = (factor * adj.value) / 6;
              updatedForecasts = updatedForecasts.map((v) =>
                Math.max(0, Math.round(v + monthlyAdj)),
              );
            }
          }
          const actualSum = l.actuals.reduce((a, b) => a + b, 0);
          forecastSum = updatedForecasts.reduce((a, b) => a + b, 0);
          const outlook = actualSum + forecastSum;

          return {
            ...l,
            forecasts: updatedForecasts,
            actualSum,
            forecastSum,
            outlook,
          };
        }),
      })),
    }));
  }, [scenarioAdjustments]);

  const allLedgerCodes = useMemo(() => {
    return baseData.flatMap((c) =>
      c.groups.flatMap((g) => g.ledgers.map((l) => l.code)),
    );
  }, []);

  const toggleLedger = (code: string) => {
    const next = new Set(selectedLedgers);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelectedLedgers(next);
  };

  const toggleAll = () => {
    if (selectedLedgers.size === allLedgerCodes.length) {
      setSelectedLedgers(new Set());
    } else {
      setSelectedLedgers(new Set(allLedgerCodes));
    }
  };

  const applyWhatIf = () => {
    if (selectedLedgers.size === 0 || adjValue === 0) return;
    const nextAdj = { ...scenarioAdjustments };
    selectedLedgers.forEach((code) => {
      nextAdj[code] = { type: adjType, direction: adjDir, value: adjValue };
    });
    setScenarioAdjustments(nextAdj);

    // reset selection and inputs
    setSelectedLedgers(new Set());
    setAdjValue(0);
  };

  const clearAdjustments = () => {
    setScenarioAdjustments({});
    setSelectedLedgers(new Set());
    setAdjValue(0);
  };

  const handleCommentChange = (
    ledgerKey: string,
    monthKey: string,
    text: string,
  ) => {
    setComments((prev) => ({
      ...prev,
      [ledgerKey]: {
        ...(prev[ledgerKey] || {}),
        [monthKey]: text,
      },
    }));
  };

  // Sticky columns widths
  const posSelect = "0px";
  const posCat = "40px";
  const posGroup = "140px";
  const posDesc = "300px";
  const posAnnualBudget = "460px";
  const posOutlook = "580px";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex gap-4 items-start">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-300 flex-1 w-full">
        {/* Header */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white shrink-0`}>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Forecasts & What-If Analysis
            </h2>
            <p className="text-white/70 text-xs font-medium mt-0.5">
              Analyze actuals vs predictions, apply scenario adjustments to
              forecast the financial outlook
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition border backdrop-blur-sm ${
                showNotesDrawer ?
                  "bg-white text-slate-800 dark:bg-slate-800 dark:text-white border-white dark:border-slate-800"
                : "bg-white/20 hover:bg-white/30 text-white border-white/30"
              }`}>
              <MessageSquare size={14} />
              {showNotesDrawer ? "Close Notes" : "Add Notes"}
            </button>
          </div>
        </div>

        {/* What-If Action Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Calculator
              size={16}
              className={`text-${themeColor}`}
            />
            <span>Scenario Builder</span>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>

          <select
            value={adjDir}
            onChange={(e) => setAdjDir(e.target.value as AdjustmentDirection)}
            className="text-sm font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="increase">Increase Forecast by</option>
            <option value="decrease">Decrease Forecast by</option>
          </select>

          <input
            type="number"
            value={adjValue || ""}
            onChange={(e) => setAdjValue(Number(e.target.value))}
            placeholder="Amount"
            className="w-24 text-sm font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none"
          />

          <select
            value={adjType}
            onChange={(e) => setAdjType(e.target.value as AdjustmentType)}
            className="text-sm font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="percentage">%</option>
            <option value="flat">Flat Number</option>
          </select>

          <button
            onClick={applyWhatIf}
            disabled={selectedLedgers.size === 0 || adjValue === 0}
            className={`text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-lg transition-colors ${selectedLedgers.size === 0 || adjValue === 0 ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed" : `bg-${themeColor} text-white hover:opacity-90 shadow-md`}`}>
            Apply to Selected ({selectedLedgers.size})
          </button>

          {Object.keys(scenarioAdjustments).length > 0 && (
            <button
              onClick={clearAdjustments}
              className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1.5 ml-auto">
              <RefreshCw size={14} /> Clear All Adjustments
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1 scrollbar-hide">
            <table className="w-full border-collapse text-left whitespace-nowrap min-w-max">
              <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                <tr>
                  <th
                    className="py-4 px-2 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b text-center cursor-pointer hover:text-slate-600"
                    style={{
                      left: posSelect,
                      minWidth: "40px",
                      maxWidth: "40px",
                    }}
                    onClick={toggleAll}>
                    {selectedLedgers.size === allLedgerCodes.length ?
                      <CheckSquare
                        size={14}
                        className="mx-auto"
                      />
                    : <Square
                        size={14}
                        className="mx-auto"
                      />
                    }
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{
                      left: posCat,
                      minWidth: "100px",
                      maxWidth: "100px",
                    }}>
                    Category
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{
                      left: posGroup,
                      minWidth: "160px",
                      maxWidth: "160px",
                    }}>
                    Group
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{
                      left: posDesc,
                      minWidth: "160px",
                      maxWidth: "160px",
                    }}>
                    Description
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b text-right"
                    style={{
                      left: posAnnualBudget,
                      minWidth: "120px",
                      maxWidth: "120px",
                    }}>
                    Base Budget
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r-2 border-slate-300 dark:border-slate-600 border-b text-right text-brand-600 dark:text-brand-400"
                    style={{
                      left: posOutlook,
                      minWidth: "120px",
                      maxWidth: "120px",
                    }}>
                    Total Outlook
                  </th>

                  {/* Actuals Section */}
                  <th
                    colSpan={actualMonths.length}
                    className="py-2 px-6 text-center border-b border-r border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 font-extrabold text-slate-700 dark:text-slate-300">
                    ACTUALS
                  </th>

                  {/* Forecasts Section */}
                  <th
                    colSpan={forecastMonths.length}
                    className="py-2 px-6 text-center border-b border-brand-200 dark:border-brand-900/50 bg-brand-50/50 dark:bg-brand-900/20 font-extrabold text-brand-700 dark:text-brand-300">
                    FORECASTS
                  </th>
                </tr>
                <tr>
                  {/* Empty headers for sticky columns in second row */}
                  <th
                    className="sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{ left: posSelect }}></th>
                  <th
                    className="sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{ left: posCat }}></th>
                  <th
                    className="sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{ left: posGroup }}></th>
                  <th
                    className="sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{ left: posDesc }}></th>
                  <th
                    className="sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{ left: posAnnualBudget }}></th>
                  <th
                    className="sticky z-30 bg-slate-50 dark:bg-slate-900 border-r-2 border-slate-300 dark:border-slate-600 border-b"
                    style={{ left: posOutlook }}></th>

                  {/* Actual Months */}
                  {actualMonths.map((m) => (
                    <th
                      key={m}
                      className="py-2 px-4 text-right border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 min-w-[90px]">
                      {m}
                    </th>
                  ))}

                  {/* Forecast Months */}
                  {forecastMonths.map((m) => (
                    <th
                      key={m}
                      className="py-2 px-4 text-right border-b border-brand-100 dark:border-brand-900/30 bg-white dark:bg-slate-900 min-w-[90px] text-brand-600 dark:text-brand-400">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {processedData.map((cat, cIdx) => (
                  <React.Fragment key={cIdx}>
                    {cat.groups.map((group, gIdx) => (
                      <React.Fragment key={`${cIdx}-${gIdx}`}>
                        {group.ledgers.map((ledger, lIdx) => {
                          const isSelected = selectedLedgers.has(ledger.code);
                          const hasAdj = !!scenarioAdjustments[ledger.code];
                          const rowClass = `hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors ${isSelected ? "bg-amber-50 dark:bg-amber-900/10" : ""}`;

                          return (
                            <tr
                              key={ledger.code}
                              className={rowClass}>
                              <td
                                className="py-4 px-2 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 align-middle text-center cursor-pointer"
                                style={{
                                  left: posSelect,
                                  minWidth: "40px",
                                  maxWidth: "40px",
                                }}
                                onClick={() => toggleLedger(ledger.code)}>
                                {isSelected ?
                                  <CheckSquare
                                    size={14}
                                    className="mx-auto text-brand-500"
                                  />
                                : <Square
                                    size={14}
                                    className="mx-auto text-slate-300"
                                  />
                                }
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 align-top"
                                style={{
                                  left: posCat,
                                  minWidth: "100px",
                                  maxWidth: "100px",
                                }}>
                                {gIdx === 0 && lIdx === 0 && (
                                  <span
                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${cat.category === "Income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                    {cat.category}
                                  </span>
                                )}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 align-top"
                                style={{
                                  left: posGroup,
                                  minWidth: "160px",
                                  maxWidth: "160px",
                                }}>
                                {lIdx === 0 && (
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {group.name}
                                  </span>
                                )}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 truncate"
                                style={{
                                  left: posDesc,
                                  minWidth: "160px",
                                  maxWidth: "160px",
                                }}
                                title={ledger.desc}>
                                <div className="flex items-center gap-1.5">
                                  {ledger.desc}
                                  {hasAdj && (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"
                                      title="Scenario adjustment applied"
                                    />
                                  )}
                                </div>
                                <div className="text-[10px] font-mono font-medium text-slate-400 mt-0.5">
                                  {ledger.code}
                                </div>
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 text-right text-xs font-black text-slate-900 dark:text-white"
                                style={{
                                  left: posAnnualBudget,
                                  minWidth: "120px",
                                  maxWidth: "120px",
                                }}>
                                ₹{ledger.budget.toLocaleString()}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r-2 border-slate-200 dark:border-slate-700 text-right text-xs font-black text-brand-700 dark:text-brand-400"
                                style={{
                                  left: posOutlook,
                                  minWidth: "120px",
                                  maxWidth: "120px",
                                }}>
                                ₹{ledger.outlook.toLocaleString()}
                              </td>

                              {/* Actuals */}
                              {ledger.actuals.map((amount, aIdx) => {
                                const mLabel = actualMonths[aIdx];
                                const hasComment =
                                  !!comments[ledger.code]?.[mLabel];
                                const isFocused =
                                  focusedCell?.ledgerKey === ledger.code &&
                                  focusedCell?.monthKey === mLabel;

                                return (
                                  <td
                                    key={`act-${aIdx}`}
                                    onClick={() =>
                                      setFocusedCell({
                                        ledgerKey: ledger.code,
                                        monthKey: mLabel,
                                        ledgerName: ledger.desc,
                                        monthLabel: mLabel,
                                      })
                                    }
                                    className={`py-4 px-4 text-right text-xs font-medium cursor-pointer relative border-b border-slate-50 dark:border-slate-800 ${isFocused && showNotesDrawer ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700" : "text-slate-600 dark:text-slate-300"}`}>
                                    {amount > 0 ? amount.toLocaleString() : "-"}
                                    {hasComment && (
                                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500 pointer-events-none" />
                                    )}
                                  </td>
                                );
                              })}

                              {/* Forecasts */}
                              {ledger.forecasts.map((amount, fIdx) => {
                                const mLabel = forecastMonths[fIdx];
                                const hasComment =
                                  !!comments[ledger.code]?.[mLabel];
                                const isFocused =
                                  focusedCell?.ledgerKey === ledger.code &&
                                  focusedCell?.monthKey === mLabel;

                                return (
                                  <td
                                    key={`for-${fIdx}`}
                                    onClick={() =>
                                      setFocusedCell({
                                        ledgerKey: ledger.code,
                                        monthKey: mLabel,
                                        ledgerName: ledger.desc,
                                        monthLabel: mLabel,
                                      })
                                    }
                                    className={`py-4 px-4 text-right text-xs font-bold cursor-pointer relative border-b border-brand-50/50 dark:border-brand-900/20 ${
                                      isFocused && showNotesDrawer ?
                                        "bg-blue-50 dark:bg-blue-900/20 text-blue-700"
                                      : hasAdj ?
                                        "bg-amber-50/30 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                      : "bg-brand-50/10 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400"
                                    }`}>
                                    {amount > 0 ? amount.toLocaleString() : "-"}
                                    {hasComment && (
                                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500 pointer-events-none" />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer / Legend */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <div>
              * All figures in INR •{" "}
              <span className="text-brand-500">
                Prediction based on historic trend
              </span>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>{" "}
                Modified via Scenario
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Drawer for Notes */}
      {showNotesDrawer && (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col sticky top-4 h-[calc(100vh-140px)]">
          <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare
                size={16}
                className={`text-${themeColor}`}
              />
              Forecast Notes
            </h3>
            <button
              onClick={() => setShowNotesDrawer(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
            {!focusedCell ?
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-3">
                <AlignLeft
                  size={48}
                  className="text-slate-300 dark:text-slate-600"
                />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Click on any month's actual or forecast amount to view or add
                  a note.
                </p>
              </div>
            : <div
                key={`${focusedCell.ledgerKey}-${focusedCell.monthKey}`}
                className="flex flex-col h-full">
                <div className="mb-4">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                    Selected Cell
                  </span>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                    {focusedCell.ledgerName}
                  </div>
                  <div className={`text-sm font-black text-${themeColor} mt-1`}>
                    {focusedCell.monthLabel}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 p-4">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                      Assign Query
                    </label>
                    <div className="flex items-center gap-2 mb-3">
                      <select
                        value={
                          queryDrafts[
                            getFocusedCellKey(
                              focusedCell.ledgerKey,
                              focusedCell.monthKey,
                            )
                          ] ||
                          assignedQueries[
                            getFocusedCellKey(
                              focusedCell.ledgerKey,
                              focusedCell.monthKey,
                            )
                          ] ||
                          ""
                        }
                        onChange={(e) =>
                          handleQueryDraftChange(
                            focusedCell.ledgerKey,
                            focusedCell.monthKey,
                            e.target.value,
                          )
                        }
                        className="flex-1 px-3 py-3 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition">
                        <option value="">Select user</option>
                        {userOptions.map((userName) => (
                          <option
                            key={userName}
                            value={userName}>
                            {userName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssignQuery(
                            focusedCell.ledgerKey,
                            focusedCell.monthKey,
                          )
                        }
                        disabled={
                          !(
                            queryDrafts[
                              getFocusedCellKey(
                                focusedCell.ledgerKey,
                                focusedCell.monthKey,
                              )
                            ] ||
                            assignedQueries[
                              getFocusedCellKey(
                                focusedCell.ledgerKey,
                                focusedCell.monthKey,
                              )
                            ]
                          )
                        }
                        className="px-4 py-3 rounded-xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest shadow-sm transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Assign
                      </button>
                    </div>
                    {assignedQueries[
                      getFocusedCellKey(
                        focusedCell.ledgerKey,
                        focusedCell.monthKey,
                      )
                    ] && (
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Assigned to{" "}
                        <span className={`font-bold text-${themeColor}`}>
                          {
                            assignedQueries[
                              getFocusedCellKey(
                                focusedCell.ledgerKey,
                                focusedCell.monthKey,
                              )
                            ]
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                    Comment / Explanation
                  </label>
                  <textarea
                    value={
                      comments[focusedCell.ledgerKey]?.[focusedCell.monthKey] ||
                      ""
                    }
                    onChange={(e) =>
                      handleCommentChange(
                        focusedCell.ledgerKey,
                        focusedCell.monthKey,
                        e.target.value,
                      )
                    }
                    placeholder="Enter notes to explain this month's financials..."
                    className="w-full flex-1 min-h-[200px] p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>
            }
          </div>
        </div>
      )}
    </div>
  );
};
