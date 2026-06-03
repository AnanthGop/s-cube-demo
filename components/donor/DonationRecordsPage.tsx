import React, { useMemo, useState } from "react";
import type { DonorRecord, FundTypeItem } from "./donorRules";
import {
  DONATION_MODE_OF_RECEIPT_OPTIONS,
  RECEIPT_SENT_OPTIONS,
  type ChartOfAccountsCategory,
  type DonationReceiptMode,
  type DonationRecord,
  type DonationType,
  type RecordedDonationFilterKey,
  type RecordedDonationFilters,
  filterRecordedDonations,
  get80GEligibilityBreakup,
  getAvailableDonationTypes,
  getRequiredDonationFields,
  searchDonors,
  selectBankAccountLedgers,
} from "./donationRules";

interface MasterItem {
  id: number | string;
  name: string;
  code?: string;
  status?: string;
  locations?: string[];
}

interface CompanyItem {
  id: number | string;
  name: string;
  pan?: string;
  eightyGNo?: string;
  eightyGDate?: string;
  fcraNo?: string;
  fcraDate?: string;
  address?: string;
  contact?: string;
  email?: string;
  status?: string;
}

interface DonationRecordsPageProps {
  donors: DonorRecord[];
  donations: DonationRecord[];
  fundTypes: FundTypeItem[];
  projects: MasterItem[];
  chartOfAccounts: ChartOfAccountsCategory[];
  locations: MasterItem[];
  companies: CompanyItem[];
  onUpdate: (donations: DonationRecord[]) => void;
  onAddDonor: () => void;
  themeColor?: string;
}

interface DonationDraft {
  donorId: string;
  donationDate: string;
  donationType: DonationType | "";
  amount: string;
  projectId: string;
  fundType: string;
  modeOfReceipt: DonationReceiptMode;
  bankAccount: string;
  transactionReference: string;
  chequeBankName: string;
  location: string;
}

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const createInitialDraft = (fundTypes: FundTypeItem[]): DonationDraft => ({
  donorId: "",
  donationDate: todayIsoDate(),
  donationType: "General Donation",
  amount: "",
  projectId: "",
  fundType: fundTypes[0]?.name || "",
  modeOfReceipt: "Bank Transfer",
  bankAccount: "",
  transactionReference: "",
  chequeBankName: "",
  location: "",
});

const formatCurrency = (value: string | number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const normalizeDateForReceipt = (date: string) => {
  if (!date) return "--";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }
  return date;
};

const maskIdNumber = (documentName: string, value: string) => {
  if (!value) return "--";
  if (documentName !== "Aadhaar") return value;

  const compactValue = value.replace(/\D/g, "");
  const lastFour = compactValue.slice(-4);
  return lastFour ? `XXXX-XXXX-${lastFour}` : "XXXX-XXXX";
};

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character];
  });

const getActiveItems = <T extends { status?: string }>(items: T[]) =>
  (items || []).filter((item) => (item.status || "Active") === "Active");

export const DonationRecordsPage: React.FC<DonationRecordsPageProps> = ({
  donors,
  donations,
  fundTypes,
  projects,
  chartOfAccounts,
  locations,
  companies,
  onUpdate,
  onAddDonor,
  themeColor = "brand-600",
}) => {
  const [donorSearch, setDonorSearch] = useState("");
  const [donorDropdownOpen, setDonorDropdownOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [recordedDonationFilters, setRecordedDonationFilters] =
    useState<RecordedDonationFilters>({});
  const [draft, setDraft] = useState<DonationDraft>(() =>
    createInitialDraft(fundTypes),
  );
  const [viewingReceipt, setViewingReceipt] = useState<DonationRecord | null>(
    null,
  );
  const activeCompanies = useMemo(() => getActiveItems(companies), [companies]);
  const [issuerCompanyId, setIssuerCompanyId] = useState<string>(
    String(activeCompanies[0]?.id || companies[0]?.id || ""),
  );

  const activeProjects = useMemo(() => getActiveItems(projects), [projects]);
  const activeFundTypes = useMemo(() => getActiveItems(fundTypes), [fundTypes]);
  const activeLocations = useMemo(() => getActiveItems(locations), [locations]);
  const bankLedgers = useMemo(
    () => selectBankAccountLedgers(chartOfAccounts || []),
    [chartOfAccounts],
  );
  const donorMatches = useMemo(
    () => searchDonors(donors || [], donorSearch),
    [donorSearch, donors],
  );
  const selectedDonor = useMemo(
    () => (donors || []).find((donor) => String(donor.id) === draft.donorId),
    [donors, draft.donorId],
  );
  const donationTypeOptions = useMemo(
    () =>
      selectedDonor ?
        getAvailableDonationTypes(selectedDonor.donorType)
      : getAvailableDonationTypes("Individual / HUF"),
    [selectedDonor],
  );
  const issuerCompany = useMemo(
    () =>
      (companies || []).find((company) => String(company.id) === issuerCompanyId) ||
      activeCompanies[0] ||
      companies[0],
    [activeCompanies, companies, issuerCompanyId],
  );
  const draft80GBreakup = useMemo(
    () => get80GEligibilityBreakup(draft),
    [draft.amount, draft.modeOfReceipt],
  );
  const showDraft80GBreakup =
    draft.modeOfReceipt === "Cash" && draft80GBreakup.hasCashCapApplied;
  const filteredDonations = useMemo(
    () => filterRecordedDonations(donations || [], recordedDonationFilters),
    [donations, recordedDonationFilters],
  );
  const hasRecordedDonationFilters = Object.values(recordedDonationFilters).some(
    (value) => String(value || "").trim(),
  );

  const inputClass =
    "w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";
  const filterInputClass =
    "w-full min-w-[8rem] px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";

  const updateDraft = <K extends keyof DonationDraft>(
    field: K,
    value: DonationDraft[K],
  ) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "donorId") {
        const donor = (donors || []).find((item) => String(item.id) === value);
        const allowedTypes =
          donor ? getAvailableDonationTypes(donor.donorType) : donationTypeOptions;
        next.donationType = allowedTypes.includes(next.donationType as DonationType) ?
          next.donationType
        : allowedTypes[0];
      }

      if (field === "modeOfReceipt" && value === "Cash") {
        next.bankAccount = "";
        next.transactionReference = "";
        next.chequeBankName = "";
      }

      if (field === "modeOfReceipt" && value === "Bank Transfer") {
        next.chequeBankName = "";
      }

      return next;
    });
  };

  const handleDonorSelect = (donor: DonorRecord) => {
    updateDraft("donorId", String(donor.id));
    setDonorSearch(donor.donorName);
    setDonorDropdownOpen(false);
  };

  const closeAddDonationForm = () => {
    setIsAddFormOpen(false);
    setDonorDropdownOpen(false);
  };

  const updateRecordedDonationFilter = (
    field: RecordedDonationFilterKey,
    value: string,
  ) => {
    setRecordedDonationFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderRecordedDonationFilter = (
    field: RecordedDonationFilterKey,
    label: string,
    placeholder = "Filter",
  ) => (
    <input
      type="text"
      aria-label={`Filter ${label}`}
      value={recordedDonationFilters[field] || ""}
      onChange={(event) => updateRecordedDonationFilter(field, event.target.value)}
      placeholder={placeholder}
      className={filterInputClass}
    />
  );

  const validateDraft = () => {
    const requiredFields = getRequiredDonationFields(draft.modeOfReceipt);
    const missingField = requiredFields.find((field) => {
      const value = draft[field as keyof DonationDraft];
      return !String(value || "").trim();
    });
    if (missingField) {
      window.alert("Please fill all required donation fields.");
      return false;
    }

    if (!selectedDonor) {
      window.alert("Please select a valid donor.");
      return false;
    }

    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Please enter a donation amount greater than 0.");
      return false;
    }

    if (!donationTypeOptions.includes(draft.donationType as DonationType)) {
      window.alert("Selected donation type is not allowed for this donor.");
      return false;
    }

    return true;
  };

  const handleSaveDonation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateDraft() || !selectedDonor) return;

    const project = activeProjects.find(
      (item) => String(item.id) === draft.projectId,
    );
    const nextDonation: DonationRecord = {
      id: Date.now(),
      donorId: selectedDonor.id,
      donorName: selectedDonor.donorName,
      donorType: selectedDonor.donorType,
      donationDate: draft.donationDate,
      donationType: draft.donationType as DonationType,
      amount: draft.amount,
      projectId: draft.projectId,
      projectName: project?.name || draft.projectId,
      fundType: draft.fundType,
      modeOfReceipt: draft.modeOfReceipt,
      bankAccount: draft.bankAccount,
      transactionReference: draft.transactionReference,
      chequeBankName: draft.chequeBankName,
      location: draft.location,
      receiptNumber: "",
      receiptSent: "No",
      validationStatus: "Pending",
      receiptPosted: "No",
      receiptPostedDate: "",
      createdAt: new Date().toISOString(),
    };

    onUpdate([...(donations || []), nextDonation]);
    setDraft(createInitialDraft(activeFundTypes));
    setDonorSearch("");
    closeAddDonationForm();
  };

  const updateReceiptSent = (
    donationId: number,
    receiptSent: DonationRecord["receiptSent"],
  ) => {
    onUpdate(
      (donations || []).map((donation) =>
        donation.id === donationId ? { ...donation, receiptSent } : donation,
      ),
    );
  };

  const renderReceiptHtml = (donation: DonationRecord) => {
    const donor = (donors || []).find((item) => item.id === donation.donorId);
    const issuerName = issuerCompany?.name || "Organisation";
    const eightyGBreakup = get80GEligibilityBreakup(donation);
    const donorIdLabel =
      donor ?
        `${donor.kycDocument || "--"} - ${maskIdNumber(donor.kycDocument || "", donor.idNumber || "")}`
      : "--";
    const chequeNote =
      donation.modeOfReceipt === "Cheque" ?
        "<p><strong>Note:</strong> This receipt is subject to realization of cheque.</p>"
      : "";
    const cash80GNote =
      eightyGBreakup.hasCashCapApplied ?
        `<p><strong>80G Note:</strong> ${escapeHtml(formatCurrency(eightyGBreakup.eligibleAmount))} is eligible for 80G deduction. ${escapeHtml(formatCurrency(eightyGBreakup.ineligibleAmount))} is not eligible for 80G deduction.</p>`
      : "";

    return `
      <html>
        <head>
          <title>Donation Receipt ${donation.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; line-height: 1.5; }
            .receipt { max-width: 760px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 28px; }
            h1, h2, p { margin: 0 0 10px; }
            h1 { font-size: 22px; text-transform: uppercase; }
            h2 { font-size: 15px; text-transform: uppercase; margin-top: 22px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { border: 1px solid #e2e8f0; padding: 8px; font-size: 13px; vertical-align: top; }
            .label { width: 35%; font-weight: 700; background: #f8fafc; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; gap: 24px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>${escapeHtml(issuerName)}</h1>
            <p>${escapeHtml(issuerCompany?.address || "")}</p>
            <p>PAN: ${escapeHtml(issuerCompany?.pan || "--")}</p>
            <p>80G Registration No: ${escapeHtml(issuerCompany?.eightyGNo || "--")} | Validity: ${escapeHtml(issuerCompany?.eightyGDate || "--")}</p>
            <p>FCRA Registration No: ${escapeHtml(issuerCompany?.fcraNo || "--")} | Validity: ${escapeHtml(issuerCompany?.fcraDate || "--")}</p>
            <h2>Donation Receipt</h2>
            <table>
              <tbody>
                <tr><td class="label">Receipt Number</td><td>${escapeHtml(donation.receiptNumber)}</td></tr>
                <tr><td class="label">Receipt Date</td><td>${escapeHtml(normalizeDateForReceipt(donation.donationDate))}</td></tr>
                <tr><td class="label">Donor Name</td><td>${escapeHtml(donation.donorName)}</td></tr>
                <tr><td class="label">Donor Type</td><td>${escapeHtml(donation.donorType)}</td></tr>
                <tr><td class="label">Donor ID</td><td>${escapeHtml(donorIdLabel)}</td></tr>
                <tr><td class="label">Amount</td><td>${escapeHtml(formatCurrency(donation.amount))}</td></tr>
                <tr><td class="label">Amt eligible for 80G</td><td>${escapeHtml(formatCurrency(eightyGBreakup.eligibleAmount))}</td></tr>
                <tr><td class="label">Amount not eligible for 80G</td><td>${escapeHtml(formatCurrency(eightyGBreakup.ineligibleAmount))}</td></tr>
                <tr><td class="label">Donation Type</td><td>${escapeHtml(donation.donationType)}</td></tr>
                <tr><td class="label">Project / Purpose</td><td>${escapeHtml(donation.projectName)}</td></tr>
                <tr><td class="label">Fund Type</td><td>${escapeHtml(donation.fundType)}</td></tr>
                <tr><td class="label">Mode of Receipt</td><td>${escapeHtml(donation.modeOfReceipt)}</td></tr>
                <tr><td class="label">Bank Account</td><td>${escapeHtml(donation.bankAccount || "--")}</td></tr>
                <tr><td class="label">Reference / Cheque No</td><td>${escapeHtml(donation.transactionReference || "--")}</td></tr>
                <tr><td class="label">Name of Bank (cheque)</td><td>${escapeHtml(donation.chequeBankName || "--")}</td></tr>
                <tr><td class="label">Location</td><td>${escapeHtml(donation.location)}</td></tr>
              </tbody>
            </table>
            ${chequeNote}
            ${cash80GNote}
            <p>This receipt is issued for donation received in India and subject to applicable provisions of the Income-tax Act, 1961.</p>
            <div class="footer">
              <div>
                <strong>For ${escapeHtml(issuerName)}</strong>
                <p>Authorized Signatory</p>
              </div>
              <div>
                <p>Receipt sent: ${escapeHtml(donation.receiptSent)}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadReceipt = (donation: DonationRecord) => {
    const receiptHtml = renderReceiptHtml(donation);
    const blob = new Blob([receiptHtml], { type: "text/html;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${donation.receiptNumber.replace(/\//g, "-")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Recorded Donations
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
              Review donation records and receipt status
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-end gap-3">
            {companies.length > 1 && (
              <div className="w-full sm:w-72">
                <label className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Issuing Organization
                </label>
                <select
                  value={issuerCompanyId}
                  onChange={(event) => setIssuerCompanyId(event.target.value)}
                  className={inputClass}>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsAddFormOpen(true)}
              className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}>
              + Add Donation
            </button>
          </div>
        </div>
      </div>

      {isAddFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Add Donation
                </h3>
                <p className="text-xs mt-1 text-slate-500 uppercase tracking-widest font-bold">
                  Record donation details for validation and receipt generation
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddDonationForm}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-sm font-bold">
                Close
              </button>
            </div>
        <form onSubmit={handleSaveDonation} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div
              className="lg:col-span-2 relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDonorDropdownOpen(false);
                }
              }}>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Select Donor
              </label>
              <input
                type="text"
                value={donorSearch}
                onFocus={() => setDonorDropdownOpen(true)}
                onChange={(event) => {
                  setDonorSearch(event.target.value);
                  setDonorDropdownOpen(true);
                  if (draft.donorId) {
                    setDraft((prev) => ({ ...prev, donorId: "" }));
                  }
                }}
                placeholder="Search by donor name, email, PAN, passport, Aadhaar, or mobile number"
                className={inputClass}
              />
              {selectedDonor && (
                <div className="mt-2 text-xs font-bold text-slate-500">
                  Selected donor: {selectedDonor.donorName} | {selectedDonor.emailId}
                </div>
              )}
              {donorDropdownOpen && (
              <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl divide-y divide-slate-100 dark:divide-slate-700">
                {donorMatches.length === 0 && (
                  <div className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>No donor found in donor database.</span>
                    <button
                      type="button"
                      onClick={onAddDonor}
                      className={`px-3 py-2 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}>
                      Add New Donor
                    </button>
                  </div>
                )}
                {donorMatches.map((donor) => {
                  const selected = draft.donorId === String(donor.id);
                  return (
                    <button
                      type="button"
                      key={donor.id}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleDonorSelect(donor);
                      }}
                      className={`w-full px-4 py-3 text-left transition ${selected ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {donor.donorName}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {donor.donorType}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {donor.kycDocument || "ID"}:{" "}
                        {maskIdNumber(donor.kycDocument || "", donor.idNumber || "")}
                        {" | Mobile: "}
                        {donor.contactNumber || "--"}
                        {" | Email: "}
                        {donor.emailId || "--"}
                      </div>
                    </button>
                  );
                })}
              </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Date of Donation Receipt
              </label>
              <input
                type="date"
                value={draft.donationDate}
                onChange={(event) => updateDraft("donationDate", event.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Donation Type
              </label>
              <select
                value={draft.donationType}
                onChange={(event) =>
                  updateDraft("donationType", event.target.value as DonationType)
                }
                className={inputClass}
                required>
                {donationTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Fund Type
              </label>
              <select
                value={draft.fundType}
                onChange={(event) => updateDraft("fundType", event.target.value)}
                className={inputClass}
                required>
                <option value="">Select fund type</option>
                {activeFundTypes.map((fundType) => (
                  <option key={String(fundType.id ?? fundType.name)} value={fundType.name}>
                    {fundType.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={
                showDraft80GBreakup ?
                  "lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4"
                : ""
              }>
              <div>
                <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.amount}
                  onChange={(event) => updateDraft("amount", event.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              {showDraft80GBreakup && (
                <>
                  <div>
                    <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                      Amt eligible for 80G
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(draft80GBreakup.eligibleAmount)}
                      readOnly
                      className={`${inputClass} bg-slate-50 dark:bg-slate-950 font-bold`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                      Amount not eligible for 80G
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(draft80GBreakup.ineligibleAmount)}
                      readOnly
                      className={`${inputClass} bg-slate-50 dark:bg-slate-950 font-bold`}
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Project / Purpose of Donation
              </label>
              <select
                value={draft.projectId}
                onChange={(event) => updateDraft("projectId", event.target.value)}
                className={inputClass}
                required>
                <option value="">Select project</option>
                {activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Mode of Receipt
              </label>
              <select
                value={draft.modeOfReceipt}
                onChange={(event) =>
                  updateDraft("modeOfReceipt", event.target.value as DonationReceiptMode)
                }
                className={inputClass}
                required>
                {DONATION_MODE_OF_RECEIPT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {(draft.modeOfReceipt === "Bank Transfer" ||
              draft.modeOfReceipt === "Cheque") && (
              <>
                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Bank Account
                  </label>
                  <select
                    value={draft.bankAccount}
                    onChange={(event) =>
                      updateDraft("bankAccount", event.target.value)
                    }
                    className={inputClass}
                    required>
                    <option value="">Select bank account</option>
                    {bankLedgers.map((ledger) => (
                      <option key={ledger} value={ledger}>
                        {ledger}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Transaction Reference No / Cheque No
                  </label>
                  <input
                    type="text"
                    value={draft.transactionReference}
                    onChange={(event) =>
                      updateDraft("transactionReference", event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>

                {draft.modeOfReceipt === "Cheque" && (
                  <div>
                    <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                      Name of Bank (cheque)
                    </label>
                    <input
                      type="text"
                      value={draft.chequeBankName}
                      onChange={(event) =>
                        updateDraft("chequeBankName", event.target.value)
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Location
              </label>
              <select
                value={draft.location}
                onChange={(event) => updateDraft("location", event.target.value)}
                className={inputClass}
                required>
                <option value="">Select location</option>
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeAddDonationForm}
              className="px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}>
              Save Donation
            </button>
          </div>
        </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Recorded Donations
            </h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Showing {filteredDonations.length} of {(donations || []).length} records
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRecordedDonationFilters({})}
            disabled={!hasRecordedDonationFilters}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Clear Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3">Receipt No</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Amt eligible for 80G</th>
                <th className="px-4 py-3">Amount not eligible for 80G</th>
                <th className="px-4 py-3">Donation Type</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Fund Type</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Bank Account</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Name of Bank (cheque)</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Receipt Sent</th>
                <th className="px-4 py-3 text-right">Receipt</th>
              </tr>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("receiptNumber", "Receipt No", "Receipt / Pending")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("donorName", "Donor", "Donor")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("donationDate", "Date", "Date")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("amount", "Amount", "Amount")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("eightyGEligibleAmount", "Amt eligible for 80G", "Eligible")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("eightyGIneligibleAmount", "Amount not eligible for 80G", "Not eligible")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("donationType", "Donation Type", "Donation type")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("projectName", "Project", "Project")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("fundType", "Fund Type", "Fund type")}
                </th>
                <th className="px-2 py-2">
                  <select
                    aria-label="Filter Mode"
                    value={recordedDonationFilters.modeOfReceipt || ""}
                    onChange={(event) =>
                      updateRecordedDonationFilter("modeOfReceipt", event.target.value)
                    }
                    className={filterInputClass}>
                    <option value="">All modes</option>
                    {DONATION_MODE_OF_RECEIPT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("bankAccount", "Bank Account", "Bank")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("transactionReference", "Reference", "Reference")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("chequeBankName", "Name of Bank (cheque)", "Cheque bank")}
                </th>
                <th className="px-2 py-2">
                  {renderRecordedDonationFilter("location", "Location", "Location")}
                </th>
                <th className="px-2 py-2">
                  <select
                    aria-label="Filter Receipt Sent"
                    value={recordedDonationFilters.receiptSent || ""}
                    onChange={(event) =>
                      updateRecordedDonationFilter("receiptSent", event.target.value)
                    }
                    className={filterInputClass}>
                    <option value="">All sent</option>
                    {RECEIPT_SENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-2 py-2">
                  <select
                    aria-label="Filter Receipt"
                    value={recordedDonationFilters.receiptAction || ""}
                    onChange={(event) =>
                      updateRecordedDonationFilter("receiptAction", event.target.value)
                    }
                    className={filterInputClass}>
                    <option value="">All receipts</option>
                    <option value="generated">Generated</option>
                    <option value="pending">Pending</option>
                  </select>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-sm text-slate-500">
                    {(donations || []).length === 0 ?
                      "No donations recorded."
                    : "No donations match the current filters."}
                  </td>
                </tr>
              )}
              {filteredDonations.map((donation) => {
                const eightyGBreakup = get80GEligibilityBreakup(donation);

                return (
                  <tr
                    key={donation.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      {donation.receiptNumber || "Pending"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.donorName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {normalizeDateForReceipt(donation.donationDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                      {formatCurrency(eightyGBreakup.eligibleAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatCurrency(eightyGBreakup.ineligibleAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.donationType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.projectName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.fundType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.modeOfReceipt}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.bankAccount || "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.transactionReference || "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.chequeBankName || "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {donation.location}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={donation.receiptSent}
                        onChange={(event) =>
                          updateReceiptSent(
                            donation.id,
                            event.target.value as DonationRecord["receiptSent"],
                          )
                        }
                        disabled={!donation.receiptNumber}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                        {RECEIPT_SENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => donation.receiptNumber && setViewingReceipt(donation)}
                          disabled={!donation.receiptNumber}
                          className="px-3 py-1 rounded-md border border-sky-200 dark:border-sky-700 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition">
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => donation.receiptNumber && downloadReceipt(donation)}
                          disabled={!donation.receiptNumber}
                          className="px-3 py-1 rounded-md border border-emerald-200 dark:border-emerald-700 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition">
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Donation Receipt
                </h3>
                <p className="text-xs mt-1 text-slate-500 uppercase tracking-widest font-bold">
                  {viewingReceipt.receiptNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadReceipt(viewingReceipt)}
                  className={`px-3 py-2 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}>
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-600 dark:text-slate-200">
                  Close
                </button>
              </div>
            </div>
            <div
              className="p-6"
              dangerouslySetInnerHTML={{ __html: renderReceiptHtml(viewingReceipt) }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
