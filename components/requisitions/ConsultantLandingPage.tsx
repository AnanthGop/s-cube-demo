import React, { useMemo } from "react";
import { ArrowRight, FileText, BellRing, Receipt, Network } from "lucide-react";
import { countConsultantVoucherEligibleEntries } from "./consultantVoucherUtils";

interface ConsultantLandingPageProps {
  data: any[];
  onOpenSummary: () => void;
  onOpenRenewals: () => void;
  onOpenVouchers: () => void;
  onOpenMapToCoa: () => void;
  isDarkMode?: boolean;
}

export const ConsultantLandingPage: React.FC<ConsultantLandingPageProps> = ({
  data,
  onOpenSummary,
  onOpenRenewals,
  onOpenVouchers,
  onOpenMapToCoa,
  isDarkMode = false,
}) => {
  const cardStats = useMemo(() => {
    const total = data.length;
    const today = new Date();
    const twoMonthsFromNow = new Date(today);
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    const renewals = data.filter((entry) => {
      const rawEndDate =
        String(
          entry?.endDate ||
            entry?.contractEndDate ||
            entry?.agreementEndDate ||
            "",
        ).trim();
      if (!rawEndDate) return false;
      const endDate = new Date(rawEndDate);
      return !Number.isNaN(endDate.getTime()) && endDate >= today && endDate <= twoMonthsFromNow;
    }).length;

    const vouchers = countConsultantVoucherEligibleEntries(data);

    return { total, renewals, vouchers };
  }, [data]);

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div
        className={`rounded-3xl border shadow-2xl overflow-hidden ${
          isDarkMode ?
            "border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white"
          : "border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 text-slate-900"
        }`}>
        <div className="p-8 md:p-10">
          <p
            className={`text-[11px] font-black uppercase tracking-[0.25em] ${
              isDarkMode ? "text-cyan-300" : "text-indigo-600"
            }`}>
            Requisitions / Consultant
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
            Consultants - Expense Management
          </h1>
          <p
            className={`mt-3 text-sm max-w-2xl ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}>
            Choose a consultant workflow to continue. Counts reflect current records.
          </p>
        </div>

        <div className="px-6 pb-8 md:px-10 md:pb-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <button
              onClick={onOpenSummary}
              className={`group rounded-2xl border backdrop-blur-sm p-6 text-left transition-all ${
                isDarkMode ?
                  "border-cyan-300/20 bg-white/5 hover:bg-cyan-400/10 hover:border-cyan-300/40"
                : "border-indigo-200 bg-white/90 hover:bg-indigo-50 hover:border-indigo-300"
              }`}>
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isDarkMode ?
                      "bg-cyan-400/20 text-cyan-300"
                    : "bg-indigo-100 text-indigo-700"
                  }`}>
                  <FileText size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className={`group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? "text-cyan-300/70" : "text-indigo-600/70"
                  }`}
                />
              </div>
              <h2 className="mt-5 text-lg font-black tracking-tight">
                Consultants Master ({cardStats.total})
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Open the full consultant requisition page.
              </p>
            </button>

            <button
              onClick={onOpenRenewals}
              className={`group rounded-2xl border backdrop-blur-sm p-6 text-left transition-all ${
                isDarkMode ?
                  "border-amber-300/20 bg-white/5 hover:bg-amber-400/10 hover:border-amber-300/40"
                : "border-amber-200 bg-white/90 hover:bg-amber-50 hover:border-amber-300"
              }`}>
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isDarkMode ?
                      "bg-amber-400/20 text-amber-300"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                  <BellRing size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className={`group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? "text-amber-300/70" : "text-amber-600/70"
                  }`}
                />
              </div>
              <h2 className="mt-5 text-lg font-black tracking-tight">
                Renewals in next 2 months ({cardStats.renewals})
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Contracts due for renewal in the upcoming cycle.
              </p>
            </button>

            <button
              onClick={onOpenVouchers}
              className={`group rounded-2xl border backdrop-blur-sm p-6 text-left transition-all ${
                isDarkMode ?
                  "border-emerald-300/20 bg-white/5 hover:bg-emerald-400/10 hover:border-emerald-300/40"
                : "border-emerald-200 bg-white/90 hover:bg-emerald-50 hover:border-emerald-300"
              }`}>
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isDarkMode ?
                      "bg-emerald-400/20 text-emerald-300"
                    : "bg-emerald-100 text-emerald-700"
                  }`}>
                  <Receipt size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className={`group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? "text-emerald-300/70" : "text-emerald-600/70"
                  }`}
                />
              </div>
              <h2 className="mt-5 text-lg font-black tracking-tight">
                Consultant Vouchers ({cardStats.vouchers})
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Records currently eligible for voucher processing.
              </p>
            </button>

            <button
              onClick={onOpenMapToCoa}
              className={`group rounded-2xl border backdrop-blur-sm p-6 text-left transition-all ${
                isDarkMode ?
                  "border-violet-300/20 bg-white/5 hover:bg-violet-400/10 hover:border-violet-300/40"
                : "border-violet-200 bg-white/90 hover:bg-violet-50 hover:border-violet-300"
              }`}>
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isDarkMode ?
                      "bg-violet-400/20 text-violet-300"
                    : "bg-violet-100 text-violet-700"
                  }`}>
                  <Network size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className={`group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? "text-violet-300/70" : "text-violet-600/70"
                  }`}
                />
              </div>
              <h2 className="mt-5 text-lg font-black tracking-tight">
                Map to Chart of Accounts
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Map consultant entries to chart of accounts for posting.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
