import React, { useState, useMemo, useRef } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  Pencil,
  Paperclip,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import type {
  GrantRecord,
  GrantCOAMapping,
  GrantUtilRecord,
} from "./AddGrantPage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

const fmtCurr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const buildMonthOptions = (
  periodStart: string,
  periodEnd: string,
): string[] => {
  if (!periodStart || !periodEnd) return [];
  const result: string[] = [];
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const mo = cur.toLocaleString("en-IN", { month: "short" });
    const yr = cur.getFullYear();
    result.push(`${mo} ${yr}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
};

// ─── Status badge ────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls =
    status === "Active" ?
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : status === "Inactive" ?
      "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
    : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  );
};

// ─── Section label helper ────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  num: number;
  label: string;
  color: string;
}> = ({ num, label, color }) => (
  <div className={`flex items-center gap-3 mb-5`}>
    <span
      className={`w-7 h-7 rounded-full bg-${color}-600 text-white flex items-center justify-center text-[11px] font-black`}>
      {num}
    </span>
    <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
      {label}
    </h2>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface GrantMasterPageProps {
  grants: GrantRecord[];
  coaMappings: GrantCOAMapping[];
  utilizationRecords: GrantUtilRecord[];
  onAddNew: () => void;
  onEditGrant: (grant: GrantRecord) => void;
  onUpdateGrants: (grants: GrantRecord[]) => void;
  onSaveCOA: (mappings: GrantCOAMapping[]) => void;
  onSaveUtilization: (records: GrantUtilRecord[]) => void;
  themeColor?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const GrantMasterPage: React.FC<GrantMasterPageProps> = ({
  grants,
  coaMappings,
  utilizationRecords,
  onAddNew,
  onEditGrant,
  onUpdateGrants,
  onSaveCOA,
  onSaveUtilization,
  themeColor = "indigo-600",
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "coa" | "utilization">(
    "list",
  );

  // ── List tab state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredGrants = useMemo(() => {
    const q = search.toLowerCase();
    return grants.filter((g) => {
      const matchSearch =
        !q ||
        (g.nameOfGrantor || g.name || "").toLowerCase().includes(q) ||
        (g.code || "").toLowerCase().includes(q);
      const matchStatus = !filterStatus || g.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [grants, search, filterStatus]);

  const handleDeleteGrant = (id: string) => {
    if (!confirm("Delete this grant record?")) return;
    onUpdateGrants(grants.filter((g) => g.id !== id));
  };

  // ── COA tab state ───────────────────────────────────────────────────────────
  const [coaGrantId, setCoaGrantId] = useState<string>("global");
  const existingCOA = coaMappings.find((m) => m.grantId === coaGrantId);
  const selectedGrantForCOA = grants.find((g) => g.id === coaGrantId);

  const [coaForm, setCOAForm] = useState({
    receiptBankAccount: existingCOA?.receiptBankAccount ?? "",
    receiptGrantorAccount: existingCOA?.receiptGrantorAccount ?? "",
    utilizationGrantorAccount: existingCOA?.utilizationGrantorAccount ?? "",
    utilizationGrantIncomeAccount:
      existingCOA?.utilizationGrantIncomeAccount ?? "",
  });

  const handleSelectCoaGrant = (id: string) => {
    setCoaGrantId(id);
    const m = coaMappings.find((c) => c.grantId === id);
    setCOAForm({
      receiptBankAccount: m?.receiptBankAccount ?? "",
      receiptGrantorAccount: m?.receiptGrantorAccount ?? "",
      utilizationGrantorAccount: m?.utilizationGrantorAccount ?? "",
      utilizationGrantIncomeAccount: m?.utilizationGrantIncomeAccount ?? "",
    });
  };

  const handleSaveCOA = () => {
    const filtered = coaMappings.filter((m) => m.grantId !== "global");
    onSaveCOA([
      ...filtered,
      {
        id: existingCOA?.id ?? Date.now(),
        grantId: "global",
        ...coaForm,
      },
    ]);
    alert("COA Mapping saved!");
  };

  // ── Utilization tab state ───────────────────────────────────────────────────
  const [utilGrantId, setUtilGrantId] = useState<string>("");
  const utilRows = utilizationRecords.filter((r) => r.grantId === utilGrantId);
  const selectedGrantForUtil = grants.find((g) => g.id === utilGrantId);
  const monthOptions =
    selectedGrantForUtil ?
      buildMonthOptions(
        selectedGrantForUtil.periodStart,
        selectedGrantForUtil.periodEnd,
      )
    : [];

  const emptyUtilForm = {
    month: "",
    budgetedAmount: 0,
    utilizedAmount: 0,
    remarks: "",
  };
  const [utilModal, setUtilModal] = useState(false);
  const [utilEditId, setUtilEditId] = useState<number | null>(null);
  const [utilForm, setUtilForm] = useState(emptyUtilForm);

  const openUtilAdd = () => {
    setUtilEditId(null);
    setUtilForm(emptyUtilForm);
    setUtilModal(true);
  };
  const openUtilEdit = (rec: GrantUtilRecord) => {
    setUtilEditId(rec.id);
    setUtilForm({
      month: rec.month,
      budgetedAmount: rec.budgetedAmount,
      utilizedAmount: rec.utilizedAmount,
      remarks: rec.remarks,
    });
    setUtilModal(true);
  };
  const handleDeleteUtil = (id: number) => {
    if (!confirm("Delete this utilization record?")) return;
    onSaveUtilization(utilizationRecords.filter((r) => r.id !== id));
  };
  const handleSaveUtil = () => {
    if (!utilForm.month || !utilGrantId) return;
    const balance =
      (utilForm.budgetedAmount || 0) - (utilForm.utilizedAmount || 0);
    if (utilEditId !== null) {
      onSaveUtilization(
        utilizationRecords.map((r) =>
          r.id === utilEditId ?
            { ...r, grantId: utilGrantId, ...utilForm, balance }
          : r,
        ),
      );
    } else {
      onSaveUtilization([
        ...utilizationRecords,
        { id: Date.now(), grantId: utilGrantId, ...utilForm, balance },
      ]);
    }
    setUtilModal(false);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputCls =
    "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-teal-400/10 outline-none transition dark:text-white font-bold text-sm";
  const selectCls = inputCls + " appearance-none cursor-pointer";

  const field = (label: string, child: React.ReactNode) => (
    <div>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">
        {label}
      </label>
      {child}
    </div>
  );

  const TABS = [
    { id: "list", label: "Grant List", icon: FileText },
    { id: "coa", label: "COA Mapping", icon: BookOpen },
    { id: "utilization", label: "Grant Utilization", icon: TrendingUp },
  ] as const;

  // ── COA tab header columns ─────────────────────────────────────────────────
  const coaHeaders = [
    "Grantor",
    "Receipt — Bank Dr",
    "Receipt — Grantor Cr",
    "Utilization — Grantor Dr",
    "Utilization — Grant Income Cr",
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* ── Ribbon Header ───────────────────────────────────────────────── */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white`}>
          <h2 className="text-xl font-extrabold tracking-tight">
            Grant Master
          </h2>
          <svg
            className="w-6 h-6 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <div className="p-8">
          {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-8 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${
                  activeTab === id ?
                    "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB: Grant List ─────────────────────────────────────────────── */}
          {activeTab === "list" && (
            <div>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-4 items-center mb-8">
                <div className="relative flex-1 min-w-[320px]">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search grant by grantor name or code…"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition dark:text-white font-medium"
                  />
                  <svg
                    className="w-5 h-5 absolute left-4 top-3.5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition">
                    ⚙️ Columns
                  </button>
                  <button
                    type="button"
                    onClick={onAddNew}
                    className={`flex items-center gap-2 px-8 py-3 bg-${themeColor} text-white rounded-2xl text-sm font-extrabold shadow-lg hover:shadow-xl transition transform hover:scale-105`}>
                    <span className="text-lg">+</span> Add
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Exporting Grant data to Excel…")}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-md">
                    📥 Export to Excel
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
                <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                      {[
                        "Grant ID",
                        "Name of Grantor",
                        "Code",
                        "Period Start",
                        "Period End",
                        "Approved Amount",
                        "Received Till Date",
                        "Balance Receivable",
                        "FUC Freq",
                        "Report Freq",
                        "Audited FUC",
                        "Audited Date",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filteredGrants.length === 0 ?
                      <tr>
                        <td
                          colSpan={14}
                          className="px-6 py-14 text-center text-slate-400 dark:text-slate-500">
                          <Plus
                            size={32}
                            className="mx-auto mb-3 opacity-20"
                          />
                          <p className="font-bold text-sm">No grants found.</p>
                          <p className="text-xs mt-1">
                            Click <strong>Create Grant</strong> to add the first
                            one.
                          </p>
                        </td>
                      </tr>
                    : filteredGrants.map((g, idx) => {
                        const balance =
                          (g.approvedGrantAmount || 0) -
                          (g.grantReceivedTillDate || 0);
                        return (
                          <tr
                            key={g.id}
                            className={`group transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-900/10 ${idx % 2 === 1 ? "bg-slate-50/30 dark:bg-slate-800/20" : ""}`}>
                            <td className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 text-[10px]">
                              {g.id}
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-800 dark:text-white max-w-[180px]">
                              {g.nameOfGrantor || g.name || "—"}
                            </td>
                            <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300">
                              {g.code}
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                              {g.periodStart || "—"}
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                              {g.periodEnd || "—"}
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-800 dark:text-white text-right">
                              {fmt(g.approvedGrantAmount)}
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-right">
                              {fmt(g.grantReceivedTillDate)}
                            </td>
                            <td
                              className={`px-5 py-4 font-black text-right ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                              {fmt(Math.abs(balance))}
                            </td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                              {g.fucFrequency || "—"}
                            </td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                              {g.projectReportFrequency || "—"}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  g.auditedFUC === "Y" ?
                                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                }`}>
                                {g.auditedFUC === "Y" ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                              {g.auditedFUCDate || "—"}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={g.status} />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditGrant(g)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition"
                                  title="Edit">
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGrant(g.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition"
                                  title="Delete">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between mt-8 px-4 gap-4">
                <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>
                    Showing {filteredGrants.length} of {grants.length} results
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: COA Mapping ────────────────────────────────────────────────── */}
          {activeTab === "coa" && (
            <div className="space-y-6">
              {/* Overview table of all mappings */}
              {coaMappings.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl overflow-hidden">
                  <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      All Configured Mappings
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                          {coaHeaders.map((h) => (
                            <th
                              key={h}
                              className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {coaMappings.map((m, idx) => {
                          const g = grants.find((gr) => gr.id === m.grantId);
                          return (
                            <tr
                              key={m.id}
                              className={`hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors ${idx % 2 === 1 ? "bg-slate-50/30 dark:bg-slate-800/20" : ""}`}>
                              <td className="px-5 py-3 font-bold text-slate-800 dark:text-white">
                                {g?.nameOfGrantor || g?.name || m.grantId}
                                <span className="ml-2 text-[9px] text-slate-400 font-normal">
                                  {g?.code}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                                {m.receiptBankAccount || "—"}
                              </td>
                              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                                {m.receiptGrantorAccount || "—"}
                              </td>
                              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                                {m.utilizationGrantorAccount || "—"}
                              </td>
                              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                                {m.utilizationGrantIncomeAccount || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COA edit form */}
              {
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl p-8 space-y-6">
                  <SectionHeader
                    num={1}
                    label={`Journal Entry — Receipt  ·  ${selectedGrantForCOA?.nameOfGrantor || selectedGrantForCOA?.name || ""}`}
                    color="blue"
                  />
                  {/* Visual preview */}
                  <div className="flex items-center gap-4 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-700/40 text-xs">
                    <span className="font-black text-slate-600 dark:text-slate-300 min-w-[36px]">
                      Dr
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white flex-1">
                      {coaForm.receiptBankAccount || (
                        <span className="italic text-slate-400">
                          Bank Account
                        </span>
                      )}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">
                      |
                    </span>
                    <span className="font-black text-slate-600 dark:text-slate-300 min-w-[36px] text-right">
                      Cr
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white flex-1 text-right">
                      {coaForm.receiptGrantorAccount || (
                        <span className="italic text-slate-400">
                          {selectedGrantForCOA?.nameOfGrantor || "Grantor"} A/c
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {field(
                      "Debit — Bank Account",
                      <input
                        type="text"
                        value={coaForm.receiptBankAccount}
                        onChange={(e) =>
                          setCOAForm((p) => ({
                            ...p,
                            receiptBankAccount: e.target.value,
                          }))
                        }
                        className={inputCls}
                        placeholder="e.g. HDFC Bank Current A/c"
                      />,
                    )}
                    {field(
                      `Credit — ${selectedGrantForCOA?.nameOfGrantor || "Grantor"} Account`,
                      <input
                        type="text"
                        value={coaForm.receiptGrantorAccount}
                        onChange={(e) =>
                          setCOAForm((p) => ({
                            ...p,
                            receiptGrantorAccount: e.target.value,
                          }))
                        }
                        className={inputCls}
                        placeholder={`e.g. ${selectedGrantForCOA?.nameOfGrantor || "Grantor"} Grant Received`}
                      />,
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                    <SectionHeader
                      num={2}
                      label="Journal Entry — Utilization"
                      color="orange"
                    />
                    <div className="flex items-center gap-4 px-5 py-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-700/40 text-xs mb-6">
                      <span className="font-black text-slate-600 dark:text-slate-300 min-w-[36px]">
                        Dr
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white flex-1">
                        {coaForm.utilizationGrantorAccount || (
                          <span className="italic text-slate-400">
                            {selectedGrantForCOA?.nameOfGrantor || "Grantor"}{" "}
                            A/c
                          </span>
                        )}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">
                        |
                      </span>
                      <span className="font-black text-slate-600 dark:text-slate-300 min-w-[36px] text-right">
                        Cr
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white flex-1 text-right">
                        {coaForm.utilizationGrantIncomeAccount || (
                          <span className="italic text-slate-400">
                            Grant Income A/c
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {field(
                        `Debit — ${selectedGrantForCOA?.nameOfGrantor || "Grantor"} Account`,
                        <input
                          type="text"
                          value={coaForm.utilizationGrantorAccount}
                          onChange={(e) =>
                            setCOAForm((p) => ({
                              ...p,
                              utilizationGrantorAccount: e.target.value,
                            }))
                          }
                          className={inputCls}
                          placeholder={`e.g. ${selectedGrantForCOA?.nameOfGrantor || "Grantor"} Utilization A/c`}
                        />,
                      )}
                      {field(
                        "Credit — Grant Income Account",
                        <input
                          type="text"
                          value={coaForm.utilizationGrantIncomeAccount}
                          onChange={(e) =>
                            setCOAForm((p) => ({
                              ...p,
                              utilizationGrantIncomeAccount: e.target.value,
                            }))
                          }
                          className={inputCls}
                          placeholder="e.g. Grant Income"
                        />,
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleSaveCOA}
                      className="inline-flex items-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-2xl transition shadow-xl">
                      <CheckCircle2 size={14} /> Save COA Mapping
                    </button>
                  </div>
                </div>
              }
            </div>
          )}

          {/* ── TAB: Grant Utilization ───────────────────────────────────────────── */}
          {activeTab === "utilization" && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl p-8 space-y-6">
              {/* Grant selector */}
              <div className="flex items-end gap-6 flex-wrap">
                <div className="w-80">
                  {field(
                    "Select Grant",
                    <select
                      value={utilGrantId}
                      onChange={(e) => setUtilGrantId(e.target.value)}
                      className={selectCls}>
                      <option value="">— Choose a Grant —</option>
                      {grants.map((g) => (
                        <option
                          key={g.id}
                          value={g.id}>
                          {g.nameOfGrantor || g.name} ({g.code})
                        </option>
                      ))}
                    </select>,
                  )}
                </div>
                {utilGrantId && (
                  <button
                    type="button"
                    onClick={openUtilAdd}
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-widest transition shadow-sm mb-0.5">
                    <Plus size={13} /> Add Month
                  </button>
                )}
              </div>

              {/* Summary cards */}
              {utilGrantId && selectedGrantForUtil && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Approved Amount",
                      val: fmtCurr(selectedGrantForUtil.approvedGrantAmount),
                      color: "blue",
                    },
                    {
                      label: "Received Till Date",
                      val: fmtCurr(selectedGrantForUtil.grantReceivedTillDate),
                      color: "teal",
                    },
                    {
                      label: "Total Utilized",
                      val: fmtCurr(
                        utilRows.reduce((s, r) => s + r.utilizedAmount, 0),
                      ),
                      color: "orange",
                    },
                    {
                      label: "Balance Receivable",
                      val: fmtCurr(selectedGrantForUtil.balanceGrantReceivable),
                      color: "emerald",
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className={`rounded-xl border p-4 bg-${color}-50 dark:bg-${color}-900/20 border-${color}-100 dark:border-${color}-700/40`}>
                      <p
                        className={`text-[9px] font-black text-${color}-500 dark:text-${color}-400 uppercase tracking-widest mb-1`}>
                        {label}
                      </p>
                      <p
                        className={`text-base font-black text-${color}-700 dark:text-${color}-300`}>
                        {val}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Month table */}
              {utilGrantId ?
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        {[
                          "Month",
                          "Budgeted (₹)",
                          "Utilized (₹)",
                          "Balance (₹)",
                          "% Utilized",
                          "Remarks",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {utilRows.length === 0 ?
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-xs text-slate-400">
                            No records yet. Click <strong>Add Month</strong> to
                            begin tracking.
                          </td>
                        </tr>
                      : utilRows.map((row, idx) => {
                          const pct =
                            row.budgetedAmount > 0 ?
                              (
                                (row.utilizedAmount / row.budgetedAmount) *
                                100
                              ).toFixed(1)
                            : "0.0";
                          const over = row.utilizedAmount > row.budgetedAmount;
                          return (
                            <tr
                              key={row.id}
                              className={`border-b border-slate-100 dark:border-slate-700/60 ${idx % 2 === 1 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}`}>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                                {row.month}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                {fmt(row.budgetedAmount)}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                                {fmt(row.utilizedAmount)}
                              </td>
                              <td
                                className={`px-4 py-3 font-bold ${over ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {over ? "−" : ""}
                                {fmt(Math.abs(row.balance))}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 min-w-[60px]">
                                    <div
                                      className={`h-1.5 rounded-full ${over ? "bg-red-500" : "bg-teal-500"}`}
                                      style={{
                                        width: `${Math.min(parseFloat(pct), 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className={`text-[10px] font-black ${over ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}`}>
                                    {pct}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[14rem] truncate">
                                {row.remarks || "—"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openUtilEdit(row)}
                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition">
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUtil(row.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                    {utilRows.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600">
                          <td className="px-4 py-3 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                            Total
                          </td>
                          <td className="px-4 py-3 font-black text-slate-800 dark:text-white text-xs">
                            {fmt(
                              utilRows.reduce(
                                (s, r) => s + r.budgetedAmount,
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 font-black text-slate-800 dark:text-white text-xs">
                            {fmt(
                              utilRows.reduce(
                                (s, r) => s + r.utilizedAmount,
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 font-black text-xs">
                            {fmt(
                              utilRows.reduce(
                                (s, r) => s + r.budgetedAmount,
                                0,
                              ) -
                                utilRows.reduce(
                                  (s, r) => s + r.utilizedAmount,
                                  0,
                                ),
                            )}
                          </td>
                          <td colSpan={3} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              : <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <BarChart3
                    size={40}
                    className="mx-auto mb-3 opacity-30"
                  />
                  <p className="text-sm font-bold">
                    Select a grant above to view month-wise utilization.
                  </p>
                </div>
              }

              {/* Add/Edit modal */}
              {utilModal && (
                <div className="rounded-xl border-2 border-teal-200 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-900/10 p-5 space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-widest">
                      {utilEditId !== null ? "Edit Month" : "Add Month Record"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUtilModal(false)}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Month *
                      </label>
                      {monthOptions.length > 0 ?
                        <select
                          value={utilForm.month}
                          onChange={(e) =>
                            setUtilForm((p) => ({
                              ...p,
                              month: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30">
                          <option value="">Select Month</option>
                          {monthOptions.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      : <input
                          type="text"
                          value={utilForm.month}
                          onChange={(e) =>
                            setUtilForm((p) => ({
                              ...p,
                              month: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                          placeholder="e.g. Apr 2024"
                        />
                      }
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Budgeted Amount (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={utilForm.budgetedAmount || ""}
                        onChange={(e) =>
                          setUtilForm((p) => ({
                            ...p,
                            budgetedAmount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Utilized Amount (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={utilForm.utilizedAmount || ""}
                        onChange={(e) =>
                          setUtilForm((p) => ({
                            ...p,
                            utilizedAmount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Balance (Auto)
                      </label>
                      <div className="px-3 py-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black dark:text-white cursor-not-allowed">
                        {fmt(
                          (utilForm.budgetedAmount || 0) -
                            (utilForm.utilizedAmount || 0),
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={utilForm.remarks}
                        onChange={(e) =>
                          setUtilForm((p) => ({
                            ...p,
                            remarks: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                        placeholder="Optional notes for this month"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setUtilModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest transition">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUtil}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-widest transition shadow">
                      <CheckCircle2 size={13} /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* /p-8 */}
      </div>
      {/* /card */}
    </div>
  );
};
