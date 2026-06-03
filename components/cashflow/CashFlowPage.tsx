import React, { useState, useMemo } from "react";
import { ExpenseVoucherDrawer } from "./ExpenseVoucherDrawer";
import {
  buildConsultantCashFlowTransactions,
  buildRentCashFlowTransactions,
  buildTravelCashFlowTransactions,
  parseCashFlowDate,
} from "./cashFlowVoucherUtils";

interface Transaction {
  id: string;
  date: string;
  ref: string;
  description: string;
  amount: number;
}

interface Category {
  id: string;
  name: string;
  transactions: Transaction[];
}

interface CashFlowData {
  income: { categories: Category[] };
  expenses: { categories: Category[] };
}

// Minimal shapes for incoming voucher/record data
interface MonthlyVoucherDetail {
  monthKey: string;
  monthLabel: string;
  amount: number;
  tdsAmount?: number;
  netAmount?: number;
  expenseVoucherCreated?: string;
  expenseVoucherNo?: string;
}
interface ConsultantSummary {
  consultantName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}
interface ConsultantSnapshot {
  financialYearId: string;
  consultants: ConsultantSummary[];
}
interface LandlordSummary {
  landlordName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}
interface RentSnapshot {
  financialYearId: string;
  landlords: LandlordSummary[];
}
interface TravelRecord {
  id: string;
  travellerName?: string;
  projectName?: string;
  travelStartDate?: string;
  travelAmount?: number;
  lodgingCost?: number;
  localConveyance?: number;
  perDiemAmount?: number;
  expenseVoucherCreated?: string;
}

interface TravelEmployeeSummary {
  employeeName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}

interface TravelSnapshot {
  financialYearId: string;
  employees: TravelEmployeeSummary[];
}

interface TravelExpense {
  expId: string;
  reqId: string;
  submittedOn?: string; // YYYY-MM-DD
  travellerName?: string;
  projectName?: string;
  actualTicketCost?: number;
  actualLodgingCost?: number;
  actualLocalConveyance?: number;
  reqPerDiemAmount?: number;
}

interface ConsultantRecord {
  id: string;
  vendorName: string;
  [key: string]: any;
}

interface RentRecord {
  id: string;
  landlordName: string;
  [key: string]: any;
}

interface CashFlowPageProps {
  themeColor: string;
  consultantVouchers?: ConsultantSnapshot[];
  rentVouchers?: RentSnapshot[];
  travelVouchers?: TravelSnapshot[];
  travelRecords?: TravelRecord[];
  travelExpenses?: TravelExpense[];
  consultantRecords?: ConsultantRecord[];
  rentRecords?: RentRecord[];
}

/** True if a YYYY-MM-DD date string falls within [from, to] */
const isoDateInRange = (iso: string, from: Date, to: Date): boolean => {
  const [yyyy, mm, dd] = iso.split("-");
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return false;
  return d >= from && d <= to;
};

const buildTravelRef = (type: "EV" | "PDV", id: string) => {
  const clean = String(id || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
  return `${type}-${clean || "NA"}`;
};

export const CashFlowPage: React.FC<CashFlowPageProps> = ({
  themeColor,
  consultantVouchers = [],
  rentVouchers = [],
  travelVouchers = [],
  travelRecords = [],
  travelExpenses = [],
  consultantRecords = [],
  rentRecords = [],
}) => {
  const [dateFrom, setDateFrom] = useState("01/04/2026");
  const [dateTo, setDateTo] = useState("30/06/2026");
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["income", "expenses"]),
  );
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  // ── Derive expense transactions from live voucher data filtered to date range ──
  const rangeFrom = useMemo(() => parseCashFlowDate(dateFrom), [dateFrom]);
  const rangeTo = useMemo(() => parseCashFlowDate(dateTo), [dateTo]);

  const consultantTransactions = useMemo<Transaction[]>(() => {
    if (!rangeFrom || !rangeTo) return [];
    return buildConsultantCashFlowTransactions(
      consultantVouchers,
      rangeFrom,
      rangeTo,
    );
  }, [consultantVouchers, rangeFrom, rangeTo]);

  const travelTransactions = useMemo<Transaction[]>(() => {
    if (!rangeFrom || !rangeTo) return [];
    if (travelVouchers.length > 0) {
      return buildTravelCashFlowTransactions(
        travelVouchers,
        rangeFrom,
        rangeTo,
      );
    }
    // Build a fast lookup of expense records by reqId
    const expByReqId = new Map<string, TravelExpense>();
    for (const exp of travelExpenses) {
      if (exp.reqId) expByReqId.set(exp.reqId, exp);
    }
    const out: Transaction[] = [];
    for (const rec of travelRecords) {
      if (rec.expenseVoucherCreated !== "Y") continue;
      // Find the matching expense record – prefer submittedOn for date scoping
      const exp = expByReqId.get(rec.id);
      const filterDate = exp?.submittedOn || rec.travelStartDate || "";
      if (filterDate && !isoDateInRange(filterDate, rangeFrom, rangeTo))
        continue;
      const displayDate =
        filterDate ? filterDate.split("-").reverse().join("/") : "";
      // Use actual amounts from expense record if available, else fall back to record
      const travelAmt =
        exp ?
          (exp.actualTicketCost || 0) +
          (exp.actualLodgingCost || 0) +
          (exp.actualLocalConveyance || 0)
        : (rec.travelAmount || 0) +
          (rec.lodgingCost || 0) +
          (rec.localConveyance || 0);
      const perDiem = exp ? exp.reqPerDiemAmount || 0 : rec.perDiemAmount || 0;
      const traveller = exp?.travellerName || rec.travellerName || "—";
      const project = exp?.projectName || rec.projectName || "—";
      if (travelAmt > 0) {
        const ref = buildTravelRef("EV", rec.id);
        out.push({
          id: ref,
          date: displayDate,
          ref,
          description: `Travel Expenses – ${traveller} (${project})`,
          amount: travelAmt,
        });
      }
      if (perDiem > 0) {
        const ref = buildTravelRef("PDV", rec.id);
        out.push({
          id: ref,
          date: displayDate,
          ref,
          description: `Per Diem – ${traveller} (${project})`,
          amount: perDiem,
        });
      }
    }
    return out;
  }, [travelVouchers, travelRecords, travelExpenses, rangeFrom, rangeTo]);

  const rentTransactions = useMemo<Transaction[]>(() => {
    if (!rangeFrom || !rangeTo) return [];
    return buildRentCashFlowTransactions(rentVouchers, rangeFrom, rangeTo);
  }, [rentVouchers, rangeFrom, rangeTo]);

  const data: CashFlowData = useMemo(
    () => ({
      income: {
        categories: [
          {
            id: "inc_bank",
            name: "Bank Credits",
            transactions: [
              {
                id: "t1",
                date: "05/03/2024",
                ref: "CR-9921",
                description: "UNESCO Grant Q1 Disbursement",
                amount: 450000,
              },
              {
                id: "t2",
                date: "12/03/2024",
                ref: "DEP-881",
                description: "Partner Contribution - Global Fund",
                amount: 120000,
              },
            ],
          },
          {
            id: "inc_other",
            name: "Other Income",
            transactions: [
              {
                id: "t3",
                date: "20/03/2024",
                ref: "DIV-001",
                description: "Interest Earned - Savings Account",
                amount: 450,
              },
            ],
          },
        ],
      },
      expenses: {
        categories: [
          {
            id: "exp_consultant",
            name: "Consultant",
            transactions: consultantTransactions,
          },
          {
            id: "exp_travel",
            name: "Travel",
            transactions: travelTransactions,
          },
          {
            id: "exp_rent",
            name: "Rent",
            transactions: rentTransactions,
          },
        ],
      },
    }),
    [consultantTransactions, travelTransactions, rentTransactions],
  );

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const calculateCategoryTotal = (cat: Category) =>
    cat.transactions.reduce((acc, t) => acc + t.amount, 0);
  const calculateSectionTotal = (cats: Category[]) =>
    cats.reduce((acc, cat) => acc + calculateCategoryTotal(cat), 0);

  const totalIncome = calculateSectionTotal(data.income.categories);
  const totalExpenses = calculateSectionTotal(data.expenses.categories);
  const netCashFlow = totalIncome - totalExpenses;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Ribbon Header */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white shrink-0`}>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Cash Flow Summary
            </h2>
            <p className="text-white/70 text-xs font-medium mt-0.5">
              Hierarchical analysis of inflows and outflows
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date filters */}
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                  From
                </span>
                <input
                  type="text"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-none w-24 placeholder-white/40"
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                  To
                </span>
                <input
                  type="text"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-none w-24 placeholder-white/40"
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition">
              Calculate
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition">
              📥 Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em] border-b-2 border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 border-r border-slate-200 dark:border-slate-700">
                  Account Hierarchy / Description
                </th>
                <th className="px-6 py-4 text-right w-48 border-r border-slate-200 dark:border-slate-700">
                  Reference
                </th>
                <th className="px-6 py-4 text-right w-36">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {/* ── INCOME SECTION ── */}
              <tr
                className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors bg-slate-50 dark:bg-slate-900/40"
                onClick={() => toggle("income")}>
                <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-slate-400 text-[10px] transform transition-transform duration-200 ${
                        expanded.has("income") ? "rotate-0" : "-rotate-90"
                      }`}>
                      ▼
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      Income
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-700" />
                <td className="px-6 py-4 text-right text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{totalIncome.toLocaleString("en-IN")}
                </td>
              </tr>

              {expanded.has("income") &&
                data.income.categories.map((cat) => (
                  <React.Fragment key={cat.id}>
                    {/* Category row */}
                    <tr
                      className="cursor-pointer hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-colors bg-white dark:bg-slate-800"
                      onClick={() => toggle(cat.id)}>
                      <td className="pl-14 pr-6 py-3.5 border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-slate-400 text-[9px] transform transition-transform duration-200 ${
                              expanded.has(cat.id) ? "rotate-0" : "-rotate-90"
                            }`}>
                            ▼
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 border-r border-slate-200 dark:border-slate-700" />
                      <td className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                        ₹{calculateCategoryTotal(cat).toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* Transaction rows */}
                    {expanded.has(cat.id) &&
                      cat.transactions.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors bg-white dark:bg-slate-800">
                          <td className="pl-24 pr-6 py-3 border-r border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                {t.description}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {t.date}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 border-r border-slate-200 dark:border-slate-700 text-right">
                            <button
                              onClick={() => setSelectedRef(t.ref)}
                              className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline underline-offset-2 transition">
                              {t.ref}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{t.amount.toLocaleString("en-IN")}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}

              {/* ── EXPENSES SECTION ── */}
              <tr
                className="cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors bg-slate-50 dark:bg-slate-900/40"
                onClick={() => toggle("expenses")}>
                <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-slate-400 text-[10px] transform transition-transform duration-200 ${
                        expanded.has("expenses") ? "rotate-0" : "-rotate-90"
                      }`}>
                      ▼
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                      Expenses
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-700" />
                <td className="px-6 py-4 text-right text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                  -₹{totalExpenses.toLocaleString("en-IN")}
                </td>
              </tr>

              {expanded.has("expenses") &&
                data.expenses.categories.map((cat) => (
                  <React.Fragment key={cat.id}>
                    {/* Category row */}
                    <tr
                      className="cursor-pointer hover:bg-rose-50/30 dark:hover:bg-rose-900/5 transition-colors bg-white dark:bg-slate-800"
                      onClick={() => toggle(cat.id)}>
                      <td className="pl-14 pr-6 py-3.5 border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-slate-400 text-[9px] transform transition-transform duration-200 ${
                              expanded.has(cat.id) ? "rotate-0" : "-rotate-90"
                            }`}>
                            ▼
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 border-r border-slate-200 dark:border-slate-700" />
                      <td className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                        ₹{calculateCategoryTotal(cat).toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* Transaction rows */}
                    {expanded.has(cat.id) &&
                      cat.transactions.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors bg-white dark:bg-slate-800">
                          <td className="pl-24 pr-6 py-3 border-r border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                {t.description}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {t.date}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 border-r border-slate-200 dark:border-slate-700 text-right">
                            <button
                              onClick={() => setSelectedRef(t.ref)}
                              className="font-mono text-xs font-bold text-rose-500 dark:text-rose-400 hover:underline underline-offset-2 transition">
                              {t.ref}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 font-mono">
                              ₹{t.amount.toLocaleString("en-IN")}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>

        {/* Net Cash Flow Footer */}
        <div className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg">
              🏦
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                Net Cash Position
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Period ending {dateTo}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-black tracking-tight font-mono ${netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {netCashFlow >= 0 ? "+" : ""}₹
              {netCashFlow.toLocaleString("en-IN")}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
              Total Available Liquidity
            </div>
          </div>
        </div>
      </div>

      {/* Expense Voucher Details Drawer */}
      <ExpenseVoucherDrawer
        voucherRef={selectedRef}
        onClose={() => setSelectedRef(null)}
        rentVouchers={rentVouchers}
        consultantVouchers={consultantVouchers}
        travelVouchers={travelVouchers}
        travelRecords={travelRecords}
        travelExpenses={travelExpenses}
        consultantRecords={consultantRecords}
        rentRecords={rentRecords}
      />
    </div>
  );
};
