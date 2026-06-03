import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, MessageSquare, X, AlignLeft } from "lucide-react";

interface UserItem {
  id?: number | string;
  name?: string;
  status?: string;
}

interface BudgetEntryPageProps {
  financialYear: any;
  budgetType: string;
  chartOfAccounts: any[];
  themeColor: string;
  onBack: () => void;
  selectedLocation?: string;
  payrollBudget?: any[];
  locationsList?: any[];
  users?: UserItem[];
}

export const BudgetEntryPage: React.FC<BudgetEntryPageProps> = ({
  financialYear,
  budgetType,
  chartOfAccounts,
  themeColor,
  onBack,
  selectedLocation,
  payrollBudget,
  locationsList,
  users = [],
}) => {
  const [budgetData, setBudgetData] = useState<
    Record<string, Record<string, number>>
  >({});
  const [totalBudgets, setTotalBudgets] = useState<Record<string, number>>({});
  const [budgetTypes, setBudgetTypes] = useState<Record<string, string>>({});
  const [selectedMonths, setSelectedMonths] = useState<
    Record<string, string[]>
  >({});
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [currentLedgerKey, setCurrentLedgerKey] = useState<string>("");
  const [currentBudgetType, setCurrentBudgetType] = useState<string>("");
  const [tempSelectedMonths, setTempSelectedMonths] = useState<string[]>([]);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [comments, setComments] = useState<
    Record<string, Record<string, string>>
  >({});
  const [assignedQueries, setAssignedQueries] = useState<
    Record<string, string>
  >({});
  const [queryDrafts, setQueryDrafts] = useState<Record<string, string>>({});
  const [focusedCell, setFocusedCell] = useState<{
    ledgerKey: string;
    monthKey: string;
    ledgerName: string;
    monthLabel: string;
  } | null>(null);

  // Generate months from financial year
  const months = useMemo(() => {
    if (!financialYear) return [];

    const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split("/");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };

    const startDate = parseDate(financialYear.startDate);
    const endDate = parseDate(financialYear.endDate);

    const monthsList = [];
    let currentDate = new Date(startDate);

    // Month names array properly indexed (0=Jan, 1=Feb, ..., 11=Dec)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    while (currentDate <= endDate) {
      const monthIndex = currentDate.getMonth();
      const year = currentDate.getFullYear().toString().slice(-2);
      monthsList.push({
        label: `${monthNames[monthIndex]} ${year}`,
        key: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthsList;
  }, [financialYear]);

  // Filter Income and Expenditure accounts
  const incomeAndExpense = useMemo(() => {
    return chartOfAccounts.filter(
      (master) => master.master === "Income" || master.master === "Expenditure",
    );
  }, [chartOfAccounts]);

  // Auto-populate salary data for location budgets
  useEffect(() => {
    if (
      budgetType === "location" &&
      selectedLocation &&
      payrollBudget &&
      financialYear &&
      months.length > 0
    ) {
      // Extract location name (before the " - " if present)
      const locationName =
        selectedLocation.includes(" - ") ?
          selectedLocation.split(" - ")[0].trim()
        : selectedLocation;

      // Get payroll data for this financial year (try different name formats)
      let fyPayrollData = payrollBudget.find(
        (d: any) => d.financialYear === financialYear.name,
      );

      // If not found, try without "FY " prefix or with it
      if (!fyPayrollData) {
        const fyName = financialYear.name.replace("FY ", "");
        fyPayrollData = payrollBudget.find(
          (d: any) =>
            d.financialYear === fyName ||
            d.financialYear === `FY ${fyName}` ||
            d.financialYear === financialYear.name.replace("FY ", ""),
        );
      }

      if (!fyPayrollData || !fyPayrollData.employees) {
        return;
      }

      // Filter employees for the selected location
      const locationEmployees = fyPayrollData.employees.filter((emp: any) => {
        const empLocationName =
          emp.location?.includes(" - ") ?
            emp.location.split(" - ")[0].trim()
          : emp.location;
        return empLocationName === locationName;
      });

      if (locationEmployees.length === 0) {
        return;
      }

      // Find salary-related ledgers (Base Salary, Personnel Costs, etc.)
      const salaryLedgers: Array<{
        ledgerKey: string;
        isBaseSalary: boolean;
      }> = [];

      incomeAndExpense.forEach((master) => {
        if (master.master === "Expenditure") {
          master.groups.forEach((group: any) => {
            const groupNameLower = group.name.toLowerCase();
            // Check if this is a personnel/salary related group
            if (
              groupNameLower.includes("personnel") ||
              groupNameLower.includes("salary") ||
              groupNameLower.includes("staff")
            ) {
              group.ledgers.forEach((ledger: string) => {
                const ledgerLower = ledger.toLowerCase();
                // Check if this is a salary-related ledger
                if (
                  ledgerLower.includes("salary") ||
                  ledgerLower.includes("personnel") ||
                  ledgerLower.includes("staff cost")
                ) {
                  const ledgerKey = `${master.master}-${group.name}-${ledger}`;
                  const isBaseSalary =
                    ledgerLower.includes("base") ||
                    ledgerLower === "salary" ||
                    ledgerLower.includes("gross");
                  salaryLedgers.push({ ledgerKey, isBaseSalary });
                }
              });
            }
          });
        }
      });

      // Calculate monthly salaries for each employee
      salaryLedgers.forEach(({ ledgerKey, isBaseSalary }) => {
        const monthData: Record<string, number> = {};

        months.forEach((month) => {
          let monthTotal = 0;
          locationEmployees.forEach((emp: any) => {
            // Check if increment applies to this month
            const empSalary =
              emp.incrementMonth && month.key >= emp.incrementMonth ?
                emp.newSalary || emp.currentGrossSalary
              : emp.currentGrossSalary;
            monthTotal += empSalary || 0;
          });
          monthData[month.key] = monthTotal;
        });

        // Calculate average monthly salary
        const totalSalaryAcrossMonths = Object.values(monthData).reduce(
          (sum, val) => sum + val,
          0,
        );
        const averageMonthlySalary =
          months.length > 0 ? totalSalaryAcrossMonths / months.length : 0;

        // Only set total budget - let user select budget type
        setTotalBudgets((prev) => ({
          ...prev,
          [ledgerKey]: Math.round(averageMonthlySalary * 100) / 100,
        }));
      });
    }
  }, [
    budgetType,
    selectedLocation,
    payrollBudget,
    financialYear,
    incomeAndExpense,
    months,
  ]);

  const handleBudgetChange = (
    ledgerKey: string,
    monthKey: string,
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    setBudgetData((prev) => ({
      ...prev,
      [ledgerKey]: {
        ...(prev[ledgerKey] || {}),
        [monthKey]: numValue,
      },
    }));
  };

  const handleTotalBudgetChange = (ledgerKey: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTotalBudgets((prev) => ({
      ...prev,
      [ledgerKey]: numValue,
    }));

    // If budget type is already selected, auto-populate
    const currentBudgetType = budgetTypes[ledgerKey];
    if (currentBudgetType) {
      const selectedMonthKeys = selectedMonths[ledgerKey] || [];
      distributeBudget(
        ledgerKey,
        numValue,
        currentBudgetType,
        selectedMonthKeys,
      );
    }
  };

  const handleBudgetTypeChange = (ledgerKey: string, type: string) => {
    // For certain types, show month selector popup
    if (
      [
        "quarterly-replicate",
        "quarterly-split",
        "half-yearly-replicate",
        "half-yearly-split",
        "annual",
        "random",
      ].includes(type)
    ) {
      setCurrentLedgerKey(ledgerKey);
      setCurrentBudgetType(type);
      setTempSelectedMonths(selectedMonths[ledgerKey] || []);
      setShowMonthSelector(true);
    } else {
      // For monthly types, apply directly
      setBudgetTypes((prev) => ({
        ...prev,
        [ledgerKey]: type,
      }));

      const totalBudget = totalBudgets[ledgerKey] || 0;
      if (totalBudget > 0) {
        distributeBudget(ledgerKey, totalBudget, type, []);
      }
    }
  };

  const handleCommentChange = (
    ledgerKey: string,
    monthKey: string,
    value: string,
  ) => {
    setComments((prev) => ({
      ...prev,
      [ledgerKey]: {
        ...prev[ledgerKey],
        [monthKey]: value,
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

  const handleMonthSelection = (monthKey: string) => {
    const type = currentBudgetType;
    let newSelection = [...tempSelectedMonths];

    if (type === "quarterly-replicate" || type === "quarterly-split") {
      // Find the month index
      const monthIndex = months.findIndex((m) => m.key === monthKey);
      if (monthIndex !== -1) {
        // Check if this month is already selected
        const isSelected = newSelection.includes(monthKey);

        if (isSelected) {
          // Deselect this month and subsequent quarterly months (every 3rd month)
          const quarterlyMonths = [
            months[monthIndex]?.key,
            months[(monthIndex + 3) % 12]?.key,
            months[(monthIndex + 6) % 12]?.key,
            months[(monthIndex + 9) % 12]?.key,
          ].filter(Boolean);
          newSelection = newSelection.filter(
            (m) => !quarterlyMonths.includes(m),
          );
        } else {
          // Select this month and every 3rd month (quarterly: Apr, Jul, Oct, Jan)
          const quarterlyMonths = [
            months[monthIndex]?.key,
            months[(monthIndex + 3) % 12]?.key,
            months[(monthIndex + 6) % 12]?.key,
            months[(monthIndex + 9) % 12]?.key,
          ].filter(Boolean);
          newSelection = [...newSelection, ...quarterlyMonths];
        }
      }
    } else if (
      type === "half-yearly-replicate" ||
      type === "half-yearly-split"
    ) {
      // Find the month index
      const monthIndex = months.findIndex((m) => m.key === monthKey);
      if (monthIndex !== -1) {
        const isSelected = newSelection.includes(monthKey);

        if (isSelected) {
          // Deselect this month and the month 6 months later
          const halfYearlyMonths = [
            months[monthIndex]?.key,
            months[(monthIndex + 6) % 12]?.key,
          ].filter(Boolean);
          newSelection = newSelection.filter(
            (m) => !halfYearlyMonths.includes(m),
          );
        } else {
          // Select this month and the month 6 months later (half-yearly: e.g., Sep, Mar)
          const halfYearlyMonths = [
            months[monthIndex]?.key,
            months[(monthIndex + 6) % 12]?.key,
          ].filter(Boolean);
          newSelection = [...newSelection, ...halfYearlyMonths];
        }
      }
    } else {
      // For annual and random, toggle individual months
      if (newSelection.includes(monthKey)) {
        newSelection = newSelection.filter((m) => m !== monthKey);
      } else {
        newSelection = [...newSelection, monthKey];
      }
    }

    setTempSelectedMonths(newSelection);
  };

  const confirmMonthSelection = () => {
    setBudgetTypes((prev) => ({
      ...prev,
      [currentLedgerKey]: currentBudgetType,
    }));

    setSelectedMonths((prev) => ({
      ...prev,
      [currentLedgerKey]: tempSelectedMonths,
    }));

    const totalBudget = totalBudgets[currentLedgerKey] || 0;
    if (totalBudget > 0) {
      distributeBudget(
        currentLedgerKey,
        totalBudget,
        currentBudgetType,
        tempSelectedMonths,
      );
    }

    setShowMonthSelector(false);
    setCurrentLedgerKey("");
    setCurrentBudgetType("");
    setTempSelectedMonths([]);
  };

  const cancelMonthSelection = () => {
    setShowMonthSelector(false);
    setCurrentLedgerKey("");
    setCurrentBudgetType("");
    setTempSelectedMonths([]);
  };

  const distributeBudget = (
    ledgerKey: string,
    totalBudget: number,
    type: string,
    selectedMonthKeys: string[],
  ) => {
    const newMonthData: Record<string, number> = {};

    switch (type) {
      case "monthly-replicate":
        // Replicate the same amount to all 12 months
        months.forEach((month) => {
          newMonthData[month.key] = totalBudget;
        });
        break;

      case "monthly-split":
        // Split the total amount across 12 months
        const perMonth = Math.floor((totalBudget / 12) * 100) / 100;
        let remainingAmount = totalBudget;

        months.forEach((month, index) => {
          if (index === months.length - 1) {
            // Last month gets the remainder to handle rounding
            newMonthData[month.key] = Math.round(remainingAmount * 100) / 100;
          } else {
            newMonthData[month.key] = perMonth;
            remainingAmount -= perMonth;
          }
        });
        break;

      case "quarterly-replicate":
        // Put full amount in each selected quarter month
        months.forEach((month) => {
          newMonthData[month.key] =
            selectedMonthKeys.includes(month.key) ? totalBudget : 0;
        });
        break;

      case "quarterly-split":
        // Split total amount across selected quarter months (typically 4)
        if (selectedMonthKeys.length > 0) {
          const perMonth =
            Math.floor((totalBudget / selectedMonthKeys.length) * 100) / 100;
          let remainingAmount = totalBudget;

          selectedMonthKeys.forEach((key, index) => {
            if (index === selectedMonthKeys.length - 1) {
              // Last month gets the remainder to handle rounding
              newMonthData[key] = Math.round(remainingAmount * 100) / 100;
            } else {
              newMonthData[key] = perMonth;
              remainingAmount -= perMonth;
            }
          });

          // Fill in zeros for non-selected months
          months.forEach((month) => {
            if (!selectedMonthKeys.includes(month.key)) {
              newMonthData[month.key] = 0;
            }
          });
        } else {
          months.forEach((month) => {
            newMonthData[month.key] = 0;
          });
        }
        break;

      case "half-yearly-replicate":
        // Put full amount in each selected half-year month
        months.forEach((month) => {
          newMonthData[month.key] =
            selectedMonthKeys.includes(month.key) ? totalBudget : 0;
        });
        break;

      case "half-yearly-split":
        // Split total amount across selected half-year months (typically 2)
        if (selectedMonthKeys.length > 0) {
          const perMonth =
            Math.floor((totalBudget / selectedMonthKeys.length) * 100) / 100;
          let remainingAmount = totalBudget;

          selectedMonthKeys.forEach((key, index) => {
            if (index === selectedMonthKeys.length - 1) {
              // Last month gets the remainder to handle rounding
              newMonthData[key] = Math.round(remainingAmount * 100) / 100;
            } else {
              newMonthData[key] = perMonth;
              remainingAmount -= perMonth;
            }
          });

          // Fill in zeros for non-selected months
          months.forEach((month) => {
            if (!selectedMonthKeys.includes(month.key)) {
              newMonthData[month.key] = 0;
            }
          });
        } else {
          months.forEach((month) => {
            newMonthData[month.key] = 0;
          });
        }
        break;

      case "annual":
        // Put full amount in selected month(s) only
        months.forEach((month) => {
          newMonthData[month.key] =
            selectedMonthKeys.includes(month.key) ? totalBudget : 0;
        });
        break;

      case "random":
        // Split amount across randomly selected months
        if (selectedMonthKeys.length > 0) {
          const perMonth =
            Math.floor((totalBudget / selectedMonthKeys.length) * 100) / 100;
          let remainingAmount = totalBudget;

          selectedMonthKeys.forEach((key, index) => {
            if (index === selectedMonthKeys.length - 1) {
              // Last month gets the remainder to handle rounding
              newMonthData[key] = Math.round(remainingAmount * 100) / 100;
            } else {
              newMonthData[key] = perMonth;
              remainingAmount -= perMonth;
            }
          });

          // Fill in zeros for non-selected months
          months.forEach((month) => {
            if (!selectedMonthKeys.includes(month.key)) {
              newMonthData[month.key] = 0;
            }
          });
        } else {
          months.forEach((month) => {
            newMonthData[month.key] = 0;
          });
        }
        break;
    }

    setBudgetData((prev) => ({
      ...prev,
      [ledgerKey]: newMonthData,
    }));
  };

  const getLedgerTotal = (ledgerKey: string): number => {
    const ledgerData = budgetData[ledgerKey] || {};
    const values = Object.values(ledgerData);
    let total = 0;
    for (const val of values) {
      total += val as number;
    }
    return total;
  };

  const getMonthTotal = (monthKey: string) => {
    let total = 0;
    Object.values(budgetData).forEach((ledgerData) => {
      total += (ledgerData[monthKey] as number) || 0;
    });
    return total;
  };

  const getGrandTotal = (): number => {
    let grandTotal = 0;
    Object.values(budgetData).forEach((ledgerData) => {
      Object.values(ledgerData).forEach((val) => {
        grandTotal += val as number;
      });
    });
    return grandTotal;
  };

  const getBudgetTypeLabel = (type: string) => {
    switch (type) {
      case "organisation":
        return "Organisation Budget";
      case "grantor":
        return "Grantor Budget";
      case "region":
        return "Region Budget";
      case "location":
        if (selectedLocation && locationsList) {
          const location = locationsList.find(
            (loc) => loc.name === selectedLocation,
          );
          if (location) {
            return `${location.name} - ${location.city}`;
          }
        }
        return "Location Budget";
      default:
        return "Budget";
    }
  };

  const budgetTypeLabel = getBudgetTypeLabel(budgetType);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex gap-4 items-start">
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-300 flex-1 w-full`}>
        {/* Ribbon Header */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="opacity-70 hover:opacity-100 transition p-1 rounded-lg hover:bg-white/10">
              <ChevronLeft size={22} />
            </button>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Budget Entry — {budgetTypeLabel}
              </h2>
              <p className="text-white/70 text-xs font-medium mt-0.5">
                FY {financialYear?.name} • Enter monthly budget allocations
              </p>
            </div>
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
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition border border-white/30 backdrop-blur-sm">
              📋 Copy Previous Year Budget
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition">
              📥 Save Budget
            </button>
          </div>
        </div>

        {/* Budget Entry Table */}
        <div className="overflow-auto flex-1 scrollbar-hide">
          <table className="w-full border-collapse text-left whitespace-nowrap min-w-max">
            <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 shadow-sm">
              <tr>
                <th
                  className="py-4 px-3 border-b border-r-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky left-0 z-40"
                  style={{ minWidth: "85px" }}>
                  Master
                </th>
                <th
                  className="py-4 px-3 border-b border-r-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky left-[85px] z-40"
                  style={{ minWidth: "150px" }}>
                  Group
                </th>
                <th
                  className="py-4 px-4 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky left-[235px] z-40"
                  style={{ minWidth: "170px" }}>
                  Ledger Account
                </th>
                <th
                  className="py-4 px-4 border-b border-r border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900 text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider sticky left-[405px] z-40"
                  style={{ minWidth: "130px" }}>
                  Total Budget
                </th>
                <th
                  className="py-4 px-4 border-b border-r-2 border-slate-200 dark:border-slate-700 bg-purple-50 dark:bg-purple-900 text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider sticky left-[535px] z-40"
                  style={{ minWidth: "140px" }}>
                  Budget Type
                </th>
                {months.map((month, idx) => (
                  <th
                    key={month.key}
                    className="py-4 px-4 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    style={{ minWidth: "120px" }}>
                    {month.label}
                  </th>
                ))}
                <th
                  className="py-4 px-6 text-right border-b border-l-2 border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider sticky right-0 z-40"
                  style={{ minWidth: "140px" }}>
                  Row Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {incomeAndExpense.map((master, mIdx) => (
                <React.Fragment key={master.master}>
                  {master.groups.map((group: any, gIdx: number) => (
                    <React.Fragment key={`${master.master}-${gIdx}`}>
                      {group.ledgers.map((ledger: string, lIdx: number) => {
                        const isFirstInMaster = gIdx === 0 && lIdx === 0;
                        const isFirstInGroup = lIdx === 0;
                        const ledgerKey = `${master.master}-${group.name}-${ledger}`;
                        const rowSpanMaster = master.groups.reduce(
                          (sum: number, g: any) => sum + g.ledgers.length,
                          0,
                        );
                        const rowSpanGroup = group.ledgers.length;

                        return (
                          <tr
                            key={ledgerKey}
                            className="hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors">
                            {/* Master Column (with rowspan) */}
                            {isFirstInMaster && (
                              <td
                                rowSpan={rowSpanMaster}
                                className="py-4 px-3 border-r-2 border-slate-200 dark:border-slate-700 align-top sticky left-0 z-20 bg-white dark:bg-slate-800">
                                <span
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                                    master.master === "Income" ?
                                      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                    : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                  }`}>
                                  {master.master}
                                </span>
                              </td>
                            )}

                            {/* Group Column (with rowspan) */}
                            {isFirstInGroup && (
                              <td
                                rowSpan={rowSpanGroup}
                                className="py-4 px-3 border-r-2 border-slate-200 dark:border-slate-700 align-top sticky left-[85px] z-20 bg-white dark:bg-slate-800">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                  {group.name}
                                </span>
                              </td>
                            )}

                            {/* Ledger Column */}
                            <td className="py-4 px-4 border-r border-slate-200 dark:border-slate-700 sticky left-[235px] z-20 bg-white dark:bg-slate-800">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                {ledger}
                              </span>
                            </td>

                            {/* Total Budget Column */}
                            <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 sticky left-[405px] z-20 bg-blue-50 dark:bg-blue-900">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={totalBudgets[ledgerKey] || ""}
                                onChange={(e) =>
                                  handleTotalBudgetChange(
                                    ledgerKey,
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="0.00"
                              />
                            </td>

                            {/* Budget Type Column */}
                            <td className="py-2 px-2 border-r-2 border-slate-200 dark:border-slate-700 sticky left-[535px] z-20 bg-purple-50 dark:bg-purple-900">
                              <div className="flex items-center gap-1">
                                <select
                                  value={budgetTypes[ledgerKey] || ""}
                                  onChange={(e) =>
                                    handleBudgetTypeChange(
                                      ledgerKey,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition">
                                  <option value="">Select...</option>
                                  <option value="monthly-replicate">
                                    Monthly Replicate
                                  </option>
                                  <option value="monthly-split">
                                    Monthly Split
                                  </option>
                                  <option value="quarterly-replicate">
                                    Quarterly Replicate
                                  </option>
                                  <option value="quarterly-split">
                                    Quarterly Split
                                  </option>
                                  <option value="half-yearly-replicate">
                                    Half Yearly Replicate
                                  </option>
                                  <option value="half-yearly-split">
                                    Half Yearly Split
                                  </option>
                                  <option value="annual">Annual</option>
                                  <option value="random">Random</option>
                                </select>
                                {budgetTypes[ledgerKey] &&
                                  [
                                    "quarterly-replicate",
                                    "quarterly-split",
                                    "half-yearly-replicate",
                                    "half-yearly-split",
                                    "annual",
                                    "random",
                                  ].includes(budgetTypes[ledgerKey]) && (
                                    <button
                                      onClick={() => {
                                        setCurrentLedgerKey(ledgerKey);
                                        setCurrentBudgetType(
                                          budgetTypes[ledgerKey],
                                        );
                                        setTempSelectedMonths(
                                          selectedMonths[ledgerKey] || [],
                                        );
                                        setShowMonthSelector(true);
                                      }}
                                      className="px-2 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs transition"
                                      title="Edit month selection">
                                      📅
                                    </button>
                                  )}
                              </div>
                            </td>

                            {/* Month Input Columns */}
                            {months.map((month) => {
                              const hasComment =
                                !!comments[ledgerKey]?.[month.key];
                              const isFocused =
                                focusedCell?.ledgerKey === ledgerKey &&
                                focusedCell?.monthKey === month.key;

                              return (
                                <td
                                  key={`${ledgerKey}-${month.key}`}
                                  className="py-2 px-2 text-center border-slate-100 dark:border-slate-800 relative">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      budgetData[ledgerKey]?.[month.key] || ""
                                    }
                                    onChange={(e) =>
                                      handleBudgetChange(
                                        ledgerKey,
                                        month.key,
                                        e.target.value,
                                      )
                                    }
                                    onFocus={() => {
                                      setFocusedCell({
                                        ledgerKey,
                                        monthKey: month.key,
                                        ledgerName: ledger,
                                        monthLabel: month.label,
                                      });
                                    }}
                                    className={`w-full px-3 py-2 text-right border rounded-lg text-xs font-mono outline-none transition ${
                                      isFocused && showNotesDrawer ?
                                        "ring-2 border-transparent bg-blue-50/50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-100 ring-blue-500"
                                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700 dark:text-slate-200"
                                    }`}
                                    placeholder="0"
                                  />
                                  {hasComment && (
                                    <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm pointer-events-none" />
                                  )}
                                </td>
                              );
                            })}

                            {/* Total Column */}
                            <td className="py-4 px-6 text-right border-l-2 border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900 sticky right-0 z-20">
                              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                                ₹
                                {getLedgerTotal(ledgerKey)
                                  .toFixed(2)
                                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}

              {/* Monthly Totals Row */}
              <tr className="bg-slate-100 dark:bg-slate-900 font-black">
                <td
                  colSpan={5}
                  className="py-4 px-6 text-right border-r-2 border-t-2 border-slate-300 dark:border-slate-600 sticky left-0 z-20 bg-slate-100 dark:bg-slate-900">
                  <span className="text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Monthly Totals
                  </span>
                </td>
                {months.map((month) => (
                  <td
                    key={`total-${month.key}`}
                    className="py-4 px-4 text-center border-t-2 border-slate-300 dark:border-slate-600">
                    <span className="text-sm font-black text-brand-600 dark:text-brand-400 font-mono">
                      ₹
                      {getMonthTotal(month.key)
                        .toFixed(2)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </span>
                  </td>
                ))}
                <td className="py-4 px-6 text-right border-l-2 border-t-2 border-slate-300 dark:border-slate-600 bg-brand-100 dark:bg-brand-900 sticky right-0 z-20">
                  <span className="text-base font-black text-brand-700 dark:text-brand-400 font-mono">
                    ₹
                    {getGrandTotal()
                      .toFixed(2)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
          <div>
            * All amounts in INR • Monthly: all months • Quarterly: every 3rd
            month • Half-yearly: every 6th month
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700"></div>{" "}
              Fixed Columns
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-100 dark:bg-blue-900/30"></div>{" "}
              Total Budget
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-100 dark:bg-purple-900/30"></div>{" "}
              Budget Type
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-100 dark:bg-emerald-900/30"></div>{" "}
              Totals
            </span>
          </div>
        </div>
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
                  Click on any month's budget cell to view or add a note.
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
                  {budgetType === "location" && (
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
                  )}
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                    Comment / Justification
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
                    placeholder="Enter notes to justify this budget amount..."
                    className="w-full flex-1 min-h-[200px] p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>
            }
          </div>
        </div>
      )}

      {/* Month Selector Modal */}
      {showMonthSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
              Select Months for{" "}
              {currentBudgetType === "quarterly" ?
                "Quarterly"
              : currentBudgetType === "half-yearly" ?
                "Half Yearly"
              : currentBudgetType === "annual" ?
                "Annual"
              : "Random"}{" "}
              Budget
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {currentBudgetType === "quarterly" &&
                "Click on the first month to select all quarterly months (e.g., Apr → Jul → Oct → Jan)"}
              {currentBudgetType === "half-yearly" &&
                "Click on the first month to select both half-yearly months (e.g., Sep → Mar)"}
              {currentBudgetType === "annual" &&
                "Select the month where the annual budget should appear"}
              {currentBudgetType === "random" &&
                "Select any months where the budget should appear"}
            </p>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {months.map((month) => {
                const isSelected = tempSelectedMonths.includes(month.key);
                return (
                  <button
                    key={month.key}
                    onClick={() => handleMonthSelection(month.key)}
                    className={`px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                      isSelected ?
                        "bg-brand-600 text-white shadow-lg transform scale-105"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}>
                    {month.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelMonthSelection}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                Cancel
              </button>
              <button
                onClick={confirmMonthSelection}
                className={`px-6 py-2.5 bg-${themeColor} text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
