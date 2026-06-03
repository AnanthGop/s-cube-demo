import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Printer } from "lucide-react";
import { CompactDatePicker } from "../shared/CompactDatePicker";

interface TravelRequisition {
  id: string;
  dateOfEntry: string;
  travellerType: "Employee" | "Consultant";
  travellerName: string;
  projectName: string;
  destinationFrom: string;
  destinationTo: string;
  travelStartDate: string;
  travelEndDate: string;
  noOfDays: number;
  perDiemAmount: number;
  travelAmount: number; // ticket cost
  lodgingCost: number;
  localConveyance: number;
  travelMode: string;
  ticketToBeBooked: "Yes" | "No";
  advanceRequired: number;
  lodgingToBeBooked: "Yes" | "No";
  finalSettlementDate: string;
  attachment?: {
    name: string;
    type: string;
    size: number;
  };
  status: "Pending" | "Approved" | "Rejected" | "Expense Pending";
  expenseStatus?: "Not Submitted" | "Draft" | "Submitted" | "Approved";
  expenseVoucherCreated?: string;
  paymentVoucherCreated?: string;
}

const getTodayISO = () => new Date().toISOString().slice(0, 10);

interface TravelReqPageProps {
  themeColor?: string;
  data: TravelRequisition[];
  employeeOptions?: string[];
  consultantOptions?: string[];
  projectOptions?: string[];
  locationOptions?: string[];
  journalVoucherMappings?: {
    expenseVoucher?: Array<{
      ledger?: string;
      employee?: string;
      type?: "Debit" | "Credit" | string;
    }>;
    perDiemVoucher?: Array<{
      ledger?: string;
      employee?: string;
      type?: "Debit" | "Credit" | string;
    }>;
    advanceVoucher?: Array<{
      ledger?: string;
      employee?: string;
      type?: "Debit" | "Credit" | string;
    }>;
    paymentVoucher?: Array<{
      ledger?: string;
      employee?: string;
      type?: "Debit" | "Credit" | string;
    }>;
  } | null;
  onUpdate: (next: TravelRequisition[]) => void | Promise<void>;
  onBackToLanding?: () => void;
  onDefaultVoucherConsumed?: () => void;
  defaultVoucher?: {
    voucherType:
      | "Expense Voucher"
      | "Per Diem Voucher"
      | "Payment Voucher"
      | "Advance Voucher";
    reqId: string;
  };
}

const TRAVEL_MODES = [
  "Train - 2nd AC",
  "Train - 3rd AC",
  "Flight - Economy",
  "Flight - Business",
  "Bus",
  "Taxi",
  "Own Vehicle",
];

const PER_DIEM_RATES: Record<string, number> = {
  "Train - 2nd AC": 500,
  "Train - 3rd AC": 400,
  "Flight - Economy": 800,
  "Flight - Business": 1500,
  Bus: 300,
  Taxi: 600,
  "Own Vehicle": 400,
};

const createEmptyEntry = (id: string): TravelRequisition => ({
  id,
  dateOfEntry: getTodayISO(),
  travellerType: "Employee",
  travellerName: "",
  projectName: "",
  destinationFrom: "",
  destinationTo: "",
  travelStartDate: "",
  travelEndDate: "",
  noOfDays: 0,
  perDiemAmount: 0,
  travelAmount: 0,
  lodgingCost: 0,
  localConveyance: 0,
  travelMode: "Train - 2nd AC",
  ticketToBeBooked: "Yes",
  advanceRequired: 0,
  lodgingToBeBooked: "No",
  finalSettlementDate: "",
  attachment: undefined,
  status: "Pending",
  expenseStatus: "Not Submitted",
});

const nextTravelId = (entries: TravelRequisition[]) => {
  const max = entries.reduce((acc, entry) => {
    const n = Number(entry.id.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `TR-${String(max + 1).padStart(3, "0")}`;
};

const calculateDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  } catch {
    return 0;
  }
};

const calculatePerDiem = (days: number, travelMode: string): number => {
  const rate = PER_DIEM_RATES[travelMode] || 500;
  return days * rate;
};

const buildVoucherRef = (type: "EV" | "PDV" | "PV" | "AV", id: string) => {
  const clean = String(id || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
  return `${type}-${clean || "NA"}`;
};

const buildIncrementedTravelVoucherRef = (type: "PV", id: string, add = 0) => {
  const raw = String(id || "")
    .trim()
    .toUpperCase();
  // Match the trailing numeric block regardless of how many segments the ID has
  // e.g. TR-001, TR-FEB-001, TR-FEB-2026-001 are all handled
  const m = raw.match(/^(.*?)(\d+)$/);
  if (!m) return buildVoucherRef(type, id);
  const num = Number(m[2]);
  if (!Number.isFinite(num)) return buildVoucherRef(type, id);
  const cleanPrefix = m[1].replace(/[^A-Za-z0-9]/g, "") || "X";
  const padded = String(num + add).padStart(m[2].length, "0");
  return `${type}-${cleanPrefix}${padded}`;
};

type VoucherType =
  | "Expense Voucher"
  | "Per Diem Voucher"
  | "Payment Voucher"
  | "Advance Voucher";

export const TravelReqPage: React.FC<TravelReqPageProps> = ({
  themeColor = "purple-600",
  data = [],
  employeeOptions = [],
  consultantOptions = [],
  projectOptions = ["Project A", "Project B", "Project C"],
  locationOptions = ["Delhi-HO", "Mumbai", "Bangalore", "Chennai"],
  journalVoucherMappings = null,
  onUpdate,
  onBackToLanding,
  onDefaultVoucherConsumed,
  defaultVoucher,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TravelRequisition>(
    createEmptyEntry("TR-001"),
  );
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(),
  );
  const [selectedVoucher, setSelectedVoucher] = useState<{
    voucherType: VoucherType;
    voucherNo: string;
    requestorName: string;
    amount: number;
    note?: string;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTraveller, setFilterTraveller] = useState("");
  const [filterPeriodFrom, setFilterPeriodFrom] = useState("");
  const [filterPeriodTo, setFilterPeriodTo] = useState("");

  // Auto-open a voucher drawer when navigated here from another page
  useEffect(() => {
    if (!defaultVoucher) return;
    const entry = data.find((e) => e.id === defaultVoucher.reqId);
    if (!entry) return;

    if (defaultVoucher.voucherType === "Payment Voucher") {
      // Use the same split logic as the table so Advance/Balance amounts are correct
      const items = getPaymentVoucherItems(entry);
      const target =
        defaultVoucher.note ?
          (items.find((i) => i.note === defaultVoucher.note) ?? items[0])
        : items[0];
      if (target) {
        setSelectedVoucher({
          voucherType: "Payment Voucher",
          voucherNo: target.voucherNo,
          requestorName: entry.travellerName,
          amount: target.amount,
          note: target.note,
        });
      }
      onDefaultVoucherConsumed?.();
      return;
    }

    const typeCode =
      defaultVoucher.voucherType === "Expense Voucher" ? "EV"
      : defaultVoucher.voucherType === "Per Diem Voucher" ? "PDV"
      : defaultVoucher.voucherType === "Advance Voucher" ? "AV"
      : "PV";
    setSelectedVoucher({
      voucherType: defaultVoucher.voucherType,
      voucherNo: buildVoucherRef(
        typeCode as "EV" | "PDV" | "PV" | "AV",
        entry.id,
      ),
      requestorName: entry.travellerName,
      amount: getVoucherAmount(defaultVoucher.voucherType, entry),
    });
    onDefaultVoucherConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultVoucher]);

  const filteredData = useMemo(() => {
    return data.filter((entry) => {
      const matchesStatus = !filterStatus || entry.status === filterStatus;
      const matchesTraveller =
        !filterTraveller ||
        entry.travellerName
          .toLowerCase()
          .includes(filterTraveller.toLowerCase());
      return matchesStatus && matchesTraveller;
    });
  }, [data, filterStatus, filterTraveller]);

  const travellerOptions = useMemo(() => {
    if (formData.travellerType === "Employee") {
      return employeeOptions;
    }
    return consultantOptions;
  }, [formData.travellerType, employeeOptions, consultantOptions]);

  const normalizedJournalMappings = useMemo(() => {
    if (!journalVoucherMappings || Array.isArray(journalVoucherMappings)) {
      return {
        expenseVoucher: [],
        perDiemVoucher: [],
        advanceVoucher: [],
        paymentVoucher: [],
      };
    }
    return {
      expenseVoucher: journalVoucherMappings.expenseVoucher || [],
      perDiemVoucher: journalVoucherMappings.perDiemVoucher || [],
      advanceVoucher: journalVoucherMappings.advanceVoucher || [],
      paymentVoucher: journalVoucherMappings.paymentVoucher || [],
    };
  }, [journalVoucherMappings]);

  const handleExtractPDFData = async () => {
    if (!currentFile) return;

    setIsExtracting(true);
    try {
      // Placeholder for AI extraction - implement actual API call here
      alert(`AI extraction initiated for ${currentFile.name}`);
      // TODO: Implement actual PDF extraction logic
      // const formData = new FormData();
      // formData.append("pdf", currentFile);
      // const response = await fetch("/api/extract-travel-data", {
      //   method: "POST",
      //   body: formData,
      // });
    } catch (error) {
      console.error("Error extracting PDF data:", error);
      alert("Failed to extract data from PDF");
    } finally {
      setIsExtracting(false);
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(createEmptyEntry(nextTravelId(data)));
    setSelectedFileName("");
    setCurrentFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(createEmptyEntry(nextTravelId(data)));
    setSelectedFileName("");
    setCurrentFile(null);
    setFileInputKey((prev) => prev + 1);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: TravelRequisition) => {
    setEditingId(entry.id);
    setFormData({
      ...entry,
      dateOfEntry: entry.dateOfEntry || getTodayISO(),
    });
    setSelectedFileName(String(entry.attachment?.name || ""));
    setFileInputKey((prev) => prev + 1);
    setIsFormOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === filteredData.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredData.map((e) => e.id)));
    }
  };

  const toggleSelectEntry = (id: string) => {
    const next = new Set(selectedEntries);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEntries(next);
  };

  const handleDelete = async () => {
    if (selectedEntries.size === 0) {
      alert("Please select at least one entry to delete.");
      return;
    }
    const confirmed = window.confirm(
      `Delete ${selectedEntries.size} selected entry(ies)?`,
    );
    if (!confirmed) return;

    const next = data.filter((entry) => !selectedEntries.has(entry.id));
    await onUpdate(next);
    setSelectedEntries(new Set());
  };

  const handleDeleteSingle = async (id: string) => {
    const target = data.find((entry) => entry.id === id);
    const label = target?.travellerName || id;
    const confirmed = window.confirm(`Delete travel requisition "${label}"?`);
    if (!confirmed) return;
    const next = data.filter((entry) => entry.id !== id);
    await onUpdate(next);
    setSelectedEntries((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(id);
      return nextSet;
    });
  };

  const handleSave = async () => {
    if (!formData.travellerName || !formData.projectName) {
      alert("Traveller name and project are required.");
      return;
    }

    const normalized: TravelRequisition = {
      ...formData,
      id: editingId || formData.id,
      dateOfEntry: formData.dateOfEntry || getTodayISO(),
    };

    let next: TravelRequisition[];
    if (editingId) {
      next = data.map((entry) => (entry.id === editingId ? normalized : entry));
    } else {
      next = [...data, normalized];
    }

    await onUpdate(next);

    // Check if consultant is Consult-B and show budget warning
    if (
      formData.travellerType === "Consultant" &&
      formData.travellerName === "Consult-B"
    ) {
      alert(
        "Requisition created, However Budget is exceeded. Please contact Finance Team",
      );
    }

    resetForm();
  };

  const updateFormData = (updates: Partial<TravelRequisition>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...updates };

      // Auto-calculate days
      if (updates.travelStartDate || updates.travelEndDate) {
        updated.noOfDays = calculateDays(
          updated.travelStartDate,
          updated.travelEndDate,
        );
      }

      // Auto-calculate per diem
      if (
        updates.noOfDays !== undefined ||
        updates.travelMode !== undefined ||
        updates.travelStartDate !== undefined ||
        updates.travelEndDate !== undefined
      ) {
        updated.perDiemAmount = calculatePerDiem(
          updated.noOfDays,
          updated.travelMode,
        );
      }

      return updated;
    });
  };

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isImage && !isPdf) {
      alert("Only image files and PDF files are allowed.");
      return;
    }
    setSelectedFileName(file.name);
    updateFormData({
      attachment: {
        name: file.name,
        type: file.type || (isPdf ? "application/pdf" : "image"),
        size: file.size,
      },
    });
  };

  const getVoucherAmount = (
    voucherType: VoucherType,
    entry: TravelRequisition,
  ): number => {
    if (voucherType === "Expense Voucher")
      return Number(entry.travelAmount || 0);
    if (voucherType === "Per Diem Voucher")
      return Number(entry.perDiemAmount || 0);
    if (voucherType === "Payment Voucher") {
      const totalExpense =
        Number(entry.travelAmount || 0) +
        Number(entry.perDiemAmount || 0) +
        Number(entry.lodgingCost || 0) +
        Number(entry.localConveyance || 0);
      const advanceGiven = Number(entry.advanceRequired || 0);
      if (advanceGiven === 0) return totalExpense;
      if (advanceGiven > totalExpense) return advanceGiven;
      return totalExpense;
    }
    return Number(entry.advanceRequired || 0);
  };

  const getPaymentVoucherItems = (entry: TravelRequisition) => {
    const totalExpense =
      Number(entry.travelAmount || 0) +
      Number(entry.perDiemAmount || 0) +
      Number(entry.lodgingCost || 0) +
      Number(entry.localConveyance || 0);
    const advanceGiven = Number(entry.advanceRequired || 0);

    // Split only when balance is payable (total > advance and advance exists).
    if (totalExpense > advanceGiven && advanceGiven > 0) {
      return [
        {
          voucherNo: buildIncrementedTravelVoucherRef("PV", entry.id, 0),
          amount: advanceGiven,
          note: "Advance",
        },
        {
          voucherNo: buildIncrementedTravelVoucherRef("PV", entry.id, 1),
          amount: totalExpense - advanceGiven,
          note: "Balance",
        },
      ];
    }

    // If advance is greater than total, show single payment voucher with advance amount.
    if (advanceGiven > totalExpense) {
      return [
        {
          voucherNo: buildVoucherRef("PV", entry.id),
          amount: advanceGiven,
          note: "Advance",
        },
      ];
    }

    return [
      {
        voucherNo: buildVoucherRef("PV", entry.id),
        amount: getVoucherAmount("Payment Voucher", entry),
        note: "",
      },
    ];
  };

  const getVoucherLines = (voucherType: VoucherType, requestorName: string) => {
    const defaultLines: Record<
      VoucherType,
      Array<{ ledger: string; type: "Debit" | "Credit" }>
    > = {
      "Expense Voucher": [
        { ledger: "Travel Account", type: "Debit" },
        { ledger: "<Party Account>", type: "Credit" },
      ],
      "Per Diem Voucher": [
        { ledger: "Per Diem Account", type: "Debit" },
        { ledger: "<Party Account>", type: "Credit" },
      ],
      "Payment Voucher": [
        { ledger: "<Party Account>", type: "Debit" },
        { ledger: "Bank", type: "Credit" },
      ],
      "Advance Voucher": [
        { ledger: "<Party Account>", type: "Debit" },
        { ledger: "Bank", type: "Credit" },
      ],
    };

    const source =
      voucherType === "Expense Voucher" ?
        normalizedJournalMappings.expenseVoucher
      : voucherType === "Per Diem Voucher" ?
        normalizedJournalMappings.perDiemVoucher
      : voucherType === "Advance Voucher" ?
        normalizedJournalMappings.advanceVoucher
      : normalizedJournalMappings.paymentVoucher;

    const lines = (
      source && source.length > 0 ?
        source
      : defaultLines[voucherType])
      .map((line) => ({
        ledger: String(line.ledger || line.employee || "-"),
        type: String(line.type || "Debit"),
      }))
      .filter((line) => line.ledger !== "-");

    return lines.map((line) => ({
      ...line,
      ledger: line.ledger.replace(
        /<\s*(party account|employee details)\s*>/gi,
        requestorName || "Requestor",
      ),
    }));
  };

  if (isFormOpen) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div
            className={`bg-${themeColor} px-10 py-8 text-white flex justify-between items-center`}>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                {editingId ? "Edit" : "Create"} Travel Requisition
              </h1>
              <p className="text-white/70 text-xs font-medium mt-1">
                Request approval for travel expenses
              </p>
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
              Back to List
            </button>
          </div>

          <div className="p-10">
            <form
              className="max-w-4xl mx-auto space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}>
              {/* ── 1. TRAVELLER DETAILS ── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-3 border-b border-purple-100 dark:border-purple-800">
                  <h2 className="text-[9px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest">
                    1. Traveller Details
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-6">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Type
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.travellerType === "Employee"}
                          onChange={() =>
                            updateFormData({
                              travellerType: "Employee",
                              travellerName: "",
                            })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Employee
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.travellerType === "Consultant"}
                          onChange={() =>
                            updateFormData({
                              travellerType: "Consultant",
                              travellerName: "",
                            })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Consultant
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        {formData.travellerType === "Employee" ?
                          "Employee Name"
                        : "Consultant Name"}
                      </label>
                      <select
                        value={formData.travellerName}
                        onChange={(e) =>
                          updateFormData({ travellerName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100">
                        <option value="">
                          {formData.travellerType === "Employee" ?
                            "Select Employee"
                          : "Select Consultant"}
                        </option>
                        {travellerOptions.map((name) => (
                          <option
                            key={name}
                            value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        Select Project
                      </label>
                      <select
                        value={formData.projectName}
                        onChange={(e) =>
                          updateFormData({ projectName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100">
                        <option value="">Select Project</option>
                        {projectOptions.map((project) => (
                          <option
                            key={project}
                            value={project}>
                            {project}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. TRAVEL DETAILS ── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-blue-100 dark:border-blue-800">
                  <h2 className="text-[9px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">
                    2. Travel Details
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        Destination From
                      </label>
                      <input
                        type="text"
                        value={formData.destinationFrom}
                        onChange={(e) =>
                          updateFormData({ destinationFrom: e.target.value })
                        }
                        placeholder="e.g. Delhi-HO"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        Destination To
                      </label>
                      <input
                        type="text"
                        value={formData.destinationTo}
                        onChange={(e) =>
                          updateFormData({ destinationTo: e.target.value })
                        }
                        placeholder="e.g. Mumbai"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        Travel Start Date
                      </label>
                      <CompactDatePicker
                        value={formData.travelStartDate}
                        onChange={(value) =>
                          updateFormData({ travelStartDate: value })
                        }
                        className="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        Travel End Date
                      </label>
                      <CompactDatePicker
                        value={formData.travelEndDate}
                        onChange={(value) =>
                          updateFormData({ travelEndDate: value })
                        }
                        className="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        No of Days
                      </label>
                      <input
                        type="text"
                        value={formData.noOfDays}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                        Travel by as per Policy
                      </label>
                      <select
                        value={formData.travelMode}
                        onChange={(e) =>
                          updateFormData({ travelMode: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100">
                        {TRAVEL_MODES.map((mode) => (
                          <option
                            key={mode}
                            value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3. COSTS & PER DIEM ── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 border-b border-emerald-100 dark:border-emerald-800">
                  <h2 className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
                    3. Costs &amp; Per Diem
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Per Diem as per Policy
                    </label>
                    <input
                      type="text"
                      value={formData.perDiemAmount}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Ticket Cost
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.travelAmount}
                      onChange={(e) =>
                        updateFormData({
                          travelAmount: Number(e.target.value || 0),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Enter ticket cost"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Lodging Cost
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.lodgingCost}
                      onChange={(e) =>
                        updateFormData({
                          lodgingCost: Number(e.target.value || 0),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Enter lodging cost"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Local Conveyance
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.localConveyance}
                      onChange={(e) =>
                        updateFormData({
                          localConveyance: Number(e.target.value || 0),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Enter local conveyance"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Advance Given
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.advanceRequired}
                      onChange={(e) =>
                        updateFormData({
                          advanceRequired: Number(e.target.value || 0),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Enter advance amount"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Total Cost
                      </div>
                      <div className="text-sm font-black text-purple-700 dark:text-purple-300">
                        ₹
                        {(
                          Number(formData.travelAmount || 0) +
                          Number(formData.perDiemAmount || 0) +
                          Number(formData.lodgingCost || 0) +
                          Number(formData.localConveyance || 0)
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 4. BOOKING & SETTLEMENT ── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-3 border-b border-amber-100 dark:border-amber-800">
                  <h2 className="text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">
                    4. Booking &amp; Settlement
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                      Ticket to be Booked
                    </label>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.ticketToBeBooked === "Yes"}
                          onChange={() =>
                            updateFormData({ ticketToBeBooked: "Yes" })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Yes
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.ticketToBeBooked === "No"}
                          onChange={() =>
                            updateFormData({ ticketToBeBooked: "No" })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          No
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                      Lodging to be Booked
                    </label>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.lodgingToBeBooked === "Yes"}
                          onChange={() =>
                            updateFormData({ lodgingToBeBooked: "Yes" })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Yes
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.lodgingToBeBooked === "No"}
                          onChange={() =>
                            updateFormData({ lodgingToBeBooked: "No" })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          No
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Final Settlement Date
                    </label>
                    <CompactDatePicker
                      value={formData.finalSettlementDate}
                      onChange={(value) =>
                        updateFormData({ finalSettlementDate: value })
                      }
                      className="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* ── 5. ATTACHMENT ── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-700/40 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    5. Attachment
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setCurrentFile(file);
                        handleFileUpload(file);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-purple-500 font-semibold text-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 dark:file:bg-purple-900/40 dark:file:text-purple-300 file:font-bold"
                    />
                    {formData.attachment && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium px-2">
                        📎 {formData.attachment.name}
                      </div>
                    )}
                    {currentFile && currentFile.type === "application/pdf" && (
                      <button
                        type="button"
                        onClick={handleExtractPDFData}
                        disabled={isExtracting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {isExtracting ?
                          <>
                            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Extracting data from PDF...
                          </>
                        : <>
                            <span>✨</span>
                            Use AI to read this file
                          </>
                        }
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400 font-medium">
                    Accepted formats: PDF, Image (JPG, PNG, etc.)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 bg-${themeColor} hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg`}>
                  {editingId ? "Update" : "Create"} Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-gradient-to-br from-purple-600 to-violet-700 px-10 py-8 rounded-3xl text-white mb-8 flex justify-between items-center shadow-2xl">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">
            Travel Requisitions
          </h1>
          <p className="text-white/70 text-sm font-medium mt-1">
            Technology investment history and requests.
          </p>
        </div>
        <div className="flex gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="px-6 py-3 bg-white/15 hover:bg-white/25 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">
              Back to Travel Landing Page
            </button>
          )}
          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2">
            <span>📊</span> Export to Excel
          </button>
          <button
            onClick={openCreateForm}
            className="px-6 py-3 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">
            + New Travel Request
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Period From
            </label>
            <CompactDatePicker
              value={filterPeriodFrom}
              onChange={setFilterPeriodFrom}
              className="border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Period To
            </label>
            <CompactDatePicker
              value={filterPeriodTo}
              onChange={setFilterPeriodTo}
              className="border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Traveller
            </label>
            <input
              type="text"
              value={filterTraveller}
              onChange={(e) => setFilterTraveller(e.target.value)}
              placeholder="Search name..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Expense Approved</option>
              <option value="Expense Pending">Expense Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        <button className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition">
          Filter Period
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {selectedEntries.size > 0 && (
          <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              {selectedEntries.size} item(s) selected
            </span>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition">
              Delete Selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={
                      filteredData.length > 0 &&
                      selectedEntries.size === filteredData.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Travel Requisition ID
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Date of Entry
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Start Date
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  End Date
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Traveller
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Project
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Ticket Cost
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Per Diem Amount
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Lodging Cost
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Local Conveyance
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Advance Given
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Variance
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Expense Voucher
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Per Diem Voucher
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Payment Voucher
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[9rem]">
                  Status
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredData.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleSelectEntry(entry.id)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-purple-600 dark:text-purple-400">
                    {entry.id}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {entry.dateOfEntry || entry.travelStartDate || "-"}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {entry.travelStartDate}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {entry.travelEndDate}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {entry.travellerName}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {entry.projectName}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    ₹{Number(entry.travelAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    ₹{Number(entry.perDiemAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    ₹{Number(entry.lodgingCost || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    ₹{Number(entry.localConveyance || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    ₹{Number(entry.advanceRequired || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    ₹
                    {(
                      Number(entry.travelAmount || 0) +
                      Number(entry.perDiemAmount || 0) +
                      Number(entry.lodgingCost || 0) +
                      Number(entry.localConveyance || 0) -
                      Number(entry.advanceRequired || 0)
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold">
                    {(
                      entry.status === "Pending" ||
                      entry.status === "Expense Pending"
                    ) ?
                      <span className="text-slate-400">—</span>
                    : <button
                        onClick={() =>
                          setSelectedVoucher({
                            voucherType: "Expense Voucher",
                            voucherNo: buildVoucherRef("EV", entry.id),
                            requestorName: entry.travellerName,
                            amount: getVoucherAmount("Expense Voucher", entry),
                          })
                        }
                        className="text-left text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2">
                        {buildVoucherRef("EV", entry.id)}
                      </button>
                    }
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold">
                    {(
                      entry.status === "Pending" ||
                      entry.status === "Expense Pending"
                    ) ?
                      <span className="text-slate-400">—</span>
                    : <button
                        onClick={() =>
                          setSelectedVoucher({
                            voucherType: "Per Diem Voucher",
                            voucherNo: buildVoucherRef("PDV", entry.id),
                            requestorName: entry.travellerName,
                            amount: getVoucherAmount("Per Diem Voucher", entry),
                          })
                        }
                        className="text-left text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 underline underline-offset-2">
                        {buildVoucherRef("PDV", entry.id)}
                      </button>
                    }
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold">
                    {(
                      entry.status === "Pending" ||
                      entry.status === "Expense Pending" ||
                      // Expense-Pending approval path: hide PV until explicitly created
                      (entry.expenseVoucherCreated === "Y" &&
                        entry.paymentVoucherCreated !== "Y")
                    ) ?
                      <span className="text-slate-400">—</span>
                    : <div className="flex flex-col gap-1">
                        {getPaymentVoucherItems(entry).map((item) => (
                          <button
                            key={item.voucherNo}
                            onClick={() =>
                              setSelectedVoucher({
                                voucherType: "Payment Voucher",
                                voucherNo: item.voucherNo,
                                requestorName: entry.travellerName,
                                amount: item.amount,
                                note: item.note,
                              })
                            }
                            className="text-left text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-2">
                            {item.voucherNo}
                            {item.note ? ` (${item.note})` : ""}
                          </button>
                        ))}
                      </div>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        entry.status === "Approved" ?
                          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : entry.status === "Expense Pending" ?
                          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : entry.status === "Rejected" ?
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                      {entry.status === "Approved" ?
                        "Expense Approved"
                      : entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-4">
                      <button
                        onClick={() => openEditForm(entry)}
                        title="Edit"
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteSingle(entry.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <span className="font-semibold">Requestor:</span>{" "}
                {selectedVoucher.requestorName}
              </div>
              <div>
                <span className="font-semibold">Amount:</span> INR{" "}
                {selectedVoucher.amount.toLocaleString()}
              </div>
              {selectedVoucher.note && (
                <div>
                  <span className="font-semibold">Type:</span>{" "}
                  {selectedVoucher.note}
                </div>
              )}
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
                  {getVoucherLines(
                    selectedVoucher.voucherType,
                    selectedVoucher.requestorName,
                  ).map((line, idx) => (
                    <tr key={`${line.ledger}-${idx}`}>
                      <td className="px-4 py-3 text-sm">{line.ledger}</td>
                      <td className="px-4 py-3 text-sm">{line.type}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {line.type.toLowerCase() === "debit" ?
                          `INR ${selectedVoucher.amount.toLocaleString()}`
                        : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {line.type.toLowerCase() === "credit" ?
                          `INR ${selectedVoucher.amount.toLocaleString()}`
                        : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
