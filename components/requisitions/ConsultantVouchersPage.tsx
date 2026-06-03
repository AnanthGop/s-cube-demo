import React, { useEffect, useMemo, useState, useRef } from "react";
import { Printer } from "lucide-react";
import type {
  ConsultantEntry,
  ConsultantTdsAccountMapping,
  ConsultantVoucherSnapshot,
  FinancialYearItem,
} from "./consultantVoucherUtils";
import {
  buildConsultantVoucherNo,
  buildConsultantVoucherSnapshots,
} from "./consultantVoucherUtils";

/** Merge approval/voucher-created flags from persisted data into freshly-computed snapshots. */
const mergeConsultantApprovalFlags = (
  computed: ConsultantVoucherSnapshot[],
  persisted: ConsultantVoucherSnapshot[],
): ConsultantVoucherSnapshot[] => {
  if (!persisted.length) return computed;
  // Build fast lookup: fyId -> consultantName -> monthKey -> flags
  const lookup = new Map<string, Map<string, Map<string, any>>>();
  persisted.forEach((snap) => {
    const fyMap = new Map<string, Map<string, any>>();
    (snap.consultants || []).forEach((c) => {
      const monthMap = new Map<string, any>();
      (c.monthlyDetails || []).forEach((d) => {
        if (
          d.approved ||
          d.expenseVoucherCreated ||
          d.paymentVoucherCreated ||
          typeof d.manualAmount === "number" ||
          typeof d.manualGrossAmount === "number" ||
          typeof d.manualTdsAmount === "number" ||
          typeof d.manualNetAmount === "number"
        ) {
          monthMap.set(d.monthKey, {
            approved: d.approved,
            expenseVoucherCreated: d.expenseVoucherCreated,
            paymentVoucherCreated: d.paymentVoucherCreated,
            manualAmount: d.manualAmount,
            manualGrossAmount: d.manualGrossAmount,
            manualTdsAmount: d.manualTdsAmount,
            manualNetAmount: d.manualNetAmount,
          });
        }
      });
      if (monthMap.size > 0) fyMap.set(c.consultantName, monthMap);
    });
    if (fyMap.size > 0) lookup.set(snap.financialYearId, fyMap);
  });
  if (!lookup.size) return computed;
  return computed.map((snap) => {
    const fyMap = lookup.get(snap.financialYearId);
    if (!fyMap) return snap;
    return {
      ...snap,
      consultants: snap.consultants.map((c) => {
        const monthMap = fyMap.get(c.consultantName);
        if (!monthMap) return c;
        return {
          ...c,
          monthlyDetails: c.monthlyDetails.map((d) => {
            const flags = monthMap.get(d.monthKey);
            if (!flags) return d;
            return {
              ...d,
              ...flags,
              amount:
                typeof flags.manualAmount === "number" ?
                  flags.manualAmount
                : d.amount,
              grossAmount:
                typeof flags.manualGrossAmount === "number" ?
                  flags.manualGrossAmount
                : d.grossAmount,
              tdsAmount:
                typeof flags.manualTdsAmount === "number" ?
                  flags.manualTdsAmount
                : d.tdsAmount,
              netAmount:
                typeof flags.manualNetAmount === "number" ?
                  flags.manualNetAmount
                : d.netAmount,
            };
          }),
        };
      }),
    };
  });
};

interface ConsultantMapping {
  consultantName: string;
  ledgerName: string;
  mappedOn: string;
}

interface TdsAccountMapping {
  accountName?: string;
  type?: string;
  section?: string;
  rate?: number;
  appliedOn?: string;
}

interface VoucherPreview {
  voucherNo: string;
  voucherType: "Expense Voucher" | "Payment Voucher";
  consultantName: string;
  consultantLedger: string;
  monthLabel: string;
  amount: number;
  tdsAmount: number;
  netAmount: number;
}

interface ConsultantVouchersPageProps {
  themeColor?: string;
  consultantRecords: ConsultantEntry[];
  financialYears: FinancialYearItem[];
  vouchersData: ConsultantVoucherSnapshot[];
  tdsAccountMappings?: TdsAccountMapping[];
  journalVoucherMappings?: ConsultantMapping[];
  onUpdateVouchersData: (
    nextData: ConsultantVoucherSnapshot[],
  ) => void | Promise<void>;
  refreshKey?: number;
  onBackToLanding?: () => void;
}

export const ConsultantVouchersPage: React.FC<ConsultantVouchersPageProps> = ({
  themeColor = "brand-600",
  consultantRecords,
  financialYears,
  vouchersData,
  tdsAccountMappings = [],
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
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherPreview | null>(
    null,
  );

  const sourceDataSignature = useMemo(() => {
    return JSON.stringify({
      records: consultantRecords,
      fy: financialYears,
      tds: tdsAccountMappings,
      refresh: refreshKey,
    });
  }, [consultantRecords, financialYears, tdsAccountMappings, refreshKey]);

  const lastSourceSignatureRef = useRef<string>("");
  const lastSavedSignatureRef = useRef<string>(JSON.stringify(vouchersData));
  const hasInitializedRef = useRef(false);

  const activeSnapshots = useMemo(() => {
    // Recalculate from consultant records so stale persisted rows cannot hide voucher numbers.
    const computed = buildConsultantVoucherSnapshots(
      consultantRecords,
      financialYears,
      tdsAccountMappings as ConsultantTdsAccountMapping[],
    );
    lastSourceSignatureRef.current = sourceDataSignature;

    // Preserve any approval/voucher-created flags already persisted
    return mergeConsultantApprovalFlags(computed, vouchersData);
  }, [
    sourceDataSignature,
    vouchersData,
    consultantRecords,
    financialYears,
    tdsAccountMappings,
  ]);

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
      setSelectedConsultant("");
      return;
    }
    if (
      !selectedFyId ||
      !activeSnapshots.some((x) => x.financialYearId === selectedFyId)
    ) {
      setSelectedFyId(activeSnapshots[0].financialYearId);
      setSelectedConsultant("");
    }
  }, [activeSnapshots, selectedFyId]);

  const selectedSnapshot = useMemo(
    () =>
      activeSnapshots.find((item) => item.financialYearId === selectedFyId) ||
      null,
    [activeSnapshots, selectedFyId],
  );

  const selectedConsultantDetails = useMemo(() => {
    if (!selectedSnapshot || !selectedConsultant) return null;
    return (
      selectedSnapshot.consultants.find(
        (x) => x.consultantName === selectedConsultant,
      ) || null
    );
  }, [selectedSnapshot, selectedConsultant]);

  const consultantLedgerMap = useMemo(() => {
    const lookup = new Map<string, string>();
    const mappings =
      Array.isArray(journalVoucherMappings) ? journalVoucherMappings : [];
    mappings.forEach((item) => {
      const consultantName = String(item.consultantName || "").trim();
      const ledgerName = String(item.ledgerName || "").trim();
      if (consultantName && ledgerName) lookup.set(consultantName, ledgerName);
    });
    return lookup;
  }, [journalVoucherMappings]);

  const selectedTdsAccount = useMemo(
    () =>
      String(
        tdsAccountMappings.find(
          (item) => String(item?.accountName || "").trim().length > 0,
        )?.accountName || "TDS Account",
      ),
    [tdsAccountMappings],
  );
  const selectedTdsRate = useMemo(
    () =>
      Number(
        tdsAccountMappings.find((item) => Number(item?.rate || 0) > 0)?.rate ||
          0,
      ),
    [tdsAccountMappings],
  );

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

  // True for current month and all past months (excludes future months)
  const isCurrentOrPastMonth = (monthKey: string) => {
    const date = getMonthDateFromKey(monthKey);
    if (!date) return false;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return date <= thisMonthStart;
  };

  const getExpenseVoucherNo = (
    item: { monthKey: string; expenseVoucherNo?: string },
    consultantName: string,
  ) =>
    item.expenseVoucherNo ||
    buildConsultantVoucherNo("EV", item.monthKey, consultantName);

  const getPaymentVoucherNo = (
    item: { monthKey: string; paymentVoucherNo?: string },
    consultantName: string,
  ) =>
    item.paymentVoucherNo ||
    buildConsultantVoucherNo("PV", item.monthKey, consultantName);

  const openVoucherPreview = (
    voucherType: "Expense Voucher" | "Payment Voucher",
    voucherNo: string,
    monthLabel: string,
    consultantName: string,
    amount: number,
    tdsAmount: number,
  ) => {
    const mappedLedger =
      consultantLedgerMap.get(consultantName) || consultantName;
    const netAmount = Math.max(0, amount - tdsAmount);
    setSelectedVoucher({
      voucherNo,
      voucherType,
      consultantName,
      consultantLedger: mappedLedger,
      monthLabel,
      amount,
      tdsAmount,
      netAmount,
    });
  };

  const handlePartialAmountChange = (
    consultantName: string,
    monthKey: string,
    nextAmountRaw: string,
    currentAmount: number,
    currentGrossAmount: number,
  ) => {
    const parsedAmount = Number(nextAmountRaw);
    const safeAmount = Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 0;
    const grossRatio =
      currentAmount > 0 && currentGrossAmount > 0 ?
        currentGrossAmount / currentAmount
      : 0;
    const nextGrossAmount = roundTo2(safeAmount * grossRatio);
    const nextTdsAmount = roundTo2((nextGrossAmount * selectedTdsRate) / 100);
    const nextNetAmount = roundTo2(safeAmount - nextTdsAmount);

    const nextSnapshots = activeSnapshots.map((snapshot) => {
      if (snapshot.financialYearId !== selectedFyId) return snapshot;
      return {
        ...snapshot,
        consultants: snapshot.consultants.map((consultant) => {
          if (consultant.consultantName !== consultantName) return consultant;
          return {
            ...consultant,
            monthlyDetails: consultant.monthlyDetails.map((detail) => {
              if (detail.monthKey !== monthKey) return detail;
              return {
                ...detail,
                amount: safeAmount,
                grossAmount: nextGrossAmount,
                tdsAmount: nextTdsAmount,
                netAmount: nextNetAmount,
                manualAmount: safeAmount,
                manualGrossAmount: nextGrossAmount,
                manualTdsAmount: nextTdsAmount,
                manualNetAmount: nextNetAmount,
              };
            }),
          };
        }),
      };
    });

    onUpdateVouchersData(nextSnapshots);
  };

  const roundTo2 = (value: number) => Math.round(value * 100) / 100;

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Consultant Vouchers
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Financial year wise consultant voucher entries and monthly fee
                details.
              </p>
            </div>
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                Back to Consultant Landing Page
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
                setSelectedConsultant("");
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
                  <th className="px-4 py-4">Consultant</th>
                  <th className="px-4 py-4">Fund Type</th>
                  <th className="px-4 py-4">Entry Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedSnapshot && selectedSnapshot.consultants.length > 0 ?
                  selectedSnapshot.consultants.map((item) => (
                    <tr
                      key={item.consultantName}
                      onClick={() => setSelectedConsultant(item.consultantName)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/60 ${
                        selectedConsultant === item.consultantName ?
                          "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                      }`}>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {item.consultantName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold ${
                            item.fundType === "FCRA" ?
                              "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                          }`}>
                          {item.fundType || "LC"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.entryCount}</td>
                    </tr>
                  ))
                : <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500">
                      No active consultant voucher entries found for this
                      financial year.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600">
              {selectedConsultantDetails ?
                `Monthly Details - ${selectedConsultantDetails.consultantName}`
              : "Monthly Details"}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-300">
                  <th className="px-4 py-4">Month</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">TDS</th>
                  <th className="px-4 py-4">Last Period Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Expense Voucher Created</th>
                  <th className="px-4 py-4">Payment Voucher Created</th>
                  <th className="px-4 py-4">Expense Voucher</th>
                  <th className="px-4 py-4">Payment Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(
                  selectedConsultantDetails &&
                  Array.isArray(selectedConsultantDetails.monthlyDetails)
                ) ?
                  selectedConsultantDetails.monthlyDetails.map((item) => (
                    <tr
                      key={item.monthKey}
                      className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm">{item.monthLabel}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        INR {item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        INR {item.tdsAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.isPartialPeriod ?
                          <div className="space-y-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) =>
                                handlePartialAmountChange(
                                  selectedConsultantDetails.consultantName,
                                  item.monthKey,
                                  e.target.value,
                                  item.amount,
                                  Number(item.grossAmount || 0),
                                )
                              }
                              className="w-32 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-brand-500"
                            />
                            {item.periodStartDate && item.periodEndDate && (
                              <div className="text-[10px] font-semibold text-amber-700">
                                {item.periodStartDate} to {item.periodEndDate}
                              </div>
                            )}
                          </div>
                        : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {(
                          (isPastMonth(item.monthKey) ||
                            item.approved === "Y") &&
                          item.amount > 0
                        ) ?
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                            Approved
                          </span>
                        : <span className="text-slate-400">Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-center">
                        {(
                          (isPastMonth(item.monthKey) ||
                            item.expenseVoucherCreated === "Y") &&
                          isCurrentOrPastMonth(item.monthKey) &&
                          item.amount > 0
                        ) ?
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs">
                            Y
                          </span>
                        : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-center">
                        {(
                          (isPastMonth(item.monthKey) ||
                            item.paymentVoucherCreated === "Y") &&
                          isCurrentOrPastMonth(item.monthKey) &&
                          item.amount > 0
                        ) ?
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-black text-xs">
                            Y
                          </span>
                        : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {(
                          (isPastMonth(item.monthKey) ||
                            item.expenseVoucherCreated === "Y") &&
                          isCurrentOrPastMonth(item.monthKey) &&
                          item.amount > 0
                        ) ?
                          <button
                            onClick={() =>
                              openVoucherPreview(
                                "Expense Voucher",
                                getExpenseVoucherNo(
                                  item,
                                  selectedConsultantDetails.consultantName,
                                ),
                                item.monthLabel,
                                selectedConsultantDetails.consultantName,
                                item.amount,
                                item.tdsAmount,
                              )
                            }
                            className="text-left text-blue-600 hover:text-blue-800 underline underline-offset-2">
                            {getExpenseVoucherNo(
                              item,
                              selectedConsultantDetails.consultantName,
                            )}
                          </button>
                        : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {(
                          (isPastMonth(item.monthKey) ||
                            item.paymentVoucherCreated === "Y") &&
                          isCurrentOrPastMonth(item.monthKey) &&
                          item.amount > 0
                        ) ?
                          <button
                            onClick={() =>
                              openVoucherPreview(
                                "Payment Voucher",
                                getPaymentVoucherNo(
                                  item,
                                  selectedConsultantDetails.consultantName,
                                ),
                                item.monthLabel,
                                selectedConsultantDetails.consultantName,
                                item.amount,
                                item.tdsAmount,
                              )
                            }
                            className="text-left text-emerald-600 hover:text-emerald-800 underline underline-offset-2">
                            {getPaymentVoucherNo(
                              item,
                              selectedConsultantDetails.consultantName,
                            )}
                          </button>
                        : <span className="text-slate-400">-</span>}
                      </td>
                    </tr>
                  ))
                : <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-slate-500">
                      Click a consultant above to view monthly details.
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
                <span className="font-semibold">Consultant:</span>{" "}
                {selectedVoucher.consultantName}
              </div>
              <div>
                <span className="font-semibold">Month:</span>{" "}
                {selectedVoucher.monthLabel}
              </div>
              <div>
                <span className="font-semibold">Amount:</span> INR{" "}
                {selectedVoucher.amount.toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">TDS:</span> INR{" "}
                {selectedVoucher.tdsAmount.toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Net Payable:</span> INR{" "}
                {selectedVoucher.netAmount.toLocaleString()}
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
                        <td className="px-4 py-3 text-sm">Consultant Fees</td>
                        <td className="px-4 py-3 text-sm">Debit</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">
                          {selectedVoucher.consultantName}
                        </td>
                        <td className="px-4 py-3 text-sm">Credit</td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.netAmount.toLocaleString()}
                        </td>
                      </tr>
                      {selectedVoucher.tdsAmount > 0 && (
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            {selectedTdsAccount}
                          </td>
                          <td className="px-4 py-3 text-sm">Credit</td>
                          <td className="px-4 py-3 text-sm text-right">-</td>
                          <td className="px-4 py-3 text-sm text-right">
                            INR {selectedVoucher.tdsAmount.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </>
                  : <>
                      <tr>
                        <td className="px-4 py-3 text-sm">
                          {selectedVoucher.consultantName}
                        </td>
                        <td className="px-4 py-3 text-sm">Debit</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.netAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Bank</td>
                        <td className="px-4 py-3 text-sm">Credit</td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.netAmount.toLocaleString()}
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
                  selectedVoucher.tdsAmount > 0 ?
                    `Being consultant fees for ${selectedVoucher.monthLabel} booked for ${selectedVoucher.consultantName}; Consultant Fees debited with full amount, ${selectedVoucher.consultantLedger} credited with net amount and ${selectedTdsAccount} credited with TDS amount.`
                  : `Being consultant fees for ${selectedVoucher.monthLabel} booked for ${selectedVoucher.consultantName}; Consultant Fees debited and ${selectedVoucher.consultantLedger} credited.`

                : `Being payment of consultant fees for ${selectedVoucher.monthLabel} made to ${selectedVoucher.consultantName}; ${selectedVoucher.consultantLedger} debited and Bank credited with net amount after TDS.`
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
