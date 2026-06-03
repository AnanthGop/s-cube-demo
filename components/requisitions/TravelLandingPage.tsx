import React, { useMemo } from "react";
import { ArrowRight, FileText, Network, Receipt, Wallet } from "lucide-react";

interface TravelLandingPageProps {
  data: any[];
  onOpenSummary: () => void;
  onOpenExpenseSubmission: () => void;
  onOpenVouchers: () => void;
  onOpenMapToCoa: () => void;
  onOpenPerDiem: () => void;
  perDiemCount?: number;
  isDarkMode?: boolean;
}

export const TravelLandingPage: React.FC<TravelLandingPageProps> = ({
  data,
  onOpenSummary,
  onOpenExpenseSubmission,
  onOpenVouchers,
  onOpenMapToCoa,
  onOpenPerDiem,
  perDiemCount = 0,
  isDarkMode = false,
}) => {
  const cardStats = useMemo(() => {
    const total = data.length;
    const vouchers = data.filter((entry) => entry.autoPosting === "Y").length;
    return { total, vouchers };
  }, [data]);

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div
        className={`rounded-3xl border shadow-2xl overflow-hidden ${
          isDarkMode ?
            "border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white"
          : "border-slate-200 bg-gradient-to-br from-white via-slate-50 to-purple-50 text-slate-900"
        }`}>
        <div className="p-8 md:p-10">
          <p
            className={`text-[11px] font-black uppercase tracking-[0.25em] ${
              isDarkMode ? "text-purple-300" : "text-purple-600"
            }`}>
            Requisitions / Travel
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
            Travel - Expense Management
          </h1>
          <p
            className={`mt-3 text-sm max-w-2xl ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}>
            Choose a travel workflow to continue. Counts reflect current
            records.
          </p>
        </div>

        <div className="px-6 pb-8 md:px-10 md:pb-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <button
              onClick={onOpenSummary}
              className={`group rounded-2xl border backdrop-blur-sm p-6 text-left transition-all ${
                isDarkMode ?
                  "border-purple-300/20 bg-white/5 hover:bg-purple-400/10 hover:border-purple-300/40"
                : "border-purple-200 bg-white/90 hover:bg-purple-50 hover:border-purple-300"
              }`}>
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isDarkMode ?
                      "bg-purple-400/20 text-purple-300"
                    : "bg-purple-100 text-purple-700"
                  }`}>
                  <FileText size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className={`group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? "text-purple-300/70" : "text-purple-600/70"
                  }`}
                />
              </div>
              <h2 className="mt-5 text-lg font-black tracking-tight">
                Travel Requisitions ({cardStats.total})
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Open the full travel requisition page.
              </p>
            </button>

            <button
              onClick={onOpenExpenseSubmission}
              className={`group rounded-2xl border backdrop-blur-sm p-6 text-left transition-all ${
                isDarkMode ?
                  "border-teal-300/20 bg-white/5 hover:bg-teal-400/10 hover:border-teal-300/40"
                : "border-teal-200 bg-white/90 hover:bg-teal-50 hover:border-teal-300"
              }`}>
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isDarkMode ?
                      "bg-teal-400/20 text-teal-300"
                    : "bg-teal-100 text-teal-700"
                  }`}>
                  <Receipt size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className={`group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? "text-teal-300/70" : "text-teal-600/70"
                  }`}
                />
              </div>
              <h2 className="mt-5 text-lg font-black tracking-tight">
                Travel Expense Submission
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Submit post-travel expense claims and settlement requests.
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
                Travel Vouchers ({cardStats.vouchers})
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Records currently eligible for voucher processing.
              </p>
            </button>

            <button
              onClick={onOpenPerDiem}
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
                  <Wallet size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className={`group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? "text-amber-300/70" : "text-amber-600/70"
                  }`}
                />
              </div>
              <h2 className="mt-5 text-lg font-black tracking-tight">
                Travel Policy ({perDiemCount})
              </h2>
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                Configure per diem rates, category rules and policy limits.
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
                Map travel entries to chart of accounts for posting.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
