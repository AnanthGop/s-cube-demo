import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardEdit,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TravelRequisition {
  id: string;
  dateOfEntry?: string;
  travellerType?: string;
  travellerName: string;
  projectName: string;
  destinationFrom?: string;
  destinationTo?: string;
  travelStartDate: string;
  travelEndDate: string;
  noOfDays?: number;
  perDiemAmount?: number;
  travelAmount?: number; // requisitioned ticket cost
  lodgingCost?: number; // requisitioned lodging
  localConveyance?: number; // requisitioned local conveyance
  advanceRequired?: number;
  status?: string;
  expenseStatus?: "Not Submitted" | "Draft" | "Submitted" | "Approved";
}

export interface TravelExpense {
  expId: string;
  reqId: string;
  submittedOn: string;
  travellerName: string;
  projectName: string;
  travelStartDate: string;
  travelEndDate: string;
  // Actuals
  actualTicketCost: number;
  actualLodgingCost: number;
  actualLocalConveyance: number;
  // Requisitioned (snapshot)
  reqTicketCost: number;
  reqLodgingCost: number;
  reqLocalConveyance: number;
  reqPerDiemAmount: number;
  reqAdvance: number;
  // Status
  expenseStatus: "Draft" | "Submitted" | "Approved";
  // Attachments (metadata only — file data lives in memory during session)
  attachments?: { name: string; type: string; size: number }[];
}

interface TravelExpensePageProps {
  themeColor?: string;
  travelRecords: TravelRequisition[];
  expenseRecords: TravelExpense[];
  onUpdateExpenses: (next: TravelExpense[]) => void | Promise<void>;
  onUpdateRequisitions: (next: TravelRequisition[]) => void | Promise<void>;
  onBackToLanding?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTodayISO = () => new Date().toISOString().slice(0, 10);

const nextExpId = (records: TravelExpense[]): string => {
  const max = records.reduce((acc, r) => {
    const n = Number(r.expId.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `TEX-${String(max + 1).padStart(3, "0")}`;
};

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

const diffClass = (diff: number) =>
  diff < 0 ? "text-red-600 dark:text-red-400"
  : diff > 0 ? "text-emerald-600 dark:text-emerald-400"
  : "text-slate-500 dark:text-slate-400";

const diffLabel = (diff: number) => {
  if (diff === 0) return "—";
  return `${diff > 0 ? "+" : "-"}${fmt(diff)}`;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const TravelExpensePage: React.FC<TravelExpensePageProps> = ({
  themeColor = "teal-600",
  travelRecords = [],
  expenseRecords = [],
  onUpdateExpenses,
  onUpdateRequisitions,
  onBackToLanding,
}) => {
  const [drawerReqId, setDrawerReqId] = useState<string | null>(null);
  const [actualTicket, setActualTicket] = useState(0);
  const [actualLodging, setActualLodging] = useState(0);
  const [actualConveyance, setActualConveyance] = useState(0);
  const [saving, setSaving] = useState(false);
  // Attachments — in-session file objects + persisted metadata
  const [attachments, setAttachments] = useState<
    { name: string; type: string; size: number; previewUrl?: string }[]
  >([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // index expense records by reqId for fast lookup
  const expenseByReq = useMemo(() => {
    const map: Record<string, TravelExpense> = {};
    expenseRecords.forEach((r) => {
      map[r.reqId] = r;
    });
    return map;
  }, [expenseRecords]);

  const openDrawer = (req: TravelRequisition) => {
    const existing = expenseByReq[req.id];
    setActualTicket(
      existing?.actualTicketCost ?? Number(req.travelAmount || 0),
    );
    setActualLodging(
      existing?.actualLodgingCost ?? Number(req.lodgingCost || 0),
    );
    setActualConveyance(
      existing?.actualLocalConveyance ?? Number(req.localConveyance || 0),
    );
    // Restore attachment metadata from saved record (no preview for previously saved files)
    setAttachments(
      (existing?.attachments ?? []).map((a) => ({
        ...a,
        previewUrl: undefined,
      })),
    );
    setFileInputKey((k) => k + 1);
    setDrawerReqId(req.id);
  };

  const closeDrawer = () => {
    // Revoke any object URLs to avoid memory leaks
    attachments.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    setDrawerReqId(null);
  };

  const drawerReq = useMemo(
    () => travelRecords.find((r) => r.id === drawerReqId) ?? null,
    [travelRecords, drawerReqId],
  );

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems: {
      name: string;
      type: string;
      size: number;
      previewUrl?: string;
    }[] = [];
    Array.from(files).forEach((file) => {
      const previewUrl =
        file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      newItems.push({
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
      });
    });
    setAttachments((prev) => [...prev, ...newItems]);
    setFileInputKey((k) => k + 1); // reset input so same file can be re-added
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => {
      const item = prev[idx];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSaveExpense = async (status: "Draft" | "Submitted") => {
    if (!drawerReq) return;
    setSaving(true);
    try {
      const existing = expenseByReq[drawerReq.id];
      const expId = existing?.expId ?? nextExpId(expenseRecords);

      const newRecord: TravelExpense = {
        expId,
        reqId: drawerReq.id,
        submittedOn: getTodayISO(),
        travellerName: drawerReq.travellerName,
        projectName: drawerReq.projectName,
        travelStartDate: drawerReq.travelStartDate,
        travelEndDate: drawerReq.travelEndDate,
        actualTicketCost: actualTicket,
        actualLodgingCost: actualLodging,
        actualLocalConveyance: actualConveyance,
        reqTicketCost: Number(drawerReq.travelAmount || 0),
        reqLodgingCost: Number(drawerReq.lodgingCost || 0),
        reqLocalConveyance: Number(drawerReq.localConveyance || 0),
        reqPerDiemAmount: Number(drawerReq.perDiemAmount || 0),
        reqAdvance: Number(drawerReq.advanceRequired || 0),
        expenseStatus: status,
        attachments: attachments.map(({ name, type, size }) => ({
          name,
          type,
          size,
        })),
      };

      const updatedExpenses =
        existing ?
          expenseRecords.map((r) => (r.reqId === drawerReq.id ? newRecord : r))
        : [...expenseRecords, newRecord];

      // Update expense status (and req status when submitting) on the requisition record
      const expStatus: TravelRequisition["expenseStatus"] =
        status === "Submitted" ? "Submitted" : "Draft";
      const updatedReqs = travelRecords.map((r) =>
        r.id === drawerReq.id ?
          {
            ...r,
            expenseStatus: expStatus,
            ...(status === "Submitted" ? { status: "Expense Pending" } : {}),
          }
        : r,
      );

      await onUpdateExpenses(updatedExpenses);
      await onUpdateRequisitions(updatedReqs);
      closeDrawer();
    } finally {
      setSaving(false);
    }
  };

  const expStatusBadge = (s?: string) => {
    if (!s || s === "Not Submitted")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          Not Submitted
        </span>
      );
    if (s === "Draft")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Draft
        </span>
      );
    if (s === "Submitted")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Submitted
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Approved
      </span>
    );
  };

  const reqStatusBadge = (s?: string) => {
    if (s === "Approved")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Approved
        </span>
      );
    if (s === "Rejected")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Rejected
        </span>
      );
    if (s === "Expense Pending")
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          Expense Pending
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        Pending
      </span>
    );
  };

  // ── Drawer computed values ───────────────────────────────────────────────
  const reqTicket = Number(drawerReq?.travelAmount || 0);
  const reqLodging = Number(drawerReq?.lodgingCost || 0);
  const reqConveyance = Number(drawerReq?.localConveyance || 0);
  const reqPerDiem = Number(drawerReq?.perDiemAmount || 0);
  const reqAdvance = Number(drawerReq?.advanceRequired || 0);

  const reqTotal = reqTicket + reqLodging + reqConveyance + reqPerDiem;
  const actTotal = actualTicket + actualLodging + actualConveyance + reqPerDiem;
  const totalDiff = actTotal - reqTotal;
  const balance = actTotal - reqAdvance;

  const existingExpense = drawerReqId ? expenseByReq[drawerReqId] : null;

  // ── Table rows ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <ArrowLeft
                size={16}
                className="text-slate-500"
              />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Travel Expense Submission
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submit actual costs against travel requisitions
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full uppercase tracking-widest">
          {travelRecords.filter((r) => r.status === "Approved").length} Records
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
              {[
                "Travel Req ID",
                "Date of Entry",
                "Traveller",
                "Project",
                "Start Date",
                "End Date",
                "Ticket Cost (Req)",
                "Lodging Cost (Req)",
                "Local Conv. (Req)",
                "Per Diem (Req)",
                "Advance Given",
                "Req Status",
                "Travel Exp ID",
                "Expense Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {travelRecords.filter((r) => r.status === "Approved").length ===
              0 && (
              <tr>
                <td
                  colSpan={15}
                  className="px-6 py-12 text-center text-sm text-slate-400">
                  No approved travel requisitions found.
                </td>
              </tr>
            )}
            {travelRecords
              .filter((r) => r.status === "Approved")
              .map((req) => {
                const exp = expenseByReq[req.id];
                return (
                  <tr
                    key={req.id}
                    className="hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-purple-600 dark:text-purple-400">
                      {req.id}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {req.dateOfEntry || req.travelStartDate || "—"}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {req.travellerName}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {req.projectName}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {req.travelStartDate}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {req.travelEndDate}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      ₹{Number(req.travelAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      ₹{Number(req.lodgingCost || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      ₹
                      {Number(req.localConveyance || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      ₹{Number(req.perDiemAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      ₹
                      {Number(req.advanceRequired || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">{reqStatusBadge(req.status)}</td>
                    <td className="px-5 py-4 text-xs font-bold text-teal-700 dark:text-teal-300">
                      {exp?.expId || "—"}
                    </td>
                    <td className="px-5 py-4">
                      {expStatusBadge(req.expenseStatus || exp?.expenseStatus)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openDrawer(req)}
                        title={exp ? "Edit Expense" : "Submit Expense"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/30 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[10px] font-black uppercase tracking-widest transition">
                        <ClipboardEdit size={12} />
                        {exp ? "Edit" : "Submit"}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ── Side Drawer ─────────────────────────────────────────────────── */}
      {drawerReqId && drawerReq && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          {/* panel */}
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            {/* drawer header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between bg-teal-50 dark:bg-teal-900/20">
              <div>
                <div className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">
                  Travel Expense Submission
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {drawerReq.id}
                  {existingExpense && (
                    <span className="ml-3 text-sm font-bold text-teal-600 dark:text-teal-300">
                      / {existingExpense.expId}
                    </span>
                  )}
                </h2>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {drawerReq.travellerName} &nbsp;·&nbsp;{" "}
                  {drawerReq.projectName}
                  &nbsp;·&nbsp; {drawerReq.travelStartDate} →{" "}
                  {drawerReq.travelEndDate}
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X
                  size={18}
                  className="text-slate-500"
                />
              </button>
            </div>

            {/* drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Travel Exp ID pill */}
              <div className="flex items-center gap-3">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Travel Exp ID
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-black">
                  {existingExpense?.expId ?? nextExpId(expenseRecords)}
                </span>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">
                  Linked Req
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-black">
                  {drawerReq.id}
                </span>
              </div>

              {/* Comparison Table */}
              <div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Cost Comparison
                </h3>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Cost Type
                        </th>
                        <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Requisitioned
                        </th>
                        <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Actual
                        </th>
                        <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Difference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {/* Ticket Cost */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 text-xs">
                          Ticket Cost
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                          {fmt(reqTicket)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min={0}
                            value={actualTicket}
                            onChange={(e) =>
                              setActualTicket(Number(e.target.value || 0))
                            }
                            className="w-28 text-right px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                          />
                        </td>
                        <td
                          className={`px-4 py-3 text-right text-xs font-black ${diffClass(
                            actualTicket - reqTicket,
                          )}`}>
                          {diffLabel(actualTicket - reqTicket)}
                        </td>
                      </tr>

                      {/* Lodging Cost */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 text-xs">
                          Lodging / Hotel Cost
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                          {fmt(reqLodging)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min={0}
                            value={actualLodging}
                            onChange={(e) =>
                              setActualLodging(Number(e.target.value || 0))
                            }
                            className="w-28 text-right px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                          />
                        </td>
                        <td
                          className={`px-4 py-3 text-right text-xs font-black ${diffClass(
                            actualLodging - reqLodging,
                          )}`}>
                          {diffLabel(actualLodging - reqLodging)}
                        </td>
                      </tr>

                      {/* Local Conveyance */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 text-xs">
                          Local Conveyance
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                          {fmt(reqConveyance)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min={0}
                            value={actualConveyance}
                            onChange={(e) =>
                              setActualConveyance(Number(e.target.value || 0))
                            }
                            className="w-28 text-right px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                          />
                        </td>
                        <td
                          className={`px-4 py-3 text-right text-xs font-black ${diffClass(
                            actualConveyance - reqConveyance,
                          )}`}>
                          {diffLabel(actualConveyance - reqConveyance)}
                        </td>
                      </tr>

                      {/* Per Diem (read-only) */}
                      <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                        <td className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-xs italic">
                          Per Diem (policy — fixed)
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400">
                          {fmt(reqPerDiem)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400">
                          {fmt(reqPerDiem)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-400">
                          —
                        </td>
                      </tr>

                      {/* Totals */}
                      <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-600">
                        <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-black text-slate-700 dark:text-slate-200">
                          {fmt(reqTotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-black text-slate-700 dark:text-slate-200">
                          {fmt(actTotal)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right text-xs font-black ${diffClass(
                            totalDiff,
                          )}`}>
                          {diffLabel(totalDiff)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settlement Summary */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Settlement Summary
                  </span>
                </div>
                <div className="px-4 py-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Total Actual Cost
                    </div>
                    <div className="text-base font-black text-slate-800 dark:text-white">
                      {fmt(actTotal)}
                    </div>
                  </div>
                  <div className="text-center border-x border-slate-200 dark:border-slate-700">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Advance Given
                    </div>
                    <div className="text-base font-black text-slate-800 dark:text-white">
                      {fmt(reqAdvance)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {balance >= 0 ? "Balance Payable" : "Amount to Recover"}
                    </div>
                    <div
                      className={`text-base font-black ${
                        balance >= 0 ?
                          "text-blue-600 dark:text-blue-400"
                        : "text-red-600 dark:text-red-400"
                      }`}>
                      {fmt(balance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Attachments ─────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Attachments
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/40 dark:hover:bg-teal-900/70 text-teal-700 dark:text-teal-300 text-[10px] font-black uppercase tracking-widest transition">
                    <Paperclip size={11} />
                    Add Files
                  </button>
                  <input
                    key={fileInputKey}
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleAddFiles(e.target.files)}
                  />
                </div>

                {attachments.length === 0 ?
                  <div
                    className="px-4 py-6 text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>
                    <Paperclip
                      size={24}
                      className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      No attachments yet. Click{" "}
                      <span className="text-teal-600 dark:text-teal-400 font-bold underline">
                        Add Files
                      </span>{" "}
                      or drop bills, invoices and receipts (PDF / Image).
                    </p>
                  </div>
                : <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {attachments.map((att, idx) => {
                      const isImage = att.type.startsWith("image/");
                      const isPdf = att.type === "application/pdf";
                      return (
                        <li
                          key={idx}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          {/* Thumbnail / icon */}
                          {isImage && att.previewUrl ?
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-600 flex-shrink-0"
                            />
                          : <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black uppercase ${
                                isPdf ?
                                  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                              }`}>
                              {isPdf ?
                                "PDF"
                              : (att.name
                                  .split(".")
                                  .pop()
                                  ?.toUpperCase()
                                  .slice(0, 3) ?? "FILE")
                              }
                            </div>
                          }
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                              {att.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatFileSize(att.size)}
                              {!att.previewUrl && !isImage && (
                                <span className="ml-2 text-amber-500 dark:text-amber-400">
                                  (saved — re-attach to preview)
                                </span>
                              )}
                            </p>
                          </div>
                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition flex-shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                }
              </div>
            </div>
            {/* end drawer body */}

            {/* drawer footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={closeDrawer}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest transition">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveExpense("Draft")}
                className="px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/70 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest transition">
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveExpense("Submitted")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-widest transition shadow-md">
                <CheckCircle2 size={14} />
                Submit Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
