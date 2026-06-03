import React, { useEffect, useMemo, useState, useRef } from "react";
import { Printer } from "lucide-react";
import type {
  TravelEntry,
  TravelEmployeeMappingSource,
  TravelVoucherSnapshot,
  FinancialYearItem,
} from "./travelVoucherUtils";
import {
  buildTravelVoucherNo,
  buildTravelVoucherSnapshots,
  normalizeTravelEmployeeMappings,
} from "./travelVoucherUtils";

interface VoucherPreview {
  voucherNo: string;
  voucherType: "Expense Voucher" | "Payment Voucher";
  employeeName: string;
  employeeLedger: string;
  monthLabel: string;
  amount: number;
}

interface TravelVouchersPageProps {
  themeColor?: string;
  travelRecords: TravelEntry[];
  financialYears: FinancialYearItem[];
  vouchersData: TravelVoucherSnapshot[];
  journalVoucherMappings?: TravelEmployeeMappingSource;
  onUpdateVouchersData: (
    nextData: TravelVoucherSnapshot[],
  ) => void | Promise<void>;
  refreshKey?: number;
  onBackToLanding?: () => void;
}

export const TravelVouchersPage: React.FC<TravelVouchersPageProps> = ({
  themeColor = "brand-600",
  travelRecords,
  financialYears,
  vouchersData,
  journalVoucherMappings = [],
  onUpdateVouchersData,
  refreshKey = 0,
  onBackToLanding,
}) => {
  const formatFyLabel = (startDate: string, endDate: string) => {
    const parse = (raw: string) => {
      const v = String(raw || "").trim();
      if (!v) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const d = new Date(`${v}T00:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (!m) return null;
      const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const start = parse(startDate);
    const end = parse(endDate);
    if (!start || !end) return "FY";
    const startLabel = start.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    const endLabel = end.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    return `FY (${startLabel} to ${endLabel})`;
  };

  const [selectedFyId, setSelectedFyId] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherPreview | null>(
    null,
  );

  const sourceDataSignature = useMemo(() => {
    return JSON.stringify({
      records: travelRecords,
      fy: financialYears,
      refresh: refreshKey,
    });
  }, [travelRecords, financialYears, refreshKey]);

  const lastSourceSignatureRef = useRef<string>("");
  const lastSavedSignatureRef = useRef<string>(JSON.stringify(vouchersData));
  const hasInitializedRef = useRef(false);

  const activeSnapshots = useMemo(() => {
    // Recalculate from travel records so stale persisted rows cannot hide voucher numbers.
    const computed = buildTravelVoucherSnapshots(travelRecords, financialYears);
    lastSourceSignatureRef.current = sourceDataSignature;

    return computed;
  }, [sourceDataSignature, vouchersData, travelRecords, financialYears]);

  // Save to persistence only when source data changes
  useEffect(() => {
    // Skip initial mount
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      lastSavedSignatureRef.current = JSON.stringify(activeSnapshots);
      return;
    }

    const computedSignature = JSON.stringify(activeSnapshots);
    if (computedSignature !== lastSavedSignatureRef.current) {
      lastSavedSignatureRef.current = computedSignature;
      onUpdateVouchersData(activeSnapshots);
    }
  }, [sourceDataSignature, activeSnapshots, onUpdateVouchersData]);

  useEffect(() => {
    if (activeSnapshots.length === 0) {
      setSelectedFyId("");
      setSelectedEmployee("");
      return;
    }
    if (
      !selectedFyId ||
      !activeSnapshots.some((x) => x.financialYearId === selectedFyId)
    ) {
      setSelectedFyId(activeSnapshots[0].financialYearId);
      setSelectedEmployee("");
    }
  }, [activeSnapshots, selectedFyId]);

  const selectedSnapshot = useMemo(
    () =>
      activeSnapshots.find((item) => item.financialYearId === selectedFyId) ||
      null,
    [activeSnapshots, selectedFyId],
  );

  const selectedEmployeeDetails = useMemo(() => {
    if (!selectedSnapshot || !selectedEmployee) return null;
    return (
      selectedSnapshot.employees.find(
        (x) => x.employeeName === selectedEmployee,
      ) || null
    );
  }, [selectedSnapshot, selectedEmployee]);

  const employeeLedgerMap = useMemo(() => {
    const lookup = new Map<string, string>();
    normalizeTravelEmployeeMappings(journalVoucherMappings).forEach((item) => {
      const employeeName = String(item.employeeName || "").trim();
      const ledgerName = String(item.ledgerName || "").trim();
      if (employeeName && ledgerName) lookup.set(employeeName, ledgerName);
    });
    return lookup;
  }, [journalVoucherMappings]);

  const getMonthDateFromKey = (monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
    return new Date(year, month - 1, 1);
  };

  const isPastMonth = (monthKey: string) => {
    const date = getMonthDateFromKey(monthKey);
    if (!date) return false;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return date < thisMonthStart;
  };

  const getExpenseVoucherNo = (
    item: { monthKey: string; expenseVoucherNo?: string },
    employeeName: string,
  ) =>
    item.expenseVoucherNo ||
    buildTravelVoucherNo("EV", item.monthKey, employeeName);

  const getPaymentVoucherNo = (
    item: { monthKey: string; paymentVoucherNo?: string },
    employeeName: string,
  ) =>
    item.paymentVoucherNo ||
    buildTravelVoucherNo("PV", item.monthKey, employeeName);

  const openVoucherPreview = (
    voucherType: "Expense Voucher" | "Payment Voucher",
    voucherNo: string,
    monthLabel: string,
    employeeName: string,
    amount: number,
  ) => {
    const mappedLedger = employeeLedgerMap.get(employeeName) || employeeName;
    setSelectedVoucher({
      voucherNo,
      voucherType,
      employeeName,
      employeeLedger: mappedLedger,
      monthLabel,
      amount,
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Travel Vouchers
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Financial year wise travel voucher entries and monthly travel
                expense details.
              </p>
            </div>
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                Back to Travel Landing Page
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="max-w-sm">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Financial Year (Active/Open)
            </label>
            <select
              value={selectedFyId}
              onChange={(e) => {
                setSelectedFyId(e.target.value);
                setSelectedEmployee("");
              }}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm">
              {activeSnapshots.length === 0 && (
                <option value="">No active/open financial year found</option>
              )}
              {activeSnapshots.map((fy) => (
                <option
                  key={fy.financialYearId}
                  value={fy.financialYearId}>
                  {`${fy.financialYearName} - ${formatFyLabel(fy.startDate, fy.endDate)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-300">
                  <th className="px-4 py-4">Employee</th>
                  <th className="px-4 py-4">Entry Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedSnapshot && selectedSnapshot.employees.length > 0 ?
                  selectedSnapshot.employees.map((item) => (
                    <tr
                      key={item.employeeName}
                      onClick={() => setSelectedEmployee(item.employeeName)}
                      className={`cursor-pointer transition-colors hover:bg-purple-50/60 ${selectedEmployee === item.employeeName ?
                          "bg-purple-50 dark:bg-purple-900/20"
                          : ""
                        }`}>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {item.employeeName}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.entryCount}</td>
                    </tr>
                  ))
                  : <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-sm text-slate-500">
                      No active travel voucher entries found for this financial
                      year.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600">
              {selectedEmployeeDetails ?
                `Monthly Details - ${selectedEmployeeDetails.employeeName}`
                : "Monthly Details"}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-300">
                  <th className="px-4 py-4">Month</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Expense Voucher</th>
                  <th className="px-4 py-4">Payment Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedEmployeeDetails ?
                  selectedEmployeeDetails.monthlyDetails.map((item) => (
                    <tr
                      key={item.monthKey}
                      className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm">{item.monthLabel}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        INR {item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {isPastMonth(item.monthKey) && item.amount > 0 ?
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                openVoucherPreview(
                                  "Expense Voucher",
                                  getExpenseVoucherNo(
                                    item,
                                    selectedEmployeeDetails.employeeName,
                                  ),
                                  item.monthLabel,
                                  selectedEmployeeDetails.employeeName,
                                  item.amount,
                                )
                              }
                              className="text-left text-blue-600 hover:text-blue-800 underline underline-offset-2">
                              {getExpenseVoucherNo(
                                item,
                                selectedEmployeeDetails.employeeName,
                              )}
                            </button>
                          </div>
                          : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {isPastMonth(item.monthKey) && item.amount > 0 ?
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                openVoucherPreview(
                                  "Payment Voucher",
                                  getPaymentVoucherNo(
                                    item,
                                    selectedEmployeeDetails.employeeName,
                                  ),
                                  item.monthLabel,
                                  selectedEmployeeDetails.employeeName,
                                  item.amount,
                                )
                              }
                              className="text-left text-emerald-600 hover:text-emerald-800 underline underline-offset-2">
                              {getPaymentVoucherNo(
                                item,
                                selectedEmployeeDetails.employeeName,
                              )}
                            </button>
                          </div>
                          : <span className="text-slate-400">-</span>}
                      </td>
                    </tr>
                  ))
                  : <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-slate-500">
                      Click an employee above to view monthly details.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedVoucher && (
        <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                {selectedVoucher.voucherType}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedVoucher.voucherNo}
              </h3>
            </div>
            <button
              onClick={() => setSelectedVoucher(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Close
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="text-sm text-slate-700 dark:text-slate-200">
              <div>
                <span className="font-semibold">Employee:</span>{" "}
                {selectedVoucher.employeeName}
              </div>
              <div>
                <span className="font-semibold">Month:</span>{" "}
                {selectedVoucher.monthLabel}
              </div>
              <div>
                <span className="font-semibold">Amount:</span> INR{" "}
                {selectedVoucher.amount.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ledger
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Journal Type
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                      Debit Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                      Credit Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedVoucher.voucherType === "Expense Voucher" ?
                    <>
                      <tr>
                        <td className="px-4 py-3 text-sm">Travel Expenses</td>
                        <td className="px-4 py-3 text-sm">Debit</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">
                          {selectedVoucher.employeeName}
                        </td>
                        <td className="px-4 py-3 text-sm">Credit</td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.amount.toLocaleString()}
                        </td>
                      </tr>
                    </>
                    : <>
                      <tr>
                        <td className="px-4 py-3 text-sm">
                          {selectedVoucher.employeeName}
                        </td>
                        <td className="px-4 py-3 text-sm">Debit</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Bank</td>
                        <td className="px-4 py-3 text-sm">Credit</td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.amount.toLocaleString()}
                        </td>
                      </tr>
                    </>
                  }
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                Narration
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {selectedVoucher.voucherType === "Expense Voucher" ?
                  `Being travel expenses for ${selectedVoucher.monthLabel} booked for ${selectedVoucher.employeeName}; Travel Expenses debited and ${selectedVoucher.employeeLedger} credited.`
                  : `Being payment of travel expenses for ${selectedVoucher.monthLabel} made to ${selectedVoucher.employeeName}; ${selectedVoucher.employeeLedger} debited and Bank credited.`
                }
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
            <button
              onClick={() => {
                try {
                  if (typeof window !== "undefined") {
                    window.print();
                  }
                } catch (err) {
                  console.error("Print failed", err);
                }
              }}
              className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 hover:border-brand-500 hover:text-brand-600 transition rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setSelectedVoucher(null)}
              className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
