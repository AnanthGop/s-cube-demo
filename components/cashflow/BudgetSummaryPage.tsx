import React, { useState } from "react";
import { ChevronLeft, MessageSquare, X, AlignLeft } from "lucide-react";

interface BudgetSummaryPageProps {
  themeColor: string;
  onBack?: () => void;
  users?: UserItem[];
}

interface UserItem {
  id?: number | string;
  name?: string;
  status?: string;
}

export const BudgetSummaryPage: React.FC<BudgetSummaryPageProps> = ({
  themeColor,
  onBack,
  users = [],
}) => {
  // Comments & Drawer State
  const [comments, setComments] = useState<
    Record<string, Record<string, string>>
  >({});
  const [assignedQueries, setAssignedQueries] = useState<
    Record<string, string>
  >({});
  const [queryDrafts, setQueryDrafts] = useState<Record<string, string>>({});
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{
    ledgerKey: string;
    monthKey: string;
    ledgerName: string;
    monthLabel: string;
  } | null>(null);

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

  const historyMonths = [
    "Mar 26",
    "Feb 26",
    "Jan 26",
    "Dec 25",
    "Nov 25",
    "Oct 25",
    "Sep 25",
    "Aug 25",
    "Jul 25",
    "Jun 25",
    "May 25",
    "Apr 25",
  ];

  const data = [
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
              monthly: [
                10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
                10000, 10000, 10000,
              ],
            },
            {
              code: "INC-002",
              desc: "Corporate CSR - Tata",
              budget: 300000,
              monthly: [0, 0, 100000, 0, 0, 0, 0, 0, 100000, 0, 0, 100000],
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
              monthly: [
                420, 410, 415, 400, 390, 395, 380, 375, 370, 365, 360, 355,
              ],
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
              monthly: [
                15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000,
                15000, 15000, 15000,
              ],
            },
            {
              code: "EXP-102",
              desc: "Consultant Fees",
              budget: 60000,
              monthly: [
                5000, 4000, 6000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
                5000, 5000,
              ],
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
              monthly: [
                3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500,
                3500, 3500,
              ],
            },
            {
              code: "EXP-202",
              desc: "Utilities (Power/Water)",
              budget: 12000,
              monthly: [
                950, 900, 850, 1100, 1050, 1000, 950, 900, 1200, 1150, 1000,
                950,
              ],
            },
            {
              code: "EXP-203",
              desc: "IT Infrastructure",
              budget: 25000,
              monthly: [
                2000, 1500, 1500, 2500, 1500, 1500, 3000, 1500, 1500, 2500,
                1500, 1500,
              ],
            },
          ],
        },
      ],
    },
    {
      category: "Assets",
      groups: [
        {
          name: "Fixed Assets",
          ledgers: [
            {
              code: "AST-001",
              desc: "Office Equipment",
              budget: 50000,
              monthly: [0, 5000, 0, 0, 12000, 0, 0, 0, 8000, 0, 0, 0],
            },
          ],
        },
      ],
    },
    {
      category: "Liabilities",
      groups: [
        {
          name: "Current Liabilities",
          ledgers: [
            {
              code: "LIA-001",
              desc: "Accounts Payable",
              budget: 0,
              monthly: [
                1200, 1100, 900, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800,
                700,
              ],
            },
          ],
        },
      ],
    },
  ];

  // Calculate total expenses and adjust income to be 28000 more
  React.useMemo(() => {
    const incomeCategory = data.find((cat) => cat.category === "Income");
    const expenditureCategory = data.find(
      (cat) => cat.category === "Expenditure",
    );

    if (incomeCategory && expenditureCategory) {
      // Calculate total expenditure budget
      let totalExpenses = 0;
      expenditureCategory.groups.forEach((group) => {
        group.ledgers.forEach((ledger) => {
          totalExpenses += ledger.budget;
        });
      });

      // Calculate total income budget
      let totalIncome = 0;
      incomeCategory.groups.forEach((group) => {
        group.ledgers.forEach((ledger) => {
          totalIncome += ledger.budget;
        });
      });

      // Calculate required income (expenses + 28000)
      const requiredIncome = totalExpenses + 28000;
      const adjustment = requiredIncome - totalIncome;

      // If adjustment is needed, add it to the first income ledger
      if (adjustment !== 0 && incomeCategory.groups[0]?.ledgers[0]) {
        const firstLedger = incomeCategory.groups[0].ledgers[0];
        firstLedger.budget += adjustment;

        // Distribute adjustment across monthly values proportionally
        const monthlyAdjustment = Math.round(adjustment / 12);
        firstLedger.monthly = firstLedger.monthly.map(
          (val) => val + monthlyAdjustment,
        );
      }
    }
  }, []);

  // Column Width Config
  const wCat = "100px";
  const wGroup = "160px";
  const wLedger = "100px";
  const wDesc = "160px";
  const wBudget = "120px";

  // Calculate left positions for sticky columns
  const posCat = "0px";
  const posGroup = "100px";
  const posLedger = "260px"; // 100 + 160
  const posDesc = "360px"; // 260 + 100
  const posAnnualBudget = "520px"; // 360 + 160
  const wYTDBudget = "120px";
  const posYTDBudget = "640px"; // 520 + 120

  // Helper to calculate variance color
  const getVarianceColor = (variance: number, category: string) => {
    // For Income: Positive variance (Actual > Budget) is good.
    // For Expenses/Liabilities: Negative variance (Actual < Budget) is good.
    const isIncome = category === "Income";

    // Variance = Actual - Budget
    // If Income and Var > 0 -> Good
    // If Expense and Var > 0 -> Bad (Overspend)

    if (variance === 0) return "text-slate-400";

    if (isIncome) {
      return variance > 0 ?
          "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";
    } else {
      return variance > 0 ?
          "text-rose-600 dark:text-rose-400"
        : "text-emerald-600 dark:text-emerald-400";
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex gap-4 items-start">
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-300 flex-1 w-full`}>
        {/* Ribbon Header */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white shrink-0`}>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Budget Summary
            </h2>
            <p className="text-white/70 text-xs font-medium mt-0.5">
              Annual budget vs Actuals hierarchy view (12 Months Rolling)
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
            <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition">
              📥 Export Report
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1 scrollbar-hide">
            <table className="w-full border-collapse text-left whitespace-nowrap min-w-max">
              <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                <tr>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{ left: posCat, minWidth: wCat, maxWidth: wCat }}>
                    Category
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{
                      left: posGroup,
                      minWidth: wGroup,
                      maxWidth: wGroup,
                    }}>
                    Group
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{
                      left: posLedger,
                      minWidth: wLedger,
                      maxWidth: wLedger,
                    }}>
                    Ledger #
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b"
                    style={{ left: posDesc, minWidth: wDesc, maxWidth: wDesc }}>
                    Description
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 border-b text-right"
                    style={{
                      left: posAnnualBudget,
                      minWidth: wBudget,
                      maxWidth: wBudget,
                    }}>
                    Annual Budget
                  </th>
                  <th
                    className="py-4 px-4 sticky z-30 bg-slate-50 dark:bg-slate-900 border-r-2 border-brand-500/30 border-b text-right"
                    style={{
                      left: posYTDBudget,
                      minWidth: wYTDBudget,
                      maxWidth: wYTDBudget,
                    }}>
                    YTD Budget
                  </th>

                  {/* YTD Column */}
                  <th className="py-4 px-6 text-right border-b border-slate-100 dark:border-slate-700 bg-brand-50/50 dark:bg-brand-900/20 min-w-[100px] text-brand-700 dark:text-brand-400 font-extrabold">
                    YTD Actuals
                  </th>

                  {/* Variance Columns */}
                  <th className="py-4 px-6 text-right border-b border-slate-100 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/80 min-w-[100px] border-r border-slate-200 dark:border-slate-700">
                    Variance
                  </th>
                  <th className="py-4 px-6 text-right border-b border-slate-100 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/80 min-w-[80px] border-r-2 border-slate-200 dark:border-slate-700">
                    Var %
                  </th>

                  {/* Remaining History Months */}
                  {historyMonths.map((m, i) => (
                    <th
                      key={i}
                      className="py-4 px-6 text-right border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 min-w-[100px]">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.map((cat, cIdx) => (
                  <React.Fragment key={cIdx}>
                    {cat.groups.map((group, gIdx) => (
                      <React.Fragment key={`${cIdx}-${gIdx}`}>
                        {group.ledgers.map((ledger, lIdx) => {
                          const isFirstInCat = gIdx === 0 && lIdx === 0;
                          const isFirstInGroup = lIdx === 0;
                          const rowClass =
                            "hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors group";

                          // Calculate YTD Actual
                          // Assuming the array represents the YTD months for this specific calculation
                          const ytdActual = ledger.monthly.reduce(
                            (sum, val) => sum + val,
                            0,
                          );

                          // Variance Calculation for YTD
                          const annualBudget = ledger.budget;
                          // In a real app this would be calculated based on the current month,
                          // but for this UI we'll simulate YTD budget as Annual / 12 * 9 (assuming 9 months passed YTD)
                          // or just base it off actual historical data. Using a simple 75% for visual demonstration:
                          const targetYTDBudget = annualBudget * 0.75;

                          // Variance = Actual - Budget (Standard definition, interpretation depends on Income/Expense)
                          const variance = ytdActual - targetYTDBudget;
                          const variancePercent =
                            targetYTDBudget !== 0 ?
                              (variance / targetYTDBudget) * 100
                            : 0;

                          return (
                            <tr
                              key={ledger.code}
                              className={rowClass}>
                              {/* Fixed Columns */}
                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 align-top"
                                style={{
                                  left: posCat,
                                  minWidth: wCat,
                                  maxWidth: wCat,
                                }}>
                                {isFirstInCat && (
                                  <span
                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest 
                                  ${
                                    cat.category === "Income" ?
                                      "bg-emerald-100 text-emerald-700"
                                    : cat.category === "Expenditure" ?
                                      "bg-rose-100 text-rose-700"
                                    : "bg-indigo-100 text-indigo-700"
                                  }`}>
                                    {cat.category}
                                  </span>
                                )}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 align-top"
                                style={{
                                  left: posGroup,
                                  minWidth: wGroup,
                                  maxWidth: wGroup,
                                }}>
                                {isFirstInGroup && (
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {group.name}
                                  </span>
                                )}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-400"
                                style={{
                                  left: posLedger,
                                  minWidth: wLedger,
                                  maxWidth: wLedger,
                                }}>
                                {ledger.code}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 truncate"
                                style={{
                                  left: posDesc,
                                  minWidth: wDesc,
                                  maxWidth: wDesc,
                                }}
                                title={ledger.desc}>
                                {ledger.desc}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 text-right text-xs font-black text-slate-900 dark:text-white"
                                style={{
                                  left: posAnnualBudget,
                                  minWidth: wBudget,
                                  maxWidth: wBudget,
                                }}>
                                ₹{annualBudget.toLocaleString()}
                              </td>

                              <td
                                className="py-4 px-4 sticky z-20 bg-white dark:bg-slate-800 border-r-2 border-brand-500/30 text-right text-xs font-black text-slate-900 dark:text-white"
                                style={{
                                  left: posYTDBudget,
                                  minWidth: wYTDBudget,
                                  maxWidth: wYTDBudget,
                                }}>
                                ₹{targetYTDBudget.toLocaleString()}
                              </td>

                              {/* YTD Actual */}
                              <td className="py-4 px-6 text-right text-xs font-black text-brand-700 dark:text-brand-400 border-b border-slate-50 dark:border-slate-800 bg-brand-50/30 dark:bg-brand-900/10">
                                {ytdActual > 0 ?
                                  ytdActual.toLocaleString()
                                : "-"}
                              </td>

                              {/* Variance Value */}
                              <td
                                className={`py-4 px-6 text-right text-xs font-bold border-b border-slate-50 dark:border-slate-800 border-r border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 ${getVarianceColor(
                                  variance,
                                  cat.category,
                                )}`}>
                                {variance > 0 ? "+" : ""}
                                {Math.round(variance).toLocaleString()}
                              </td>

                              {/* Variance % */}
                              <td
                                className={`py-4 px-6 text-right text-xs font-black border-b border-slate-50 dark:border-slate-800 border-r-2 border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 ${getVarianceColor(variance, cat.category)}`}>
                                {Math.abs(variancePercent) > 999 ?
                                  ">999%"
                                : `${variancePercent.toFixed(1)}%`}
                              </td>

                              {/* Scrolling History Month Columns */}
                              {ledger.monthly.map((amount, mIdx) => {
                                const currentMonthLabel = historyMonths[mIdx];
                                const hasComment =
                                  !!comments[ledger.code]?.[currentMonthLabel];
                                const isFocused =
                                  focusedCell?.ledgerKey === ledger.code &&
                                  focusedCell?.monthKey === currentMonthLabel;

                                return (
                                  <td
                                    key={mIdx}
                                    onClick={() => {
                                      setFocusedCell({
                                        ledgerKey: ledger.code,
                                        monthKey: currentMonthLabel,
                                        ledgerName: ledger.desc,
                                        monthLabel: currentMonthLabel,
                                      });
                                      if (!showNotesDrawer) {
                                        setShowNotesDrawer(true);
                                      }
                                    }}
                                    className={`relative py-4 px-6 text-right text-sm border-b border-slate-50 dark:border-slate-800 cursor-pointer transition ${
                                      isFocused ?
                                        "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                                    }`}>
                                    {amount > 0 ? amount.toLocaleString() : "-"}
                                    {hasComment && (
                                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm pointer-events-none" />
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
            <div>* All figures in INR • Variance vs Monthly Avg Budget</div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-brand-500/30"></div> Fixed Columns
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-200"></div> Analysis
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white border border-slate-200"></div>{" "}
                History
              </span>
            </div>
          </div>
        </div>
        {/* end flex-1 overflow-hidden */}
      </div>
      {/* end card */}

      {/* Side Drawer for Notes */}
      {showNotesDrawer && (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col sticky top-4 h-[calc(100vh-140px)] animate-in slide-in-from-right-4 duration-300">
          <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare
                size={16}
                className={`text-${themeColor}`}
              />
              Budget Notes
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
                  Click on any month's amount to view or add a note.
                </p>
              </div>
            : <div
                key={`${focusedCell.ledgerKey}-${focusedCell.monthKey}`}
                className="flex flex-col h-full animate-in fade-in duration-200">
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
                    placeholder="Enter notes to explain this month's budget variance..."
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
