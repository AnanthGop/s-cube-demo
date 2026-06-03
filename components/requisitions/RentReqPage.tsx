import React, { useMemo, useState } from "react";
import type { RentEntry } from "./rentTypes";
import { CompactDatePicker } from "../shared/CompactDatePicker";
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

interface RentReqPageProps {
  themeColor?: string;
  data: RentEntry[];
  locations?: string[];
  filterMode?: "all" | "renewals";
  onUpdate: (next: RentEntry[]) => void | Promise<void>;
  onBackToLanding?: () => void;
}

const createEmptyEntry = (id: string): RentEntry => ({
  id,
  centre: "",
  landlordName: "",
  contactNumber: "",
  email: "",
  address: "",
  bankDetails: "",
  panNumber: "",
  nameAsPerPan: "",
  rentalAgreement: "",
  renewalIn2Months: "",
  startDate: "",
  endDate: "",
  agreementTerminationDate: "",
  terminationReason: "",
  fundType: "LC",
  rentAmount: 0,
  gstAmount: 0,
  totalRentAmount: 0,
  incrementType: "Percentage",
  incrementValue: 0,
  incrementPercent: 0,
  incrementPeriod: "Annual",
  incrementCustomDate: "",
  securityDeposit: 0,
  securityDepositRefunded: "N",
  amountRefunded: undefined,
  dateOfRefund: "",
  activeForJV: "Y",
  autoPostingDate: "",
  budgetCode: "",
  currentRent: 0,
  tds: undefined,
  status: "Hold",
  remarks: "",
});

const nextRentId = (entries: RentEntry[]) => {
  const max = entries.reduce((acc, entry) => {
    const n = Number(entry.id.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `R${String(max + 1).padStart(3, "0")}`;
};

const normalizeDateForInput = (value: string) => {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const monthName = match[2].toLowerCase();
  const yearPart = Number(match[3]);
  if (!Number.isFinite(day) || day < 1 || day > 31) return "";

  const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };

  const month = monthMap[monthName];
  if (!month) return "";

  const year = match[3].length === 2 ? 2000 + yearPart : yearPart;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const normalizeFileToken = (value: string) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");

export const RentReqPage: React.FC<RentReqPageProps> = ({
  themeColor = "brand-600",
  data,
  locations = [],
  filterMode = "all",
  onUpdate,
  onBackToLanding,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [formData, setFormData] = useState<RentEntry>(createEmptyEntry("R001"));
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(),
  );
  const [dateFilter] = useState("Current");
  const [filterCentre, setFilterCentre] = useState("");
  const [filterLandlord, setFilterLandlord] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [uploadedAgreementName, setUploadedAgreementName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [bankDetailsForm, setBankDetailsForm] = useState<BankDetailsParts>(
    emptyBankDetails(),
  );

  const filteredData = useMemo(() => {
    let baseData = data;

    // Apply renewals filter if in renewals mode
    if (filterMode === "renewals") {
      const today = new Date();
      const twoMonthsFromNow = new Date(today);
      twoMonthsFromNow.setMonth(today.getMonth() + 2);

      baseData = data.filter((entry) => {
        if (!entry.endDate || entry.endDate.trim() === "") return false;
        try {
          const endDate = new Date(entry.endDate);
          return endDate >= today && endDate <= twoMonthsFromNow;
        } catch {
          return false;
        }
      });
    }

    return baseData.filter((entry) => {
      const matchesCentre =
        filterCentre === "" ||
        entry.centre.toLowerCase().includes(filterCentre.toLowerCase());
      const matchesLandlord =
        filterLandlord === "" ||
        entry.landlordName.toLowerCase().includes(filterLandlord.toLowerCase());
      const matchesStatus =
        filterStatus === "" || (entry.status || "") === filterStatus;
      return matchesCentre && matchesLandlord && matchesStatus;
    });
  }, [data, filterMode, filterCentre, filterLandlord, filterStatus]);

  const locationOptions = useMemo(() => {
    const set = new Set(
      locations.map((name) => name.trim()).filter((name) => name.length > 0),
    );
    if (formData.centre.trim()) {
      set.add(formData.centre.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [locations, formData.centre]);

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
  const computedIncrementValue =
    formData.incrementType === "Percentage" ?
      Number((((Number(formData.rentAmount) || 0) * (Number(formData.incrementPercent) || 0)) / 100).toFixed(2))
    : Number(formData.incrementValue) || 0;
  const computedTotalRentAmount = Number(
    ((Number(formData.rentAmount) || 0) + (Number(formData.gstAmount) || 0)).toFixed(2),
  );

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setIsViewMode(false);
    setFormData(createEmptyEntry(nextRentId(data)));
    setBankDetailsForm(emptyBankDetails());
    setCurrentFile(null);
  };
  const handleExtractPDFData = async () => {
    if (!currentFile) return;

    setIsExtracting(true);
    try {
      // Placeholder for AI extraction - implement actual API call here
      alert(`AI extraction initiated for ${currentFile.name}`);
      // TODO: Implement actual PDF extraction logic
      // const formData = new FormData();
      // formData.append("pdf", currentFile);
      // const response = await fetch("/api/extract-rent-data", {
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

  const openCreateForm = () => {
    setEditingId(null);
    setIsViewMode(false);
    setFormData(createEmptyEntry(nextRentId(data)));
    setBankDetailsForm(emptyBankDetails());
    setUploadedAgreementName("");
    setCurrentFile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: RentEntry) => {
    setEditingId(entry.id);
    setIsViewMode(false);
    const normalizedEntry = {
      ...entry,
      startDate: normalizeDateForInput(entry.startDate),
      endDate: normalizeDateForInput(entry.endDate),
      agreementTerminationDate: normalizeDateForInput(
        entry.agreementTerminationDate || "",
      ),
      autoPostingDate: normalizeMonthlyPostingDay(entry.autoPostingDate || ""),
      incrementType: entry.incrementType || "Percentage",
      incrementValue: entry.incrementValue ?? 0,
      incrementPercent: entry.incrementPercent ?? 0,
      gstAmount: entry.gstAmount ?? 0,
      totalRentAmount:
        entry.totalRentAmount ??
        (Number(entry.rentAmount) || 0) + (Number(entry.gstAmount) || 0),
      incrementPeriod:
        entry.incrementPeriod === "Custom Date" ? "Custom Date" : "Annual",
      incrementCustomDate: normalizeDateForInput(entry.incrementCustomDate || ""),
      contactNumber: String(entry.contactNumber || ""),
      email: String(entry.email || ""),
      address: String(entry.address || ""),
      terminationReason: String(entry.terminationReason || ""),
    };
    setFormData(normalizedEntry);
    setBankDetailsForm(parseBankDetails(normalizedEntry.bankDetails || ""));
    setUploadedAgreementName(entry.rentalAgreement || "");
    setIsFormOpen(true);
  };

  const openViewForm = (entry: RentEntry) => {
    setEditingId(entry.id);
    setIsViewMode(true);
    const normalizedEntry = {
      ...entry,
      startDate: normalizeDateForInput(entry.startDate),
      endDate: normalizeDateForInput(entry.endDate),
      agreementTerminationDate: normalizeDateForInput(
        entry.agreementTerminationDate || "",
      ),
      autoPostingDate: normalizeMonthlyPostingDay(entry.autoPostingDate || ""),
      incrementType: entry.incrementType || "Percentage",
      incrementValue: entry.incrementValue ?? 0,
      incrementPercent: entry.incrementPercent ?? 0,
      gstAmount: entry.gstAmount ?? 0,
      totalRentAmount:
        entry.totalRentAmount ??
        (Number(entry.rentAmount) || 0) + (Number(entry.gstAmount) || 0),
      incrementPeriod:
        entry.incrementPeriod === "Custom Date" ? "Custom Date" : "Annual",
      incrementCustomDate: normalizeDateForInput(entry.incrementCustomDate || ""),
      contactNumber: String(entry.contactNumber || ""),
      email: String(entry.email || ""),
      address: String(entry.address || ""),
      terminationReason: String(entry.terminationReason || ""),
    };
    setFormData(normalizedEntry);
    setBankDetailsForm(parseBankDetails(normalizedEntry.bankDetails || ""));
    setUploadedAgreementName(entry.rentalAgreement || "");
    setCurrentFile(null);
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
      `Are you sure you want to delete ${selectedEntries.size} selected entry(ies)?`,
    );
    if (!confirmed) return;

    const next = data.filter((entry) => !selectedEntries.has(entry.id));
    await onUpdate(next);
    setSelectedEntries(new Set());
  };

  const handleSave = async () => {
    if (!formData.centre.trim() || !formData.landlordName.trim()) {
      alert("Location and Landlord Name are required.");
      return;
    }

    const rawFileName = (
      formData.rentalAgreement ||
      uploadedAgreementName ||
      ""
    ).trim();
    const extMatch = rawFileName.match(/\.([A-Za-z0-9]+)$/);
    const inputExt = extMatch ? extMatch[1].toLowerCase() : "";
    const fileExt =
      inputExt === "doc" || inputExt === "docx" ? inputExt : "pdf";
    const landlordToken =
      normalizeFileToken(formData.landlordName) || "landlord";
    const locationToken = normalizeFileToken(formData.centre) || "location";
    const normalizedAgreementFileName = `${landlordToken}_${locationToken}.${fileExt}`;

    const normalized: RentEntry = {
      ...formData,
      centre: formData.centre.trim(),
      landlordName: formData.landlordName.trim(),
      contactNumber: String(formData.contactNumber || "").trim(),
      email: String(formData.email || "").trim(),
      address: String(formData.address || "").trim(),
      bankDetails: String(formData.bankDetails || "").trim(),
      panNumber: String(formData.panNumber || "").trim(),
      nameAsPerPan: String(formData.landlordName || "").trim(),
      fundType: formData.fundType || "LC",
      status: formData.status || "Hold",
      securityDepositRefunded:
        formData.securityDepositRefunded === "Y" ? "Y" : "N",
      activeForJV: formData.activeForJV === "N" ? "N" : "Y",
      autoPostingDate: formData.autoPostingDate || "",
      budgetCode: (formData.budgetCode || "").trim(),
      rentalAgreement: normalizedAgreementFileName,
      renewalIn2Months: formData.renewalIn2Months || "",
      incrementPeriod:
        formData.incrementPeriod === "Custom Date" ? "Custom Date" : "Annual",
      incrementCustomDate:
        formData.incrementPeriod === "Custom Date" ?
          formData.incrementCustomDate || ""
        : "",
      incrementType: formData.incrementType || "Percentage",
      incrementValue: computedIncrementValue,
      incrementPercent:
        formData.incrementType === "Percentage" ?
          Number(formData.incrementPercent) || 0
        : 0,
      gstAmount: Number(formData.gstAmount) || 0,
      totalRentAmount: computedTotalRentAmount,
      currentRent: Number(formData.rentAmount) || 0,
      dateOfRefund: formData.dateOfRefund || "",
      agreementTerminationDate: formData.agreementTerminationDate || "",
      terminationReason: String(formData.terminationReason || "").trim(),
      remarks: formData.remarks || "",
    };

    const next =
      editingId ?
        data.map((entry) => (entry.id === editingId ? normalized : entry))
      : [...data, normalized];

    await onUpdate(next);
    resetForm();
  };

  if (isFormOpen) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div
            className={`bg-${themeColor} px-10 py-8 text-white flex justify-between items-center`}>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                {isViewMode ?
                  "View Rent Record"
                : editingId ?
                  "Edit Rent Record"
                : "Add New Rent Record"}
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                {isViewMode ?
                  "Review rental property information"
                : editingId ?
                  "Update rental property information"
                : "Create a new rental property entry"}
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
              <fieldset
                disabled={isViewMode}
                className="space-y-4 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>1. Landlord Details</h2>
                  <div className={sectionDividerClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className={fieldLabelClass}>
                    Landlord Name
                  </label>
                  <input
                    value={formData.landlordName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        landlordName: e.target.value,
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
                    value={formData.centre}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        centre: e.target.value,
                      }))
                    }
                    className={fieldInputClass}>
                    <option value="">Select location</option>
                    {locationOptions.map((location) => (
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
                    value={formData.fundType || "LC"}
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
                      PAN Number
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
                    value={formData.panNumber || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        panNumber: e.target.value,
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
                    value={formData.landlordName || ""}
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
                    value={formData.contactNumber || ""}
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
                    Email ID
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-2">
                  <label className={fieldLabelClass}>
                    Address
                  </label>
                  <input
                    value={formData.address || ""}
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
              </fieldset>

              <fieldset
                disabled={isViewMode}
                className="space-y-4 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    2. Rent Agreement And Posting Schedule
                  </h2>
                  <div className={sectionDividerClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className={fieldLabelClass}>
                    Agreement Start Date
                  </label>
                  <CompactDatePicker
                    value={formData.startDate}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: value,
                      }))
                    }
                    className="border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Agreement End Date
                  </label>
                  <CompactDatePicker
                    value={formData.endDate}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: value,
                      }))
                    }
                    className="border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Security Deposit
                  </label>
                  <input
                    type="number"
                    value={formData.securityDeposit || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        securityDeposit: Number(e.target.value) || 0,
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Rent Amt (before GST)
                  </label>
                  <input
                    type="number"
                    value={formData.rentAmount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rentAmount: Number(e.target.value) || 0,
                        incrementValue:
                          prev.incrementType === "Percentage" ?
                            Number((((Number(e.target.value) || 0) * (Number(prev.incrementPercent) || 0)) / 100).toFixed(2))
                          : prev.incrementValue,
                        totalRentAmount:
                          Number((((Number(e.target.value) || 0) + (Number(prev.gstAmount) || 0))).toFixed(2)),
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    GST Amount
                  </label>
                  <input
                    type="number"
                    value={formData.gstAmount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gstAmount: Number(e.target.value) || 0,
                        totalRentAmount:
                          Number((((Number(prev.rentAmount) || 0) + (Number(e.target.value) || 0))).toFixed(2)),
                      }))
                    }
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Total Rent Amount
                  </label>
                  <input
                    type="number"
                    value={computedTotalRentAmount || ""}
                    readOnly
                    className={fieldReadOnlyClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Rent Increment Type
                  </label>
                  <select
                    value={formData.incrementType || "Percentage"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        incrementType:
                          e.target.value === "Amount" ? "Amount" : "Percentage",
                        incrementPercent:
                          e.target.value === "Amount" ? 0 : Number(prev.incrementPercent) || 0,
                        incrementValue:
                          e.target.value === "Amount" ?
                            Number(prev.incrementValue) || 0
                          : Number((((Number(prev.rentAmount) || 0) * (Number(prev.incrementPercent) || 0)) / 100).toFixed(2)),
                      }))
                    }
                    className={fieldInputClass}>
                    <option value="Percentage">Percentage</option>
                    <option value="Amount">Amount</option>
                  </select>
                </div>
                {formData.incrementType === "Percentage" && (
                  <div>
                    <label className={fieldLabelClass}>
                      Rent Increase %
                    </label>
                    <input
                      type="number"
                      value={formData.incrementPercent || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          incrementPercent: Number(e.target.value) || 0,
                          incrementValue:
                            Number((((Number(prev.rentAmount) || 0) * (Number(e.target.value) || 0)) / 100).toFixed(2)),
                        }))
                      }
                      className={fieldInputClass}
                    />
                  </div>
                )}
                <div>
                  <label className={fieldLabelClass}>
                    Rent Increment Value
                  </label>
                  <input
                    type="number"
                    value={computedIncrementValue || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        incrementValue:
                          prev.incrementType === "Amount" ? Number(e.target.value) || 0 : computedIncrementValue,
                      }))
                    }
                    readOnly={formData.incrementType === "Percentage"}
                    className={formData.incrementType === "Percentage" ? fieldReadOnlyClass : fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Incremental Time Frame
                  </label>
                  <select
                    value={formData.incrementPeriod || "Annual"}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        incrementPeriod: nextValue,
                        incrementCustomDate:
                          nextValue === "Custom Date" ? prev.incrementCustomDate || "" : "",
                      }));
                    }}
                    className={fieldInputClass}>
                    <option value="Annual">Annual</option>
                    <option value="Custom Date">Custom Date</option>
                  </select>
                </div>
                {formData.incrementPeriod === "Custom Date" && (
                  <div>
                    <label className={fieldLabelClass}>
                      Custom Increment Date
                    </label>
                    <CompactDatePicker
                      value={formData.incrementCustomDate || ""}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          incrementCustomDate: value,
                        }))
                      }
                      placeholder="Select custom date"
                      className="border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
                    />
                  </div>
                )}
                <div>
                  <label className={fieldLabelClass}>
                    Automatic Posting as per Frequency
                  </label>
                  <div className="flex items-center gap-4 h-[42px] px-3 bg-slate-50 border-2 border-slate-200 rounded-xl">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="radio"
                        checked={formData.activeForJV !== "N"}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            activeForJV: "Y",
                          }))
                        }
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="radio"
                        checked={formData.activeForJV === "N"}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            activeForJV: "N",
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
                    value={formData.autoPostingDate || ""}
                    disabled={formData.activeForJV === "N"}
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
                    value={formData.agreementTerminationDate || ""}
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
                    value={formData.terminationReason || ""}
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
              </fieldset>

              <fieldset
                disabled={isViewMode}
                className="space-y-4 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    3. Bank Details
                  </h2>
                  <div className={sectionDividerClass} />
                </div>
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
                  className={`${fieldInputClass} md:col-span-2 xl:col-span-2`}
                />
                </div>
              </fieldset>

              <fieldset
                disabled={isViewMode}
                className="space-y-4 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    4. Documents
                  </h2>
                  <div className={sectionDividerClass} />
                </div>
                <div className="space-y-3">
                <div className="md:col-span-2 xl:col-span-3">
                  <label className={fieldLabelClass}>
                    Add File (PDF, Word)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setCurrentFile(file || null);
                        setUploadedAgreementName(file?.name || "");
                        setFormData((prev) => ({
                          ...prev,
                          rentalAgreement: file?.name || "",
                        }));
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-100 file:text-brand-700 file:font-bold"
                    />
                    {formData.rentalAgreement && (
                      <div className="text-xs text-slate-600 font-medium px-2">
                        📎 {formData.rentalAgreement}
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
                </div>
                </div>
              </fieldset>
              <div className="pt-6 border-t border-slate-200 flex justify-end gap-4">
                <button
                  onClick={resetForm}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition">
                  {isViewMode ? "Back" : "Cancel"}
                </button>
                {!isViewMode && (
                  <button
                    onClick={handleSave}
                    className={`px-10 py-3 bg-${themeColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                    {editingId ? "Save Changes" : "Create Record"}
                  </button>
                )}
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
                  "Renewals in Next 2 Months"
                : "Rent Master"}
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                {filterMode === "renewals" ?
                  "View and manage rental agreements expiring in the next 2 months"
                : "Manage rental properties, agreements, and schedules"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {onBackToLanding && (
                <button
                  onClick={onBackToLanding}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                  Back to Rent Landing Page
                </button>
              )}
              <div className="text-right">
                <div className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  Period
                </div>
                <div className="text-lg font-black">{dateFilter}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateForm}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              Add New Record
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
                  <th className="px-4 py-4">Landlord Name</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Fund Type</th>
                  <th className="px-4 py-4">Bank Details</th>
                  <th className="px-4 py-4">PAN Number</th>
                  <th className="px-4 py-4">Start Date</th>
                  <th className="px-4 py-4">End Date</th>
                  <th className="px-4 py-4">Rent Amount</th>
                  <th className="px-4 py-4">Rent Increment Type</th>
                  <th className="px-4 py-4">Increment Value</th>
                  <th className="px-4 py-4">Incremental Time Frame</th>
                  <th className="px-4 py-4">Auto Voucher</th>
                  <th className="px-4 py-4">Automatic Posting Date</th>
                  <th className="px-4 py-4">Budget Code</th>
                  <th className="px-4 py-4">Security Deposit</th>
                  <th className="px-4 py-4">Add File</th>
                  <th className="px-4 py-4">Remarks</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-3 py-2"></th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={filterLandlord}
                      onChange={(e) => setFilterLandlord(e.target.value)}
                      placeholder="Filter..."
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={filterCentre}
                      onChange={(e) => setFilterCentre(e.target.value)}
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
                    <td className="px-4 py-3 text-xs">{entry.landlordName}</td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {entry.centre}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold ${
                          entry.fundType === "FCRA" ?
                            "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                        }`}>
                        {entry.fundType || "LC"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.bankDetails || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.panNumber || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.startDate}</td>
                    <td className="px-4 py-3 text-xs">{entry.endDate}</td>
                    <td className="px-4 py-3 text-xs font-black">
                      INR {entry.rentAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.incrementType || "Percentage"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.incrementValue ?? entry.incrementPercent ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.incrementPeriod || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.activeForJV === "Y" ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.autoPostingDate || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.budgetCode || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      INR {entry.securityDeposit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.rentalAgreement || ""}
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.remarks || ""}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewForm(entry)}
                          className="px-3 py-1 bg-slate-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-slate-700 transition">
                          View
                        </button>
                        <button
                          onClick={() => openEditForm(entry)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-blue-700 transition">
                          {filterMode === "renewals" ? "Renew" : "Edit"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={19}
                      className="px-4 py-8 text-center text-sm text-slate-500">
                      No rent records found.
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
    </div>
  );
};
