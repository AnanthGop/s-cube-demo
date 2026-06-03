import React, { useMemo } from "react";
import { Printer } from "lucide-react";

interface MonthlyVoucherDetail {
  monthKey: string;
  monthLabel: string;
  amount: number;
  tdsAmount?: number;
  netAmount?: number;
  approved?: string;
  expenseVoucherCreated?: string;
  paymentVoucherCreated?: string;
}

interface LandlordVoucherSummary {
  landlordName: string;
  entryCount: number;
  monthlyDetails: MonthlyVoucherDetail[];
}

interface RentVoucherSnapshot {
  financialYearId: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  landlords: LandlordVoucherSummary[];
  generatedAt: string;
}

interface ConsultantSummary {
  consultantName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}

interface ConsultantSnapshot {
  financialYearId: string;
  consultants: ConsultantSummary[];
}

interface TravelEmployeeSummary {
  employeeName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}

interface TravelVoucherSnapshot {
  financialYearId: string;
  employees: TravelEmployeeSummary[];
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

interface TravelExpense {
  expId: string;
  reqId: string;
  submittedOn?: string;
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

interface ExpenseVoucherDrawerProps {
  voucherRef: string | null;
  onClose: () => void;
  rentVouchers?: RentVoucherSnapshot[];
  consultantVouchers?: ConsultantSnapshot[];
  travelVouchers?: TravelVoucherSnapshot[];
  travelRecords?: TravelRecord[];
  travelExpenses?: TravelExpense[];
  consultantRecords?: ConsultantRecord[];
  rentRecords?: RentRecord[];
}

export const ExpenseVoucherDrawer: React.FC<ExpenseVoucherDrawerProps> = ({
  voucherRef,
  onClose,
  rentVouchers = [],
  consultantVouchers = [],
  travelVouchers = [],
  travelRecords = [],
  travelExpenses = [],
  consultantRecords = [],
  rentRecords = [],
}) => {
  // Parse voucher reference to extract details
  const voucherDetails = useMemo(() => {
    if (!voucherRef) return null;

    // Format: EV-YYYYMM-XXXXX (e.g., EV-202404-LANDL) or EV-TRXXX (Travel)
    const rentConsultantMatch = voucherRef.match(/^(EV|PV)-(\d{6})-(.+)$/);
    const travelMatch = voucherRef.match(/^(EV|PDV)-(.+)$/);

    // Check Rent/Consultant vouchers FIRST (more specific pattern)
    if (rentConsultantMatch) {
      const [, type, dateCode, entityCode] = rentConsultantMatch;
      const year = dateCode.substring(0, 4);
      const month = dateCode.substring(4, 6);
      const monthKey = `${year}-${month}`;

      if (type === "EV") {
        // Try to find in rent vouchers
        for (const snapshot of rentVouchers) {
          for (const landlord of snapshot.landlords) {
            const monthDetail = landlord.monthlyDetails.find(
              (m) => m.monthKey === monthKey,
            );
            if (
              monthDetail &&
              monthDetail.amount > 0 &&
              (monthDetail.expenseVoucherNo === voucherRef ||
                landlord.landlordName
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .startsWith(entityCode.substring(0, 3)))
            ) {
              // Find the actual rent record by landlord name
              const rentRecord = rentRecords.find(
                (r) =>
                  r.landlordName?.toLowerCase() ===
                  landlord.landlordName?.toLowerCase(),
              );

              return {
                type: "rent" as const,
                voucherType: "Expense Voucher" as const,
                voucherNo: voucherRef,
                landlordName: landlord.landlordName,
                monthLabel: monthDetail.monthLabel,
                amount: monthDetail.amount,
                tdsAmount: monthDetail.tdsAmount || 0,
                netAmount: monthDetail.netAmount || monthDetail.amount,
                reqId: rentRecord?.id || landlord.landlordName,
              };
            }
          }
        }

        // Try to find in consultant vouchers
        for (const snapshot of consultantVouchers) {
          for (const consultant of snapshot.consultants) {
            const monthDetail = consultant.monthlyDetails.find(
              (m) => m.monthKey === monthKey,
            );
            if (
              monthDetail &&
              monthDetail.amount > 0 &&
              (monthDetail.expenseVoucherNo === voucherRef ||
                consultant.consultantName
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .startsWith(entityCode.substring(0, 3)))
            ) {
              // Find the actual consultant record by consultant name
              const consultantRecord = consultantRecords.find(
                (c) =>
                  c.vendorName?.toLowerCase() ===
                  consultant.consultantName?.toLowerCase(),
              );

              return {
                type: "consultant" as const,
                voucherType: "Expense Voucher" as const,
                voucherNo: voucherRef,
                consultantName: consultant.consultantName,
                monthLabel: monthDetail.monthLabel,
                amount: monthDetail.amount,
                tdsAmount: monthDetail.tdsAmount || 0,
                netAmount: monthDetail.netAmount || monthDetail.amount,
                reqId: consultantRecord?.id || consultant.consultantName,
              };
            }
          }
        }

        // Try to find in scheduled travel vouchers.
        for (const snapshot of travelVouchers) {
          for (const employee of snapshot.employees || []) {
            const monthDetail = employee.monthlyDetails.find(
              (m) => m.monthKey === monthKey,
            );
            if (
              monthDetail &&
              monthDetail.amount > 0 &&
              (monthDetail.expenseVoucherNo === voucherRef ||
                employee.employeeName
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .startsWith(entityCode.substring(0, 3)))
            ) {
              return {
                type: "travel" as const,
                voucherType: "Expense Voucher" as const,
                voucherNo: voucherRef,
                travellerName: employee.employeeName,
                projectName: "Scheduled Travel",
                date: monthDetail.monthLabel,
                amount: monthDetail.amount,
                tdsAmount: 0,
                netAmount: monthDetail.amount,
                reqId: employee.employeeName,
                expId: voucherRef,
                travelDetails: {
                  ticketCost: monthDetail.amount,
                  lodging: 0,
                  conveyance: 0,
                },
              };
            }
          }
        }
      }
    }

    // Handle Travel vouchers (EV-TRXXX or PDV-TRXXX) only if not rent/consultant
    if (travelMatch && !rentConsultantMatch) {
      const [, type, travelId] = travelMatch;
      const cleanId = travelId.replace(/[^A-Z0-9]/gi, "").toUpperCase();

      // Find the travel record
      const travelRec = travelRecords.find(
        (rec) => rec.id.replace(/[^A-Z0-9]/gi, "").toUpperCase() === cleanId,
      );

      if (!travelRec) return null;

      // Find matching expense record
      const travelExp = travelExpenses.find(
        (exp) => exp.reqId === travelRec.id,
      );

      if (type === "EV" && travelRec.expenseVoucherCreated === "Y") {
        const travelAmt =
          travelExp ?
            (travelExp.actualTicketCost || 0) +
            (travelExp.actualLodgingCost || 0) +
            (travelExp.actualLocalConveyance || 0)
          : (travelRec.travelAmount || 0) +
            (travelRec.lodgingCost || 0) +
            (travelRec.localConveyance || 0);

        const traveller =
          travelExp?.travellerName || travelRec.travellerName || "—";
        const project = travelExp?.projectName || travelRec.projectName || "—";
        const displayDate =
          travelExp?.submittedOn || travelRec.travelStartDate || "—";

        return {
          type: "travel" as const,
          voucherType: "Expense Voucher" as const,
          voucherNo: voucherRef,
          travellerName: traveller,
          projectName: project,
          date: displayDate,
          amount: travelAmt,
          tdsAmount: 0,
          netAmount: travelAmt,
          reqId: travelRec.id,
          expId: travelExp?.expId || "—",
          travelDetails:
            travelExp ?
              {
                ticketCost: travelExp.actualTicketCost || 0,
                lodging: travelExp.actualLodgingCost || 0,
                conveyance: travelExp.actualLocalConveyance || 0,
              }
            : undefined,
        };
      }

      if (type === "PDV") {
        const perDiem =
          travelExp?.reqPerDiemAmount || travelRec.perDiemAmount || 0;
        const traveller =
          travelExp?.travellerName || travelRec.travellerName || "—";
        const project = travelExp?.projectName || travelRec.projectName || "—";
        const displayDate =
          travelExp?.submittedOn || travelRec.travelStartDate || "—";

        return {
          type: "travel-perdiem" as const,
          voucherType: "Per Diem Voucher" as const,
          voucherNo: voucherRef,
          travellerName: traveller,
          projectName: project,
          date: displayDate,
          amount: perDiem,
          tdsAmount: 0,
          netAmount: perDiem,
          reqId: travelRec.id,
          expId: travelExp?.expId || "—",
        };
      }

      return null;
    }

    return null;
  }, [
    voucherRef,
    rentVouchers,
    consultantVouchers,
    travelVouchers,
    travelRecords,
    travelExpenses,
    consultantRecords,
    rentRecords,
  ]);

  if (!voucherRef || !voucherDetails) return null;

  const isRent = voucherDetails.type === "rent";
  const isTravel =
    voucherDetails.type === "travel" ||
    voucherDetails.type === "travel-perdiem";
  const isConsultant = voucherDetails.type === "consultant";

  const entityName =
    isRent ? voucherDetails.landlordName
    : isTravel ? voucherDetails.travellerName
    : voucherDetails.consultantName;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Floating Sidebar Drawer */}
      <div className="fixed top-0 right-0 h-full w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-[999] animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-purple-600 px-8 py-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl transition-all">
            ×
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 block mb-2">
            {voucherDetails.voucherType}
          </span>
          <h2 className="text-3xl font-black font-mono tracking-tighter">
            {voucherDetails.voucherNo}
          </h2>
          <div className="mt-6 flex gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-500 shadow-lg shadow-green-500/30">
              Approved
            </span>
            {!isTravel && voucherDetails.monthLabel && (
              <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/80">
                {voucherDetails.monthLabel}
              </span>
            )}
            {isTravel && voucherDetails.date && (
              <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/80">
                {voucherDetails.date}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Summary Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Voucher Summary
            </label>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {isRent ?
                      "Landlord:"
                    : isTravel ?
                      "Traveller:"
                    : "Consultant:"}
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    {entityName}
                  </span>
                </div>
                {isTravel && voucherDetails.projectName && (
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Project:
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      {voucherDetails.projectName}
                    </span>
                  </div>
                )}
                {!isTravel && voucherDetails.monthLabel && (
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Month:
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      {voucherDetails.monthLabel}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Amount:
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    INR {voucherDetails.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500">TDS:</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    INR {voucherDetails.tdsAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase">
                    Net Payable:
                  </span>
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                    INR {voucherDetails.netAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Requisition */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-b border-purple-50 dark:border-purple-900/30 pb-2">
              {isTravel ? "Travel Requisition & Expense" : "Linked Requisition"}
            </h3>
            <div className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-purple-500 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📄
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    {isRent ?
                      "Rent Requisition"
                    : isTravel ?
                      "Travel Requisition"
                    : "Consultant Requisition"}
                  </div>
                  <div className="text-sm font-black text-purple-600 font-mono">
                    {voucherDetails.reqId}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-black text-slate-300 group-hover:text-purple-600 transition-colors uppercase tracking-widest">
                View Details →
              </span>
            </div>
            {isTravel &&
              voucherDetails.expId &&
              voucherDetails.expId !== "—" && (
                <div className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-purple-500 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      💼
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Travel Expense ID
                      </div>
                      <div className="text-sm font-black text-teal-600 font-mono">
                        {voucherDetails.expId}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 group-hover:text-teal-600 transition-colors uppercase tracking-widest">
                    View Expense →
                  </span>
                </div>
              )}
          </div>

          {/* Ledger Entries Table */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Ledger Entries
            </label>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Ledger
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Journal Type
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">
                      Debit Amount
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">
                      Credit Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr className="bg-white dark:bg-slate-800">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {isRent ?
                        "Rent"
                      : isTravel ?
                        "Travel Expenses"
                      : "Consultant Fees"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      Debit
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 dark:text-white">
                      INR {voucherDetails.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-400">
                      -
                    </td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-800">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {entityName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      Credit
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-400">
                      -
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 dark:text-white">
                      INR {voucherDetails.netAmount.toLocaleString()}
                    </td>
                  </tr>
                  {voucherDetails.tdsAmount > 0 && (
                    <tr className="bg-white dark:bg-slate-800">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                        TDS Payable (194{isRent ? "I" : "J"})
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        Credit
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-400">
                        -
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 dark:text-white">
                        INR {voucherDetails.tdsAmount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Narration */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Narration
            </label>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {isTravel ?
                  voucherDetails.type === "travel-perdiem" ?
                    `Being per diem payment for ${entityName} (${voucherDetails.projectName}); Per Diem debited and Employee Payable credited.`
                  : `Being travel expenses for ${entityName} (${voucherDetails.projectName}); Travel Expenses debited and Employee Payable credited.`

                : isRent ?
                  voucherDetails.tdsAmount > 0 ?
                    `Being rent expense for ${voucherDetails.monthLabel} booked for ${entityName}; Rent debited and Rent Payable credited.`
                  : `Being rent expense for ${voucherDetails.monthLabel} booked for ${entityName}; Rent debited and Rent Payable credited.`

                : voucherDetails.tdsAmount > 0 ?
                  `Being consultant expense for ${voucherDetails.monthLabel} booked for ${entityName}; Consultant Fees debited with full amount, Sundry Creditors - Consultants credited with net amount and TDS Payable (194J) credited with TDS amount.`
                : `Being consultant expense for ${voucherDetails.monthLabel} booked for ${entityName}; Consultant Fees debited and Sundry Creditors - Consultants credited.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-3">
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
              className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white/80 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
