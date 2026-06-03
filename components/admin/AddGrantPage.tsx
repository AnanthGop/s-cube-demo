import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Pencil,
  Paperclip,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { CompactDatePicker } from "../shared/CompactDatePicker";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GrantRecord {
  id: string;
  nameOfGrantor: string;
  code: string;
  periodStart: string;
  periodEnd: string;
  approvedGrantAmount: number;
  grantReceivedTillDate: number;
  balanceGrantReceivable: number;
  fucFrequency: string;
  projectReportFrequency: string;
  auditedFUC: "Y" | "N";
  auditedFUCDate: string;
  status: string;
  creator: string;
  date: string;
}

export interface GrantAttachRecord {
  id: number;
  grantId: string;
  documentTitle: string;
  documentDate: string;
  period: string;
  amount: number;
  remarks: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface GrantCOAMapping {
  id: number;
  grantId: string;
  receiptBankAccount: string;
  receiptGrantorAccount: string;
  utilizationGrantorAccount: string;
  utilizationGrantIncomeAccount: string;
}

export interface GrantUtilRecord {
  id: number;
  grantId: string;
  month: string;
  budgetedAmount: number;
  utilizedAmount: number;
  balance: number;
  remarks: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const fmtCurr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const getDDMMYYYY = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const FREQ_OPTIONS = ["Monthly", "Quarterly", "Half-Yearly", "Annual"];

const MONTHS = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

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

// ─── Sub-component: Attachment Tab ───────────────────────────────────────────

interface AttachTabProps {
  label: string;
  records: GrantAttachRecord[];
  grantId: string;
  showAmount?: boolean;
  showPeriod?: boolean;
  onUpdate: (records: GrantAttachRecord[]) => void;
  onExtractPDFData?: (data: Partial<GrantRecord>) => void;
  isMOUTab?: boolean;
}

const AttachmentTab: React.FC<AttachTabProps> = ({
  label,
  records,
  grantId,
  showAmount = false,
  showPeriod = false,
  onUpdate,
  onExtractPDFData,
  isMOUTab = false,
}) => {
  const emptyForm = {
    documentTitle: "",
    documentDate: "",
    period: "",
    amount: 0,
    remarks: "",
    fileName: "",
    fileType: "",
    fileSize: 0,
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFileInputKey((k) => k + 1);
    setModalOpen(true);
  };

  const openEdit = (rec: GrantAttachRecord) => {
    setEditId(rec.id);
    setForm({
      documentTitle: rec.documentTitle,
      documentDate: rec.documentDate,
      period: rec.period,
      amount: rec.amount,
      remarks: rec.remarks,
      fileName: rec.fileName,
      fileType: rec.fileType,
      fileSize: rec.fileSize,
    });
    setFileInputKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this record?")) return;
    onUpdate(records.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    if (!form.documentTitle) return;
    if (editId !== null) {
      onUpdate(
        records.map((r) => (r.id === editId ? { ...r, grantId, ...form } : r)),
      );
    } else {
      onUpdate([...records, { id: Date.now(), grantId, ...form }]);
    }
    setModalOpen(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setCurrentFile(f);
      setForm((p) => ({
        ...p,
        fileName: f.name,
        fileType: f.type,
        fileSize: f.size,
      }));
    }
  };

  const handleExtractPDFData = async () => {
    if (!currentFile || !isMOUTab || !onExtractPDFData) return;

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("pdf", currentFile);

      const response = await fetch("/api/extract-grant-data", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract data from PDF");
      }

      const extractedData = await response.json();
      onExtractPDFData(extractedData);
      alert(
        "✅ Grant data extracted successfully! The form has been populated. Please review and save.",
      );
    } catch (error) {
      console.error("PDF extraction error:", error);
      alert(
        "❌ Failed to extract data from PDF. Please ensure the file is a valid MOU document and try again.",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
          {label}
        </h3>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-widest transition shadow-sm">
          <Plus size={13} /> Add Record
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Document Title
              </th>
              <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Date
              </th>
              {showPeriod && (
                <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Period
                </th>
              )}
              {showAmount && (
                <th className="text-right px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Amount (₹)
                </th>
              )}
              <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Remarks
              </th>
              <th className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                File
              </th>
              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ?
              <tr>
                <td
                  colSpan={showAmount || showPeriod ? 7 : 5}
                  className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                  No records yet. Click <strong>Add Record</strong> to add one.
                </td>
              </tr>
            : records.map((rec, idx) => (
                <tr
                  key={rec.id}
                  className={`border-b border-slate-100 dark:border-slate-700/60 ${idx % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/20"}`}>
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                    {rec.documentTitle}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {rec.documentDate}
                  </td>
                  {showPeriod && (
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {rec.period || "—"}
                    </td>
                  )}
                  {showAmount && (
                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-white">
                      {rec.amount ? fmt(rec.amount) : "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[16rem] truncate">
                    {rec.remarks || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {rec.fileName ?
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        <Paperclip size={11} />
                        <span className="truncate max-w-[140px]">
                          {rec.fileName}
                        </span>
                      </span>
                    : <span className="text-slate-300 dark:text-slate-600 text-[10px]">
                        None
                      </span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(rec)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition">
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="rounded-xl border-2 border-teal-200 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-900/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-widest">
              {editId !== null ? "Edit Record" : "New Record"}
            </span>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Document Title *
              </label>
              <input
                type="text"
                value={form.documentTitle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, documentTitle: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                placeholder="e.g. Signed MOU Document"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Date
              </label>
              <CompactDatePicker
                value={form.documentDate}
                onChange={(value) =>
                  setForm((p) => ({ ...p, documentDate: value }))
                }
                className="border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            {showPeriod && (
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Period
                </label>
                <input
                  type="text"
                  value={form.period}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, period: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                  placeholder="e.g. Q1 FY 2025-26"
                />
              </div>
            )}
            {showAmount && (
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                  placeholder="0"
                />
              </div>
            )}
            <div className="md:col-span-3">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Remarks
              </label>
              <input
                type="text"
                value={form.remarks}
                onChange={(e) =>
                  setForm((p) => ({ ...p, remarks: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/30"
                placeholder="Optional remarks"
              />
            </div>
            {/* File upload */}
            <div className="md:col-span-3">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Attachment (PDF / Image)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor={`attach-file-${label}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 cursor-pointer hover:border-teal-400 hover:text-teal-600 transition">
                    <Paperclip size={13} />
                    Choose File
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {form.fileName || "No file chosen"}
                  </span>
                  {form.fileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentFile(null);
                        setForm((p) => ({
                          ...p,
                          fileName: "",
                          fileType: "",
                          fileSize: 0,
                        }));
                      }}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition">
                      <X size={12} />
                    </button>
                  )}
                </div>
                {isMOUTab &&
                  form.fileName &&
                  currentFile &&
                  form.fileType === "application/pdf" && (
                    <button
                      type="button"
                      onClick={handleExtractPDFData}
                      disabled={isExtracting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wide transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      {isExtracting ?
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                          Extracting...
                        </>
                      : <>✨ Use AI to read this file</>}
                    </button>
                  )}
              </div>
              <input
                key={fileInputKey}
                id={`attach-file-${label}`}
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest transition">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-widest transition shadow">
              <CheckCircle2 size={13} />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface AddGrantPageProps {
  onCancel: () => void;
  themeColor?: string;
  existingGrants: GrantRecord[];
  initialGrant?: GrantRecord; // pre-fill when editing
  mouRecords: GrantAttachRecord[];
  budgetRecords: GrantAttachRecord[];
  fucRecords: GrantAttachRecord[];
  reportRecords: GrantAttachRecord[];
  coaMappings: GrantCOAMapping[];
  utilizationRecords: GrantUtilRecord[];
  onSaveDetails: (grant: GrantRecord) => void;
  onSaveMOU: (records: GrantAttachRecord[]) => void;
  onSaveBudget: (records: GrantAttachRecord[]) => void;
  onSaveFUC: (records: GrantAttachRecord[]) => void;
  onSaveReports: (records: GrantAttachRecord[]) => void;
  onSaveCOA: (mappings: GrantCOAMapping[]) => void;
  onSaveUtilization: (records: GrantUtilRecord[]) => void;
}

export const AddGrantPage: React.FC<AddGrantPageProps> = ({
  onCancel,
  themeColor = "indigo-600",
  existingGrants,
  initialGrant,
  mouRecords,
  budgetRecords,
  fucRecords,
  reportRecords,
  coaMappings,
  utilizationRecords,
  onSaveDetails,
  onSaveMOU,
  onSaveBudget,
  onSaveFUC,
  onSaveReports,
  onSaveCOA,
  onSaveUtilization,
}) => {
  // ── Main tab ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    "details" | "attachments" | "coa" | "utilization"
  >("details");

  // ── Attachment sub-tab ────────────────────────────────────────────────────
  const [attachSubTab, setAttachSubTab] = useState<
    "mou" | "budget" | "fuc" | "reports"
  >("mou");

  // ── Local copies of sub-records (flushed to parent on Save) ───────────────
  const [localMOU, setLocalMOU] = useState<GrantAttachRecord[]>(mouRecords);
  const [localBudget, setLocalBudget] =
    useState<GrantAttachRecord[]>(budgetRecords);
  const [localFUC, setLocalFUC] = useState<GrantAttachRecord[]>(fucRecords);
  const [localReports, setLocalReports] =
    useState<GrantAttachRecord[]>(reportRecords);

  // ── Grant details form ────────────────────────────────────────────────────
  const nextId = () => {
    const used = existingGrants.map((g) =>
      parseInt(g.id.replace("GR-", ""), 10),
    );
    const max = used.length ? Math.max(...used) : 0;
    return `GR-${String(max + 1).padStart(3, "0")}`;
  };

  const [details, setDetails] = useState<
    Omit<GrantRecord, "id" | "creator" | "date">
  >({
    nameOfGrantor: initialGrant?.nameOfGrantor ?? "",
    code: initialGrant?.code ?? "",
    periodStart: initialGrant?.periodStart ?? "",
    periodEnd: initialGrant?.periodEnd ?? "",
    approvedGrantAmount: initialGrant?.approvedGrantAmount ?? 0,
    grantReceivedTillDate: initialGrant?.grantReceivedTillDate ?? 0,
    balanceGrantReceivable: initialGrant?.balanceGrantReceivable ?? 0,
    fucFrequency: initialGrant?.fucFrequency ?? "Quarterly",
    projectReportFrequency: initialGrant?.projectReportFrequency ?? "Quarterly",
    auditedFUC: initialGrant?.auditedFUC ?? "N",
    auditedFUCDate: initialGrant?.auditedFUCDate ?? "",
    status: initialGrant?.status ?? "Active",
  });

  const [detailsSaved, setDetailsSaved] = useState(!!initialGrant);
  const [currentGrantId, setCurrentGrantId] = useState<string>(
    initialGrant?.id ?? "",
  );

  const balance =
    (details.approvedGrantAmount || 0) - (details.grantReceivedTillDate || 0);

  const handleSaveDetails = () => {
    if (!details.nameOfGrantor || !details.code) {
      alert("Name of Grantor and Grant Code are required.");
      return;
    }
    const id = detailsSaved ? currentGrantId : nextId();
    const record: GrantRecord = {
      ...details,
      balanceGrantReceivable: balance,
      id,
      creator: "Admin",
      date: getDDMMYYYY(),
    };
    onSaveDetails(record);
    setCurrentGrantId(id);
    setDetailsSaved(true);
    alert(`Grant "${details.nameOfGrantor}" saved successfully!`);
  };

  // ── COA Mapping ───────────────────────────────────────────────────────────
  const existingCOA = coaMappings.find((m) => m.grantId === currentGrantId);
  const [coaForm, setCOAForm] = useState<
    Omit<GrantCOAMapping, "id" | "grantId">
  >({
    receiptBankAccount: existingCOA?.receiptBankAccount ?? "",
    receiptGrantorAccount: existingCOA?.receiptGrantorAccount ?? "",
    utilizationGrantorAccount: existingCOA?.utilizationGrantorAccount ?? "",
    utilizationGrantIncomeAccount:
      existingCOA?.utilizationGrantIncomeAccount ?? "",
  });

  const handleSaveCOA = () => {
    if (!currentGrantId) {
      alert("Please save Grant Details first before configuring COA mapping.");
      return;
    }
    const filtered = coaMappings.filter((m) => m.grantId !== currentGrantId);
    onSaveCOA([
      ...filtered,
      {
        id: existingCOA?.id ?? Date.now(),
        grantId: currentGrantId,
        ...coaForm,
      },
    ]);
    alert("COA Mapping saved!");
  };

  // ── Grant Utilization ─────────────────────────────────────────────────────
  const [utilGrantId, setUtilGrantId] = useState<string>("");
  const utilRows = utilizationRecords.filter((r) => r.grantId === utilGrantId);
  const selectedGrantForUtil = existingGrants.find((g) => g.id === utilGrantId);
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

  // ── Tab config ────────────────────────────────────────────────────────────
  const TABS = [
    { id: "details", label: "Grant Details", icon: FileText },
    { id: "attachments", label: "Attachments", icon: Paperclip },
  ] as const;

  const ATTACH_TABS = [
    { id: "mou", label: "MOU" },
    { id: "budget", label: "Approved Budget" },
    { id: "fuc", label: "FUC Submission" },
    { id: "reports", label: "Project Reports" },
  ] as const;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const field = (label: string, child: React.ReactNode, hint?: string) => (
    <div>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">
        {label}
      </label>
      {child}
      {hint && <p className="mt-1 text-[9px] text-slate-400 px-0.5">{hint}</p>}
    </div>
  );

  const inputCls =
    "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-teal-400/10 outline-none transition dark:text-white font-bold text-sm";
  const selectCls = inputCls + " appearance-none cursor-pointer";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Ribbon Header */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center gap-4 text-white`}>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-white/20 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold tracking-tight">
              {detailsSaved ? details.nameOfGrantor || "Grant" : "Create Grant"}
            </h2>
            {detailsSaved && (
              <p className="text-white/70 text-xs font-medium mt-0.5">
                Grant ID: {currentGrantId} · {details.code}
              </p>
            )}
          </div>
          {detailsSaved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>

        <div className="p-8">
          {/* Tab Bar */}
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

          {/* ── TAB: Grant Details ─────────────────────────────────────────────── */}
          {activeTab === "details" && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl p-8 space-y-8">
              {/* Section 1: Grantor Identification */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                    Grantor Identification
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {field(
                    "Name of Grantor *",
                    <input
                      type="text"
                      value={details.nameOfGrantor}
                      onChange={(e) =>
                        setDetails((p) => ({
                          ...p,
                          nameOfGrantor: e.target.value,
                        }))
                      }
                      className={inputCls}
                      placeholder="e.g. UNESCO, USAID, Ford Foundation"
                    />,
                  )}
                  {field(
                    "Grant Code *",
                    <input
                      type="text"
                      value={details.code}
                      onChange={(e) =>
                        setDetails((p) => ({ ...p, code: e.target.value }))
                      }
                      className={inputCls}
                      placeholder="e.g. UN-2024, FF-EDUC-01"
                    />,
                  )}
                  {field(
                    "Status",
                    <select
                      value={details.status}
                      onChange={(e) =>
                        setDetails((p) => ({ ...p, status: e.target.value }))
                      }
                      className={selectCls}>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Closed</option>
                    </select>,
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700" />

              {/* Section 2: Period & Amounts */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                    Period of Grant & Financial Details
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {field(
                    "Period Start Date",
                    <CompactDatePicker
                      value={details.periodStart}
                      onChange={(value) =>
                        setDetails((p) => ({
                          ...p,
                          periodStart: value,
                        }))
                      }
                      className={inputCls}
                    />,
                  )}
                  {field(
                    "Period End Date",
                    <CompactDatePicker
                      value={details.periodEnd}
                      onChange={(value) =>
                        setDetails((p) => ({ ...p, periodEnd: value }))
                      }
                      className={inputCls}
                    />,
                  )}
                  {field(
                    "Approved Grant Amount (₹) *",
                    <input
                      type="number"
                      min={0}
                      value={details.approvedGrantAmount || ""}
                      onChange={(e) =>
                        setDetails((p) => ({
                          ...p,
                          approvedGrantAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={inputCls}
                      placeholder="0"
                    />,
                  )}
                  {field(
                    "Grant Received Till Date (₹)",
                    <input
                      type="number"
                      min={0}
                      value={details.grantReceivedTillDate || ""}
                      onChange={(e) =>
                        setDetails((p) => ({
                          ...p,
                          grantReceivedTillDate:
                            parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={inputCls}
                      placeholder="0"
                    />,
                  )}
                  {field(
                    "Balance Grant Receivable (₹)",
                    <div
                      className={`px-4 py-3 rounded-xl border font-black text-sm cursor-not-allowed ${
                        balance >= 0 ?
                          "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400"
                      }`}>
                      {fmtCurr(balance)}
                    </div>,
                    "Auto-calculated: Approved − Received",
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700" />

              {/* Section 3: Reporting & Compliance */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                    Reporting & Compliance
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {field(
                    "FUC Frequency",
                    <select
                      value={details.fucFrequency}
                      onChange={(e) =>
                        setDetails((p) => ({
                          ...p,
                          fucFrequency: e.target.value,
                        }))
                      }
                      className={selectCls}>
                      {FREQ_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>,
                  )}
                  {field(
                    "Project Report Frequency",
                    <select
                      value={details.projectReportFrequency}
                      onChange={(e) =>
                        setDetails((p) => ({
                          ...p,
                          projectReportFrequency: e.target.value,
                        }))
                      }
                      className={selectCls}>
                      {FREQ_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>,
                  )}
                  {field(
                    "Audited FUC (Y / N)",
                    <div className="flex gap-3 pt-1">
                      {(["Y", "N"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            setDetails((p) => ({ ...p, auditedFUC: v }))
                          }
                          className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest border transition ${
                            details.auditedFUC === v ?
                              "bg-teal-600 border-teal-600 text-white shadow"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-teal-400"
                          }`}>
                          {v === "Y" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>,
                  )}
                  {details.auditedFUC === "Y" &&
                    field(
                      "Audited FUC Date",
                      <CompactDatePicker
                        value={details.auditedFUCDate}
                        onChange={(value) =>
                          setDetails((p) => ({
                            ...p,
                            auditedFUCDate: value,
                          }))
                        }
                        className={inputCls}
                      />,
                    )}
                </div>
              </div>

              {/* Save button */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition border border-slate-200 dark:border-slate-700">
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="inline-flex items-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-2xl transition shadow-xl">
                  <Save size={14} /> Save Grant Details
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: Attachments ──────────────────────────────────────────────── */}
          {activeTab === "attachments" && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl p-8">
              {!detailsSaved && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  ⚠ Please save Grant Details first to link attachment records
                  to this grant.
                </div>
              )}

              {/* Attachment sub-tabs */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-fit flex-wrap">
                {ATTACH_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAttachSubTab(id)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${
                      attachSubTab === id ?
                        "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                {attachSubTab === "mou" && (
                  <AttachmentTab
                    label="MOU Documents"
                    records={localMOU.filter(
                      (r) => !currentGrantId || r.grantId === currentGrantId,
                    )}
                    grantId={currentGrantId}
                    isMOUTab={true}
                    onExtractPDFData={(extractedData) => {
                      setDetails((p) => ({
                        ...p,
                        nameOfGrantor:
                          extractedData.nameOfGrantor || p.nameOfGrantor,
                        code: extractedData.code || p.code,
                        periodStart: extractedData.periodStart || p.periodStart,
                        periodEnd: extractedData.periodEnd || p.periodEnd,
                        approvedGrantAmount:
                          extractedData.approvedGrantAmount ||
                          p.approvedGrantAmount,
                        grantReceivedTillDate:
                          extractedData.grantReceivedTillDate ||
                          p.grantReceivedTillDate,
                        fucFrequency:
                          extractedData.fucFrequency || p.fucFrequency,
                        projectReportFrequency:
                          extractedData.projectReportFrequency ||
                          p.projectReportFrequency,
                        auditedFUC: extractedData.auditedFUC || p.auditedFUC,
                        status: extractedData.status || p.status,
                      }));
                      // Switch to details tab to show populated form
                      setActiveTab("details");
                    }}
                    onUpdate={(recs) => {
                      const other = localMOU.filter(
                        (r) => r.grantId !== currentGrantId,
                      );
                      const updated = [...other, ...recs];
                      setLocalMOU(updated);
                      onSaveMOU(updated);
                    }}
                  />
                )}
                {attachSubTab === "budget" && (
                  <AttachmentTab
                    label="Approved Budget Documents"
                    records={localBudget.filter(
                      (r) => !currentGrantId || r.grantId === currentGrantId,
                    )}
                    grantId={currentGrantId}
                    showAmount
                    onUpdate={(recs) => {
                      const other = localBudget.filter(
                        (r) => r.grantId !== currentGrantId,
                      );
                      const updated = [...other, ...recs];
                      setLocalBudget(updated);
                      onSaveBudget(updated);
                    }}
                  />
                )}
                {attachSubTab === "fuc" && (
                  <AttachmentTab
                    label="FUC Submissions"
                    records={localFUC.filter(
                      (r) => !currentGrantId || r.grantId === currentGrantId,
                    )}
                    grantId={currentGrantId}
                    showAmount
                    showPeriod
                    onUpdate={(recs) => {
                      const other = localFUC.filter(
                        (r) => r.grantId !== currentGrantId,
                      );
                      const updated = [...other, ...recs];
                      setLocalFUC(updated);
                      onSaveFUC(updated);
                    }}
                  />
                )}
                {attachSubTab === "reports" && (
                  <AttachmentTab
                    label="Project Report Submissions"
                    records={localReports.filter(
                      (r) => !currentGrantId || r.grantId === currentGrantId,
                    )}
                    grantId={currentGrantId}
                    showPeriod
                    onUpdate={(recs) => {
                      const other = localReports.filter(
                        (r) => r.grantId !== currentGrantId,
                      );
                      const updated = [...other, ...recs];
                      setLocalReports(updated);
                      onSaveReports(updated);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* COA and Utilization tabs removed – managed from Grant Master landing page */}
          {false && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl p-8 space-y-8">
              {!detailsSaved && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  ⚠ Please save Grant Details first to configure COA mappings
                  for this grant.
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Map this grant to Chart of Accounts for automatic journal entry
                generation. Two standard journal types are pre-defined below.
              </p>

              {/* Journal Entry 1: Receipt */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-700/50 overflow-hidden">
                <div className="bg-blue-50 dark:bg-blue-900/20 px-5 py-3.5 border-b border-blue-200 dark:border-blue-700/50 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">
                      Journal Entry — Receipt
                    </span>
                    <span className="ml-3 text-[10px] text-blue-500 dark:text-blue-400">
                      When grant money is received from grantor
                    </span>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual journal row */}
                  <div className="md:col-span-2 flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-black text-slate-600 dark:text-slate-300 min-w-[80px]">
                      Dr
                    </span>
                    <span className="font-black text-slate-800 dark:text-white flex-1">
                      {coaForm.receiptBankAccount || (
                        <span className="text-slate-400 italic">
                          Bank Account
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="font-black text-slate-600 dark:text-slate-300 min-w-[80px] text-right">
                      Cr
                    </span>
                    <span className="font-black text-slate-800 dark:text-white flex-1 text-right">
                      {coaForm.receiptGrantorAccount || (
                        <span className="text-slate-400 italic">
                          {details.nameOfGrantor || "Grantor"}
                        </span>
                      )}
                    </span>
                  </div>
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
                    `Credit — ${details.nameOfGrantor || "Grantor"} (Liability/Income)`,
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
                      placeholder={`e.g. ${details.nameOfGrantor || "UNESCO"} Grant Received`}
                    />,
                  )}
                </div>
              </div>

              {/* Journal Entry 2: Utilization */}
              <div className="rounded-xl border border-orange-200 dark:border-orange-700/50 overflow-hidden">
                <div className="bg-orange-50 dark:bg-orange-900/20 px-5 py-3.5 border-b border-orange-200 dark:border-orange-700/50 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <span className="text-[10px] font-black text-orange-700 dark:text-orange-300 uppercase tracking-widest">
                      Journal Entry — Utilization
                    </span>
                    <span className="ml-3 text-[10px] text-orange-500 dark:text-orange-400">
                      When grant funds are utilized / expenses incurred
                    </span>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual journal row */}
                  <div className="md:col-span-2 flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-black text-slate-600 dark:text-slate-300 min-w-[80px]">
                      Dr
                    </span>
                    <span className="font-black text-slate-800 dark:text-white flex-1">
                      {coaForm.utilizationGrantorAccount || (
                        <span className="text-slate-400 italic">
                          {details.nameOfGrantor || "Grantor"} A/c
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="font-black text-slate-600 dark:text-slate-300 min-w-[80px] text-right">
                      Cr
                    </span>
                    <span className="font-black text-slate-800 dark:text-white flex-1 text-right">
                      {coaForm.utilizationGrantIncomeAccount || (
                        <span className="text-slate-400 italic">
                          Grant Income A/c
                        </span>
                      )}
                    </span>
                  </div>
                  {field(
                    `Debit — ${details.nameOfGrantor || "Grantor"} Account`,
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
                      placeholder={`e.g. ${details.nameOfGrantor || "UNESCO"} Utilization A/c`}
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveCOA}
                  className="inline-flex items-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-2xl transition shadow-xl">
                  <Save size={14} /> Save COA Mapping
                </button>
              </div>
            </div>
          )}

          {false && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl p-8 space-y-6">
              {/* Grant selector */}
              <div className="flex items-end gap-6">
                <div className="w-80">
                  {field(
                    "Select Grant",
                    <select
                      value={utilGrantId}
                      onChange={(e) => setUtilGrantId(e.target.value)}
                      className={selectCls}>
                      <option value="">— Choose a Grant —</option>
                      {existingGrants.map((g) => (
                        <option
                          key={g.id}
                          value={g.id}>
                          {g.nameOfGrantor} ({g.code})
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

              {/* Month-wise table */}
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
                            className="text-center py-10 text-xs text-slate-400">
                            No utilization records yet. Click{" "}
                            <strong>Add Month</strong> to begin tracking.
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
                              className={`border-b border-slate-100 dark:border-slate-700/60 ${idx % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/20"}`}>
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
                                {over ? "-" : ""}
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
                                <div className="flex items-center gap-2">
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

              {/* Add/Edit utilization modal */}
              {utilModal && (
                <div className="rounded-xl border-2 border-teal-200 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-900/10 p-5 space-y-4">
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
