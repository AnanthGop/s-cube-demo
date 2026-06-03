import React, { useEffect, useMemo, useState, useRef } from "react";
import { Printer } from "lucide-react";
import type { RentEntry } from "./rentTypes";
import type {
  FinancialYearItem,
  RentVoucherSnapshot,
  TDSItem,
} from "./rentVoucherUtils";
import {
  buildRentVoucherNo,
  buildRentVoucherSnapshots,
} from "./rentVoucherUtils";

/** Merge approval/voucher-created flags from persisted data into freshly-computed snapshots. */
const mergeRentApprovalFlags = (
  computed: RentVoucherSnapshot[],
  persisted: RentVoucherSnapshot[],
): RentVoucherSnapshot[] => {
  if (!persisted.length) return computed;
  // Build fast lookup: fyId -> landlordName -> monthKey -> flags
  const lookup = new Map<string, Map<string, Map<string, any>>>();
  persisted.forEach((snap) => {
    const fyMap = new Map<string, Map<string, any>>();
    (snap.landlords || []).forEach((l) => {
      const monthMap = new Map<string, any>();
      (l.monthlyDetails || []).forEach((d) => {
        if (d.approved || d.expenseVoucherCreated || d.paymentVoucherCreated) {
          monthMap.set(d.monthKey, {
            approved: d.approved,
            expenseVoucherCreated: d.expenseVoucherCreated,
            paymentVoucherCreated: d.paymentVoucherCreated,
          });
        }
      });
      if (monthMap.size > 0) fyMap.set(l.landlordName, monthMap);
    });
    if (fyMap.size > 0) lookup.set(snap.financialYearId, fyMap);
  });
  if (!lookup.size) return computed;
  return computed.map((snap) => {
    const fyMap = lookup.get(snap.financialYearId);
    if (!fyMap) return snap;
    return {
      ...snap,
      landlords: snap.landlords.map((l) => {
        const monthMap = fyMap.get(l.landlordName);
        if (!monthMap) return l;
        return {
          ...l,
          monthlyDetails: l.monthlyDetails.map((d) => {
            const flags = monthMap.get(d.monthKey);
            return flags ? { ...d, ...flags } : d;
          }),
        };
      }),
    };
  });
};

interface LandlordMapping {
  landlordName: string;
  ledgerName: string;
  mappedOn: string;
}

interface TdsAccountMapping {
  accountName: string;
  appliedOn: string;
}

interface VoucherPreview {
  voucherNo: string;
  voucherType: "Expense Voucher" | "Payment Voucher";
  landlordName: string;
  landlordLedger: string;
  monthLabel: string;
  amount: number;
  tdsAmount: number;
  netAmount: number;
}

interface RentVouchersPageProps {
  themeColor?: string;
  rentRecords: RentEntry[];
  financialYears: FinancialYearItem[];
  tdsRules?: TDSItem[];
  tdsAccountMappings?: TdsAccountMapping[];
  vouchersData: RentVoucherSnapshot[];
  journalVoucherMappings?: LandlordMapping[];
  onUpdateVouchersData: (
    nextData: RentVoucherSnapshot[],
  ) => void | Promise<void>;
  refreshKey?: number;
  onBackToLanding?: () => void;
}

export const RentVouchersPage: React.FC<RentVouchersPageProps> = ({
  themeColor = "brand-600",
  rentRecords,
  financialYears,
  tdsRules = [],
  tdsAccountMappings = [],
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
  const [selectedLandlord, setSelectedLandlord] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherPreview | null>(
    null,
  );

  const sourceDataSignature = useMemo(() => {
    return JSON.stringify({
      records: rentRecords,
      fy: financialYears,
      tds: tdsRules,
      refresh: refreshKey,
    });
  }, [rentRecords, financialYears, tdsRules, refreshKey]);

  const lastSourceSignatureRef = useRef<string>("");
  const lastSavedSignatureRef = useRef<string>(JSON.stringify(vouchersData));
  const hasInitializedRef = useRef(false);

  const activeSnapshots = useMemo(() => {
    // Recalculate from rent records so stale persisted rows cannot hide voucher numbers.
    const computed = buildRentVoucherSnapshots(
      rentRecords,
      financialYears,
      tdsRules,
    );
    lastSourceSignatureRef.current = sourceDataSignature;

    // Preserve any approval/voucher-created flags already persisted
    return mergeRentApprovalFlags(computed, vouchersData);
  }, [
    sourceDataSignature,
    vouchersData,
    rentRecords,
    financialYears,
    tdsRules,
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
      setSelectedLandlord("");
      return;
    }
    if (
      !selectedFyId ||
      !activeSnapshots.some((x) => x.financialYearId === selectedFyId)
    ) {
      setSelectedFyId(activeSnapshots[0].financialYearId);
      setSelectedLandlord("");
    }
  }, [activeSnapshots, selectedFyId]);

  const selectedSnapshot = useMemo(
    () =>
      activeSnapshots.find((item) => item.financialYearId === selectedFyId) ||
      null,
    [activeSnapshots, selectedFyId],
  );

  const selectedLandlordDetails = useMemo(() => {
    if (!selectedSnapshot || !selectedLandlord) return null;
    return (
      selectedSnapshot.landlords.find(
        (x) => x.landlordName === selectedLandlord,
      ) || null
    );
  }, [selectedSnapshot, selectedLandlord]);

  const landlordLedgerMap = useMemo(() => {
    const lookup = new Map<string, string>();
    journalVoucherMappings.forEach((item) => {
      const landlordName = String(item.landlordName || "").trim();
      const ledgerName = String(item.ledgerName || "").trim();
      if (landlordName && ledgerName) lookup.set(landlordName, ledgerName);
    });
    return lookup;
  }, [journalVoucherMappings]);

  const selectedTdsAccount = useMemo(
    () => "TDS Account (194I)",
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

  const openVoucherPreview = (
    voucherType: "Expense Voucher" | "Payment Voucher",
    voucherNo: string,
    monthLabel: string,
    landlordName: string,
    amount: number,
    tdsAmount: number,
  ) => {
    const mappedLedger = landlordLedgerMap.get(landlordName) || landlordName;
    const netAmount = Math.max(0, amount - tdsAmount);
    setSelectedVoucher({
      voucherNo,
      voucherType,
      landlordName,
      landlordLedger: mappedLedger,
      monthLabel,
      amount,
      tdsAmount,
      netAmount,
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Rent Vouchers
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Financial year wise landlord voucher entries and monthly rent
                details.
              </p>
            </div>
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                Back to Rent Landing Page
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
                setSelectedLandlord("");
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
                  <th className="px-4 py-4">Landlord</th>
                  <th className="px-4 py-4">Fund Type</th>
                  <th className="px-4 py-4">Entry Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedSnapshot && selectedSnapshot.landlords.length > 0 ?
                  selectedSnapshot.landlords.map((item) => (
                    <tr
                      key={item.landlordName}
                      onClick={() => setSelectedLandlord(item.landlordName)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/60 ${
                        selectedLandlord === item.landlordName ?
                          "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                      }`}>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {item.landlordName}
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
                      No active landlord voucher entries found for this
                      financial year.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600">
              {selectedLandlordDetails ?
                `Monthly Details - ${selectedLandlordDetails.landlordName}`
              : "Monthly Details"}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-300">
                  <th className="px-4 py-4">Month</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">TDS</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Expense Voucher Created</th>
                  <th className="px-4 py-4">Payment Voucher Created</th>
                  <th className="px-4 py-4">Expense Voucher</th>
                  <th className="px-4 py-4">Payment Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedLandlordDetails ?
                  selectedLandlordDetails.monthlyDetails.map((item) => {
                      const canOpenVoucher =
                        (isPastMonth(item.monthKey) ||
                          item.expenseVoucherCreated === "Y" ||
                          item.paymentVoucherCreated === "Y") &&
                        isCurrentOrPastMonth(item.monthKey) &&
                        item.amount > 0;
                      const expenseVoucherNo =
                        item.expenseVoucherNo ||
                        buildRentVoucherNo(
                          "EV",
                          item.monthKey,
                          selectedLandlordDetails.landlordName,
                        );
                      const paymentVoucherNo =
                        item.paymentVoucherNo ||
                        buildRentVoucherNo(
                          "PV",
                          item.monthKey,
                          selectedLandlordDetails.landlordName,
                        );
                      return (
                        <tr
                          key={item.monthKey}
                          className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-sm">
                            {item.monthLabel}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            INR {item.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            INR {item.tdsAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            {((
                              isPastMonth(item.monthKey) ||
                                item.approved === "Y"
                            ) &&
                              item.amount > 0) ?
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                                Approved
                              </span>
                            : <span className="text-slate-400">Pending</span>}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-center">
                            {canOpenVoucher ?
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs">
                                Y
                              </span>
                            : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-center">
                            {canOpenVoucher ?
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-black text-xs">
                                Y
                              </span>
                            : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            {canOpenVoucher ?
                              <button
                                onClick={() =>
                                  openVoucherPreview(
                                    "Expense Voucher",
                                    expenseVoucherNo,
                                    item.monthLabel,
                                    selectedLandlordDetails.landlordName,
                                    item.amount,
                                    item.tdsAmount,
                                  )
                                }
                                className="text-left text-blue-600 hover:text-blue-800 underline underline-offset-2">
                                {expenseVoucherNo}
                              </button>
                            : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            {canOpenVoucher ?
                              <button
                                onClick={() =>
                                  openVoucherPreview(
                                    "Payment Voucher",
                                    paymentVoucherNo,
                                    item.monthLabel,
                                    selectedLandlordDetails.landlordName,
                                    item.amount,
                                    item.tdsAmount,
                                  )
                                }
                                className="text-left text-emerald-600 hover:text-emerald-800 underline underline-offset-2">
                                {paymentVoucherNo}
                              </button>
                            : <span className="text-slate-400">-</span>}
                          </td>
                        </tr>
                      );
                  })
                : <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-slate-500">
                      Click a landlord above to view monthly details.
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
                <span className="font-semibold">Landlord:</span>{" "}
                {selectedVoucher.landlordName}
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
                        <td className="px-4 py-3 text-sm">Rent</td>
                        <td className="px-4 py-3 text-sm">Debit</td>
                        <td className="px-4 py-3 text-sm text-right">
                          INR {selectedVoucher.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">
                          {selectedVoucher.landlordName}
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
                          {selectedVoucher.landlordName}
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
                    `Being rent expense for ${selectedVoucher.monthLabel} booked for ${selectedVoucher.landlordName}; Rent debited with full amount, ${selectedVoucher.landlordLedger} credited with net amount and ${selectedTdsAccount} credited with TDS amount.`
                  : `Being rent expense for ${selectedVoucher.monthLabel} booked for ${selectedVoucher.landlordName}; Rent debited and ${selectedVoucher.landlordLedger} credited.`

                : `Being payment of rent for ${selectedVoucher.monthLabel} made to ${selectedVoucher.landlordName}; ${selectedVoucher.landlordLedger} debited and Bank credited with net amount after TDS.`
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
