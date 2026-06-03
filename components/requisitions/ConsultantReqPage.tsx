import React, { useMemo, useState } from "react";
import { CompactDatePicker } from "../shared/CompactDatePicker";
import { RequisitionDetailsDrawer } from "./RequisitionDetailsDrawer";
import {
  MonthlyDayPicker,
  normalizeMonthlyPostingDay,
} from "../shared/MonthlyDayPicker";
import {
  composeBankDetails,
  emptyBankDetails,
  parseBankDetails,
  type BankDetailsParts,
} from "../shared/bankDetails";

interface ConsultantEntry {
  id: string;
  vendorName: string;
  location: string;
  postingFrequency: string;
  panNo: string;
  nameAsPerPan?: string;
  bankDetails: string;
  email: string;
  consultantType: string;
  contactNumber: string;
  address: string;
  agreementSignedBy: string;
  expenseHead: string;
  agreementStartDate: string;
  agreementEndDate: string;
  agreementTerminationDate: string;
  terminationReason: string;
  autoPosting: "Y" | "N";
  autoPostingDate: string;
  attachments: string;
  budgetCode: string;
  fundType: string;
  grossAmount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  tdsRuleName: string;
  tdsPercent: number;
}

interface ConsultantReqPageProps {
  themeColor?: string;
  data: ConsultantEntry[];
  filterMode?: "all" | "renewals";
  onUpdate: (next: ConsultantEntry[]) => void | Promise<void>;
  userOptions?: string[];
  locationOptions?: string[];
  tdsAccountMappings?: Array<{
    accountName?: string;
    type?: string;
    section?: string;
    rate?: number;
    appliedOn?: string;
  }>;
  onBackToLanding?: () => void;
}

const TDS_RULES: Record<string, number> = {
  "TDS on Contractors": 2,
  "TDS on Professional Fees": 10,
  "TDS on Technical Services": 2,
  "TDS on Commission": 5,
};

const createEmptyEntry = (id: string): ConsultantEntry => ({
  id,
  vendorName: "",
  location: "",
  postingFrequency: "Monthly",
  panNo: "",
  nameAsPerPan: "",
  bankDetails: "",
  email: "",
  consultantType: "",
  contactNumber: "",
  address: "",
  agreementSignedBy: "",
  expenseHead: "",
  agreementStartDate: "",
  agreementEndDate: "",
  agreementTerminationDate: "",
  terminationReason: "",
  autoPosting: "Y",
  autoPostingDate: "",
  attachments: "",
  budgetCode: "",
  fundType: "LC",
  grossAmount: 0,
  gstPercent: 18,
  gstAmount: 0,
  totalAmount: 0,
  tdsRuleName: "TDS on Contractors",
  tdsPercent: 2,
});

const nextConsultantId = (entries: ConsultantEntry[]) => {
  const max = entries.reduce((acc, entry) => {
    const n = Number(String(entry?.id || "").replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `C${String(max + 1).padStart(3, "0")}`;
};

const normalizeForForm = (entry: ConsultantEntry): ConsultantEntry => {
  const grossAmount = Number(entry.grossAmount) || 0;
  const gstPercent = Number(entry.gstPercent) || 0;
  const gstAmount = Number(((grossAmount * gstPercent) / 100).toFixed(2));
  const totalAmount = Number((grossAmount + gstAmount).toFixed(2));
  return {
    ...entry,
    location: String(entry.location || ""),
    panNo: String(entry.panNo || ""),
    nameAsPerPan: String(entry.nameAsPerPan || entry.vendorName || ""),
    bankDetails: String(entry.bankDetails || ""),
    email: String(entry.email || ""),
    consultantType: String(entry.consultantType || ""),
    contactNumber: String(entry.contactNumber || ""),
    address: String(entry.address || ""),
    fundType: String(entry.fundType || "LC"),
    agreementTerminationDate: toIsoDateInput(entry.agreementTerminationDate),
    terminationReason: String(entry.terminationReason || ""),
    autoPostingDate: normalizeMonthlyPostingDay(entry.autoPostingDate),
    grossAmount,
    gstPercent,
    gstAmount,
    totalAmount,
    tdsPercent:
      Number(entry.tdsPercent) ||
      TDS_RULES[entry.tdsRuleName] ||
      TDS_RULES["TDS on Contractors"],
  };
};

const toIsoDateInput = (value: unknown): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Handle OCR/common formats like 20.6.2025, 20/6/2025, 20-6-2025
  const simple = raw.replace(/[,\s]+/g, " ").trim();
  const dmy = simple.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\.?$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const yearRaw = Number(dmy[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year) &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 1900 &&
      year <= 2100
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const ConsultantReqPage: React.FC<ConsultantReqPageProps> = ({
  themeColor = "brand-600",
  data,
  filterMode = "all",
  onUpdate,
  userOptions = [],
  locationOptions = [],
  tdsAccountMappings = [],
  onBackToLanding,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ConsultantEntry>(
    createEmptyEntry("C001"),
  );
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(),
  );
  const [filterVendor, setFilterVendor] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [aiProvider, setAiProvider] = useState<"openai" | "ollama">("openai");
  const [bankDetailsForm, setBankDetailsForm] = useState<BankDetailsParts>(
    emptyBankDetails(),
  );
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  const availableLocationOptions = useMemo(() => {
    const options = new Set(
      locationOptions
        .map((name) => String(name || "").trim())
        .filter((name) => name.length > 0),
    );
    const currentValue = String(formData.location || "").trim();
    if (currentValue) options.add(currentValue);
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [locationOptions, formData.location]);

  const selectedTdsMapping = useMemo(
    () =>
      tdsAccountMappings.find(
        (item) =>
          String(item?.accountName || "").trim().length > 0 &&
          Number(item?.rate || 0) > 0,
      ) || null,
    [tdsAccountMappings],
  );

  const mappedTdsAccountName = String(
    selectedTdsMapping?.accountName || "TDS Account",
  );
  const mappedTdsPercent = Number(selectedTdsMapping?.rate || 0);

  const filteredData = useMemo(() => {
    let baseData = data;
    if (filterMode === "renewals") {
      const today = new Date();
      const twoMonthsFromNow = new Date(today);
      twoMonthsFromNow.setMonth(today.getMonth() + 2);
      baseData = data.filter((entry) => {
        if (!entry.agreementEndDate) return false;
        const endDate = new Date(entry.agreementEndDate);
        if (Number.isNaN(endDate.getTime())) return false;
        return endDate >= today && endDate <= twoMonthsFromNow;
      });
    }

    return baseData.filter((entry) => {
      const matchesVendor =
        !filterVendor ||
        String(entry.vendorName || "")
          .toLowerCase()
          .includes(filterVendor.toLowerCase());
      return matchesVendor;
    });
  }, [data, filterMode, filterVendor]);

  const updateAmounts = (grossAmount: number, gstPercent: number) => {
    const gstAmount = Number(((grossAmount * gstPercent) / 100).toFixed(2));
    const totalAmount = Number((grossAmount + gstAmount).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      grossAmount,
      gstPercent,
      gstAmount,
      totalAmount,
    }));
  };

  const updateBankDetailsField = (
    field: keyof BankDetailsParts,
    value: string,
  ) => {
    const next = {
      ...bankDetailsForm,
      [field]: value,
    };
    setBankDetailsForm(next);
    setFormData((prev) => ({
      ...prev,
      bankDetails: composeBankDetails(next),
    }));
  };

  const fieldLabelClass =
    "block text-[9px] font-black text-slate-500 uppercase tracking-[0.18em] mb-1.5";
  const fieldInputClass =
    "w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm";
  const fieldReadOnlyClass =
    "w-full px-3 py-2.5 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none font-semibold text-sm text-slate-600";
  const sectionTitleClass =
    "text-[10px] font-black uppercase tracking-[0.22em] text-brand-600";
  const sectionDividerClass = "border-t border-slate-100";

  const handleExtractPDFData = async () => {
    if (!currentFile) return;

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("pdf", currentFile);
      const providerLabel =
        aiProvider === "ollama" ? "Ollama (local)" : "OpenAI API";
      const extractionUrl =
        aiProvider === "ollama" ?
          `http://localhost:3002/api/extract-consultant-data-ollama?t=${Date.now()}`
        : `/api/extract-consultant-data-v2?t=${Date.now()}`;

      const response = await fetch(extractionUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let backendMessage = errorText;
        try {
          const parsed = JSON.parse(errorText);
          backendMessage =
            parsed.details ? `${parsed.error || "Error"}: ${parsed.details}`
            : (parsed.error || errorText);
        } catch (_err) {
          // Keep raw text fallback
        }
        throw new Error(
          backendMessage ||
            `Failed to extract data from attachment (${response.status})`,
        );
      }

      const extractedData = await response.json();

      // Update form with extracted data
      setFormData((prev) => {
        const grossAmount = Number(extractedData.grossAmount) || 0;
        const gstPercent = Number(extractedData.gstPercent) || 18;
        const gstAmount = Number(((grossAmount * gstPercent) / 100).toFixed(2));
        const totalAmount = Number((grossAmount + gstAmount).toFixed(2));
        const tdsPercent =
          extractedData.tdsRuleName ?
            TDS_RULES[extractedData.tdsRuleName] || 2
          : 2;

        return {
          bankDetails: composeBankDetails(
            parseBankDetails(extractedData.bankDetails || ""),
          ),
          ...prev,
          ...extractedData,
          agreementStartDate: toIsoDateInput(extractedData.agreementStartDate),
          agreementEndDate: toIsoDateInput(extractedData.agreementEndDate),
          autoPostingDate: normalizeMonthlyPostingDay(
            extractedData.autoPostingDate,
          ),
          grossAmount,
          gstPercent,
          gstAmount,
          totalAmount,
          tdsPercent,
        };
      });
      setBankDetailsForm(parseBankDetails(extractedData.bankDetails || ""));

      alert(
        `✅ Consultant data extracted successfully using ${providerLabel}. The form has been populated. Please review and save.`,
      );
    } catch (error) {
      console.error("PDF extraction error:", error);
      alert(
        `❌ Failed to extract data from PDF.\n\n${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(createEmptyEntry(nextConsultantId(data)));
    setBankDetailsForm(emptyBankDetails());
    setCurrentFile(null);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(createEmptyEntry(nextConsultantId(data)));
    setBankDetailsForm(emptyBankDetails());
    setIsFormOpen(true);
  };

  const openEditForm = (entry: ConsultantEntry) => {
    setEditingId(entry.id);
    const normalizedEntry = normalizeForForm(entry);
    setFormData(normalizedEntry);
    setBankDetailsForm(parseBankDetails(normalizedEntry.bankDetails));
    setIsFormOpen(true);
  };

  const toggleSelectEntry = (id: string) => {
    const next = new Set(selectedEntries);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEntries(next);
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === filteredData.length) {
      setSelectedEntries(new Set());
      return;
    }
    setSelectedEntries(new Set(filteredData.map((entry) => entry.id)));
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

  const handleSave = async () => {
    if (!formData.vendorName.trim()) {
      alert("Vendor/Consultant Name is required.");
      return;
    }

    const grossAmount = Number(formData.grossAmount) || 0;
    const gstPercent = Number(formData.gstPercent) || 0;
    const gstAmount = Number(((grossAmount * gstPercent) / 100).toFixed(2));
    const totalAmount = Number((grossAmount + gstAmount).toFixed(2));
    const normalized: ConsultantEntry = {
      ...formData,
      id: editingId || formData.id,
      vendorName: formData.vendorName.trim(),
      location: formData.location.trim(),
      panNo: formData.panNo.trim(),
      nameAsPerPan: formData.vendorName.trim(),
      bankDetails: formData.bankDetails.trim(),
      email: formData.email.trim(),
      consultantType: formData.consultantType.trim(),
      contactNumber: formData.contactNumber.trim(),
      address: formData.address.trim(),
      agreementSignedBy: formData.agreementSignedBy.trim(),
      agreementTerminationDate: formData.agreementTerminationDate,
      terminationReason: formData.terminationReason.trim(),
      budgetCode: formData.budgetCode.trim(),
      attachments: formData.attachments.trim(),
      fundType: formData.fundType || "LC",
      autoPosting: formData.autoPosting === "N" ? "N" : "Y",
      autoPostingDate:
        formData.autoPosting === "Y" ? formData.autoPostingDate : "",
      grossAmount,
      gstPercent,
      gstAmount,
      totalAmount,
      tdsPercent:
        Number(formData.tdsPercent) ||
        TDS_RULES[formData.tdsRuleName] ||
        TDS_RULES["TDS on Contractors"],
    };

    const next =
      editingId ?
        data.map((entry) => (entry.id === editingId ? normalized : entry))
      : [...data, normalized];
    await onUpdate(next);
    resetForm();
  };

  const handleCloseDrawer = () => {
    setSelectedReqId(null);
  };

  if (isFormOpen) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div
            className={`bg-${themeColor} px-10 py-8 text-white flex justify-between items-center`}>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                {editingId ?
                  "Edit Consultant Requisition"
                : "Add Consultant Requisition"}
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Fill all consultant agreement details.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
              Back to List
            </button>
          </div>

          <div className="p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    1. Consultant Basics
                  </h2>
                  <div className={sectionDividerClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className={fieldLabelClass}>
                    Vendor/Consultant Name
                  </label>
                  <input
                    value={formData.vendorName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vendorName: e.target.value,
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm">
                    <option value="">Select location</option>
                    {availableLocationOptions.map((location) => (
                      <option
                        key={location}
                        value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Fund Type
                  </label>
                  <select
                    value={formData.fundType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fundType: e.target.value,
                      }))
                    }
                    className={fieldInputClass}>
                    <option value="LC">LC</option>
                    <option value="FCRA">FCRA</option>
                  </select>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className={fieldLabelClass}>
                      PAN no
                    </label>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[9px] font-black uppercase tracking-[0.16em] text-brand-600 underline underline-offset-2"
                    >
                      Verify PAN
                    </a>
                  </div>
                  <input
                    value={formData.panNo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        panNo: e.target.value,
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Name as per PAN
                  </label>
                  <input
                    value={formData.vendorName}
                    readOnly
                    className={fieldReadOnlyClass}
                    placeholder="Name as per PAN"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Contact Number
                  </label>
                  <input
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactNumber: e.target.value,
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Consultant Type
                  </label>
                  <select
                    value={formData.consultantType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        consultantType: e.target.value,
                      }))
                    }
                    className={fieldInputClass}>
                    <option value="">Select consultant type</option>
                    <option value="Program">Program</option>
                    <option value="Ho program">Ho program</option>
                    <option value="Ho admin">Ho admin</option>
                  </select>
                </div>
                <div className="md:col-span-2 xl:col-span-3">
                  <label className={fieldLabelClass}>
                    Address
                  </label>
                  <input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    2. Agreement And Posting Schedule
                  </h2>
                  <div className={sectionDividerClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className={fieldLabelClass}>
                    Agreement Start Date
                  </label>
                  <CompactDatePicker
                    value={formData.agreementStartDate}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        agreementStartDate: value,
                      }))
                    }
                    className="border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold"
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Agreement End Date
                  </label>
                  <CompactDatePicker
                    value={formData.agreementEndDate}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        agreementEndDate: value,
                      }))
                    }
                    className="border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold"
                    placeholder="Select end date"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Agreement Gross Amount
                  </label>
                  <input
                    type="number"
                    value={formData.grossAmount === 0 ? "" : formData.grossAmount}
                    onChange={(e) =>
                      updateAmounts(
                        e.target.value === "" ? 0 : Number(e.target.value) || 0,
                        formData.gstPercent,
                      )
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    GST %
                  </label>
                  <input
                    type="number"
                    value={formData.gstPercent}
                    onChange={(e) =>
                      updateAmounts(
                        formData.grossAmount,
                        Number(e.target.value) || 0,
                      )
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    GST Amount
                  </label>
                  <input
                    value={formData.gstAmount.toFixed(2)}
                    readOnly
                    className={fieldReadOnlyClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Total Agreement Amount
                  </label>
                  <input
                    value={formData.totalAmount.toFixed(2)}
                    readOnly
                    className={fieldReadOnlyClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Posting Frequency
                  </label>
                  <select
                    value={formData.postingFrequency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        postingFrequency: e.target.value,
                      }))
                    }
                    className={fieldInputClass}>
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Monthly">Bi-Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Automatic Posting as per Frequency
                  </label>
                  <div className="flex items-center gap-4 h-[42px] px-3 bg-slate-50 border-2 border-slate-200 rounded-xl">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="radio"
                        checked={formData.autoPosting === "Y"}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, autoPosting: "Y" }))
                        }
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="radio"
                        checked={formData.autoPosting === "N"}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            autoPosting: "N",
                            autoPostingDate: "",
                          }))
                        }
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Automatic Posting Date If Yes
                  </label>
                  <MonthlyDayPicker
                    value={formData.autoPostingDate}
                    disabled={formData.autoPosting !== "Y"}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoPostingDate: value,
                      }))
                    }
                    className="px-3 py-2.5 text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Agreement Termination Date
                  </label>
                  <CompactDatePicker
                    value={formData.agreementTerminationDate}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        agreementTerminationDate: value,
                      }))
                    }
                    placeholder="Select termination date"
                    className="px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-2">
                  <label className={fieldLabelClass}>
                    Reason for Termination
                  </label>
                  <input
                    value={formData.terminationReason}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        terminationReason: e.target.value,
                      }))
                    }
                    className={fieldInputClass}
                    placeholder="Enter reason for termination"
                  />
                </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    3. Bank Details
                  </h2>
                  <div className={sectionDividerClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="md:col-span-2 xl:col-span-3">
                  <label className={`${fieldLabelClass} mb-2.5`}>
                    Bank Details
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <input
                      value={bankDetailsForm.accountName}
                      onChange={(e) =>
                        updateBankDetailsField("accountName", e.target.value)
                      }
                      placeholder="Account Holder Name"
                      className={fieldInputClass}
                    />
                    <input
                      value={bankDetailsForm.accountNumber}
                      onChange={(e) =>
                        updateBankDetailsField("accountNumber", e.target.value)
                      }
                      placeholder="Account Number"
                      className={fieldInputClass}
                    />
                    <input
                      value={bankDetailsForm.bankName}
                      onChange={(e) =>
                        updateBankDetailsField("bankName", e.target.value)
                      }
                      placeholder="Bank Name"
                      className={fieldInputClass}
                    />
                    <input
                      value={bankDetailsForm.ifscCode}
                      onChange={(e) =>
                        updateBankDetailsField("ifscCode", e.target.value.toUpperCase())
                      }
                      placeholder="IFSC Code"
                      className={`${fieldInputClass} uppercase`}
                    />
                    <input
                      value={bankDetailsForm.branchName}
                      onChange={(e) =>
                        updateBankDetailsField("branchName", e.target.value)
                      }
                      placeholder="Branch Name"
                      className={`${fieldInputClass} md:col-span-2 xl:col-span-1`}
                    />
                  </div>
                </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    4. Documents
                  </h2>
                  <div className={sectionDividerClass} />
                </div>
              <div>
                <label className={fieldLabelClass}>
                  Attachments
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setCurrentFile(file || null);
                      setFormData((prev) => ({
                        ...prev,
                        attachments: file?.name || "",
                      }));
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-100 file:text-brand-700 file:font-bold"
                  />
                  {formData.attachments && (
                    <div className="text-xs text-slate-600 font-medium px-2">
                      📎 {formData.attachments}
                    </div>
                  )}
                  {currentFile && (
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={aiProvider}
                        onChange={(e) =>
                          setAiProvider(
                            e.target.value === "ollama" ? "ollama" : "openai",
                          )
                        }
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30">
                        <option value="openai">OpenAI API</option>
                        <option value="ollama">Ollama (local)</option>
                      </select>
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
                    </div>
                  )}
                </div>
              </div>
              </div>

              <div className="pt-5 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`px-8 py-2.5 bg-${themeColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                  {editingId ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                {filterMode === "renewals" ?
                  "Consultant Renewals in Next 2 Months"
                : "Consultant Requisition Management"}
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Table includes all consultant requisition columns.
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

        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateForm}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              Add Record
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              Delete Record
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-300">
                  <th className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedEntries.size === filteredData.length &&
                        filteredData.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-brand-600"
                    />
                  </th>
                  <th className="px-4 py-4">Vendor/Consultant Name</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Posting Frequency</th>
                  <th className="px-4 py-4">Fund Type</th>
                  <th className="px-4 py-4">PAN no</th>
                  <th className="px-4 py-4">Bank Details</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Contact Number</th>
                  <th className="px-4 py-4">Address</th>
                  <th className="px-4 py-4">Agreement Start Date</th>
                  <th className="px-4 py-4">Agreement End Date</th>
                  <th className="px-4 py-4">
                    Automatic Posting as per Frequency
                  </th>
                  <th className="px-4 py-4">Automatic Posting Date If Yes</th>
                  <th className="px-4 py-4">Attachments</th>
                  <th className="px-4 py-4">
                    Agreement Gross Amount (without GST)
                  </th>
                  <th className="px-4 py-4">GST %</th>
                  <th className="px-4 py-4">GST Amount</th>
                  <th className="px-4 py-4">Total Agreement Amount</th>
                  <th className="px-4 py-4">TDS Account</th>
                  <th className="px-4 py-4">TDS %</th>
                  <th className="px-4 py-4">TDS Amount</th>
                  <th className="px-4 py-4 text-center">View</th>
                  <th className="px-4 py-4 text-center">Edit</th>
                </tr>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-3 py-2"></th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={filterVendor}
                      onChange={(e) => setFilterVendor(e.target.value)}
                      placeholder="Filter..."
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(entry.id)}
                        onChange={() => toggleSelectEntry(entry.id)}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-brand-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {entry.vendorName}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.location || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.postingFrequency}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold ${
                          entry.fundType === "FCRA" ?
                            "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                        }`}>
                        {entry.fundType || "LC"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.panNo || ""}</td>
                    <td className="px-4 py-3 text-xs">
                      {entry.bankDetails || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.email || ""}</td>
                    <td className="px-4 py-3 text-xs">
                      {entry.contactNumber || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.address || ""}</td>
                    <td className="px-4 py-3 text-xs">
                      {entry.agreementStartDate}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.agreementEndDate}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.autoPosting === "Y" ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.autoPostingDate || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.attachments || ""}
                    </td>
                    <td className="px-4 py-3 text-xs font-black">
                      INR {(Number(entry.grossAmount) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.gstPercent}</td>
                    <td className="px-4 py-3 text-xs">
                      INR {(Number(entry.gstAmount) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-black">
                      INR {(Number(entry.totalAmount) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {mappedTdsAccountName}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {mappedTdsPercent > 0 ? `${mappedTdsPercent}%` : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-black">
                      {mappedTdsPercent > 0 ?
                        `INR ${(
                          (Number(entry.grossAmount) || 0) *
                          mappedTdsPercent /
                          100
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}`
                      : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedReqId(entry.id)}
                        className="px-3 py-1 bg-slate-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-slate-700 transition">
                        View
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEditForm(entry)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-blue-700 transition">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={24}
                      className="px-4 py-8 text-center text-sm text-slate-500">
                      No consultant records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-slate-500 font-semibold">
            Showing{" "}
            <span className="font-black text-brand-600">
              {filteredData.length}
            </span>{" "}
            of <span className="font-black">{data.length}</span> entries
          </div>
        </div>
      </div>

      <RequisitionDetailsDrawer
        reqId={selectedReqId}
        sourceType={selectedReqId ? "Consultant" : null}
        consultantData={data}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};
