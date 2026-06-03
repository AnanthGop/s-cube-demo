import React, { useMemo, useState } from "react";
import { ArrowLeft, Download, FileCheck2, FileSpreadsheet, RefreshCw, Upload } from "lucide-react";
import type { DonationRecord } from "./donationRules";
import type { DonorRecord } from "./donorRules";
import {
  FORM_10BD_EXCLUSION_REASON_LABELS,
  buildForm10BDCsv,
  buildForm10BDReconciliation,
  buildForm10BDRows,
  createForm10BDFilingRecord,
  getForm10BDEligibility,
  getForm10BEDonationMatches,
  getForm10BEFileWithDonation,
  markForm10BDFilingUploaded,
  type Company80GRecord,
  type Form10BDFilingRecord,
  type Form10BEFileRecord,
  type FormAttachmentRecord,
} from "./form10bdRules";

interface Form10BD10BEPageProps {
  donors: DonorRecord[];
  donations: DonationRecord[];
  companies: Company80GRecord[];
  form10BDFilings: Form10BDFilingRecord[];
  form10BEFiles: Form10BEFileRecord[];
  onUpdateForm10BDFilings: (filings: Form10BDFilingRecord[]) => void;
  onUpdateForm10BEFiles: (files: Form10BEFileRecord[]) => void;
  themeColor?: string;
}

type ActiveView = "landing" | "10bd" | "10be" | "reconciliation";
type UploadDraft = { uploadDate: string; acknowledgementNumber: string; file: File | null };
type Form10BEDraft = {
  donorPan: string;
  donationDate: string;
  donationAmount: string;
  certificateNumber: string;
  certificateDate: string;
  file: File | null;
};

const API_BASE_URL = "http://localhost:3001/api";
const todayIsoDate = () => new Date().toISOString().slice(0, 10);
const getFyRange = () => {
  const today = new Date();
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return { from: `${startYear}-04-01`, to: `${startYear + 1}-03-31` };
};
const formatCurrency = (value: string | number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
const formatDate = (value: string) => {
  if (!value) return "--";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
};
const amount = (value: string | number) => {
  const parsed = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const attachmentHref = (attachment?: FormAttachmentRecord) => {
  if (!attachment?.url) return "";
  return attachment.url.startsWith("/api/") ?
      `${API_BASE_URL.replace(/\/api$/, "")}${attachment.url}`
    : attachment.url;
};
const uploadAttachment = async (file: File): Promise<FormAttachmentRecord> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/attachments`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Attachment upload failed.");
  return response.json();
};
const downloadTextFile = (fileName: string, contents: string) => {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const inputClass =
  "w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm";
const thClass = "px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500";
const tdClass = "px-4 py-3 text-sm text-slate-600 dark:text-slate-300";

export const Form10BD10BEPage: React.FC<Form10BD10BEPageProps> = ({
  donors,
  donations,
  companies,
  form10BDFilings,
  form10BEFiles,
  onUpdateForm10BDFilings,
  onUpdateForm10BEFiles,
  themeColor = "brand-600",
}) => {
  const fyRange = useMemo(getFyRange, []);
  const [activeView, setActiveView] = useState<ActiveView>("landing");
  const [companyId, setCompanyId] = useState(String(companies[0]?.id || ""));
  const [form10BDFrom, setForm10BDFrom] = useState(fyRange.from);
  const [form10BDTo, setForm10BDTo] = useState(fyRange.to);
  const [reconFrom, setReconFrom] = useState(fyRange.from);
  const [reconTo, setReconTo] = useState(fyRange.to);
  const [uploadDrafts, setUploadDrafts] = useState<Record<number, UploadDraft>>({});
  const [uploadingFilingId, setUploadingFilingId] = useState<number | null>(null);
  const [uploading10BE, setUploading10BE] = useState(false);
  const [drilldownKey, setDrilldownKey] = useState("declared");
  const [form10BEDraft, setForm10BEDraft] = useState<Form10BEDraft>({
    donorPan: "",
    donationDate: "",
    donationAmount: "",
    certificateNumber: "",
    certificateDate: "",
    file: null,
  });

  const selectedCompany = useMemo(
    () => companies.find((company) => String(company.id) === companyId) || companies[0],
    [companies, companyId],
  );
  const donorById = useMemo(
    () => new Map((donors || []).map((donor) => [donor.id, donor])),
    [donors],
  );
  const eligibility = useMemo(
    () =>
      getForm10BDEligibility({
        donations: donations || [],
        donors: donors || [],
        filings: form10BDFilings || [],
        dateFrom: form10BDFrom,
        dateTo: form10BDTo,
      }),
    [donations, donors, form10BDFilings, form10BDFrom, form10BDTo],
  );
  const reconciliation = useMemo(
    () =>
      buildForm10BDReconciliation({
        donations: donations || [],
        donors: donors || [],
        filings: form10BDFilings || [],
        dateFrom: reconFrom,
        dateTo: reconTo,
      }),
    [donations, donors, form10BDFilings, reconFrom, reconTo],
  );

  const draftFor = (filingId: number): UploadDraft =>
    uploadDrafts[filingId] || {
      uploadDate: todayIsoDate(),
      acknowledgementNumber: "",
      file: null,
    };
  const updateDraft = (filingId: number, field: keyof UploadDraft, value: string | File | null) =>
    setUploadDrafts((prev) => ({
      ...prev,
      [filingId]: { ...draftFor(filingId), [field]: value },
    }));

  const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">{subtitle}</p>
        </div>
        {activeView !== "landing" && (
          <button
            type="button"
            onClick={() => setActiveView("landing")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <ArrowLeft size={14} />
            Back
          </button>
        )}
      </div>
    </div>
  );

  const DonationRows = ({ rows }: { rows: DonationRecord[] }) => (
    <>
      {rows.map((donation) => {
        const donor = donorById.get(donation.donorId);
        return (
          <tr key={donation.id}>
            <td className={`${tdClass} font-extrabold text-slate-800 dark:text-slate-100`}>{donation.donorName}</td>
            <td className={tdClass}>{formatDate(donation.donationDate)}</td>
            <td className={`${tdClass} font-bold`}>{formatCurrency(donation.amount)}</td>
            <td className={tdClass}>{donation.modeOfReceipt}</td>
            <td className={tdClass}>{donation.donationType}</td>
            <td className={tdClass}>{donor?.idNumber || "--"}</td>
          </tr>
        );
      })}
    </>
  );

  const handleGenerate10BD = () => {
    if (!selectedCompany) {
      window.alert("Please select a company before generating Form 10BD.");
      return;
    }
    if (!selectedCompany.eightyGNo) {
      window.alert("The selected company does not have an 80G approval number.");
      return;
    }

    const eligibleDonations = eligibility.eligible.map((item) => item.donation);
    if (eligibleDonations.length === 0) {
      window.alert("No eligible donations are available for the selected range.");
      return;
    }

    const filing = createForm10BDFilingRecord({
      id: Date.now(),
      company: selectedCompany,
      dateFrom: form10BDFrom,
      dateTo: form10BDTo,
      donationIds: eligibleDonations.map((donation) => donation.id),
      totalAmount: eligibleDonations.reduce((sum, donation) => sum + amount(donation.amount), 0),
      generatedAt: new Date().toISOString(),
    });
    const rows = buildForm10BDRows({
      donations: eligibleDonations,
      donors: donors || [],
      company: selectedCompany,
    });

    onUpdateForm10BDFilings([...(form10BDFilings || []), filing]);
    downloadTextFile(filing.csvFileName || `form-10bd-${filing.id}.csv`, buildForm10BDCsv(rows));
  };

  const handleMark10BDUploaded = async (filing: Form10BDFilingRecord) => {
    const draft = draftFor(filing.id);
    if (!draft.uploadDate || !draft.file) {
      window.alert("Please select the upload date and attach the Form 10BD upload evidence.");
      return;
    }

    try {
      setUploadingFilingId(filing.id);
      const attachment = await uploadAttachment(draft.file);
      const uploaded = markForm10BDFilingUploaded(filing, {
        uploadDate: draft.uploadDate,
        acknowledgementNumber: draft.acknowledgementNumber,
        attachment,
      });
      onUpdateForm10BDFilings(
        (form10BDFilings || []).map((item) => (item.id === filing.id ? uploaded : item)),
      );
      setUploadDrafts((prev) => {
        const next = { ...prev };
        delete next[filing.id];
        return next;
      });
    } catch {
      window.alert("Could not upload the attachment. Please ensure the backend is running.");
    } finally {
      setUploadingFilingId(null);
    }
  };

  const renderDonationTable = (title: string, subtitle: string, rows: DonationRecord[]) => (
    <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
              <th className={thClass}>Donor</th>
              <th className={thClass}>Date</th>
              <th className={thClass}>Amount</th>
              <th className={thClass}>Mode</th>
              <th className={thClass}>Donation Type</th>
              <th className={thClass}>PAN / ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No donations in this view.
                </td>
              </tr>
            ) : (
              <DonationRows rows={rows} />
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const render10BD = () => {
    const eligibleDonations = eligibility.eligible.map((item) => item.donation);
    const eligibleAmount = eligibleDonations.reduce((sum, donation) => sum + amount(donation.amount), 0);

    return (
      <div className="space-y-6">
        <Header title="Generate Form 10BD" subtitle="Create portal upload CSV and capture each upload" />

        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Company</label>
              <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className={inputClass}>
                {(companies || []).map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">From Date</label>
              <input type="date" value={form10BDFrom} onChange={(event) => setForm10BDFrom(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">To Date</label>
              <input type="date" value={form10BDTo} onChange={(event) => setForm10BDTo(event.target.value)} className={inputClass} />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGenerate10BD}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}>
                <Download size={16} />
                Generate CSV
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Eligible donations</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{eligibleDonations.length}</div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Eligible amount</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(eligibleAmount)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">80G approval number</div>
              <div className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">{selectedCompany?.eightyGNo || "Not set"}</div>
            </div>
          </div>
        </section>

        {renderDonationTable("Eligible for Form 10BD", "Only PAN donors, non-anonymous donations, and cash donations up to Rs. 2,000.", eligibleDonations)}

        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Excluded from Form 10BD</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Excluded donations remain available in reconciliation.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                  <th className={thClass}>Donor</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Mode</th>
                  <th className={thClass}>Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {eligibility.excluded.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No excluded donations for this range.</td>
                  </tr>
                ) : (
                  eligibility.excluded.map((item) => (
                    <tr key={item.donation.id}>
                      <td className={`${tdClass} font-extrabold text-slate-800 dark:text-slate-100`}>{item.donation.donorName}</td>
                      <td className={tdClass}>{formatDate(item.donation.donationDate)}</td>
                      <td className={`${tdClass} font-bold`}>{formatCurrency(item.donation.amount)}</td>
                      <td className={tdClass}>{item.donation.modeOfReceipt}</td>
                      <td className={tdClass}>{item.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Form 10BD Upload Tracking Schedule</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Declared status starts only after upload date and attachment are recorded.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                  <th className={thClass}>Generated</th>
                  <th className={thClass}>Range</th>
                  <th className={thClass}>Donations</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Upload Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {(form10BDFilings || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No Form 10BD filing has been tracked yet.</td>
                  </tr>
                ) : (
                  (form10BDFilings || []).map((filing) => {
                    const draft = draftFor(filing.id);
                    return (
                      <tr key={filing.id}>
                        <td className={tdClass}>{formatDate(filing.generatedAt.slice(0, 10))}</td>
                        <td className={tdClass}>{formatDate(filing.dateFrom)} to {formatDate(filing.dateTo)}</td>
                        <td className={tdClass}>{filing.donationIds.length}</td>
                        <td className={`${tdClass} font-bold`}>{formatCurrency(filing.totalAmount)}</td>
                        <td className={tdClass}>{filing.status}</td>
                        <td className="px-4 py-3">
                          {filing.status === "Uploaded" ? (
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              <div>{formatDate(filing.uploadDate || "")}</div>
                              {filing.attachment && (
                                <a href={attachmentHref(filing.attachment)} target="_blank" rel="noreferrer" className="font-bold text-brand-600 hover:underline">
                                  {filing.attachment.fileName}
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <input type="date" value={draft.uploadDate} onChange={(event) => updateDraft(filing.id, "uploadDate", event.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                              <input type="text" value={draft.acknowledgementNumber} onChange={(event) => updateDraft(filing.id, "acknowledgementNumber", event.target.value)} placeholder="Acknowledgement no." className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                              <input type="file" onChange={(event) => updateDraft(filing.id, "file", event.target.files?.[0] || null)} className="text-xs" />
                              <button
                                type="button"
                                onClick={() => handleMark10BDUploaded(filing)}
                                disabled={uploadingFilingId === filing.id}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 disabled:opacity-50 transition`}>
                                <Upload size={14} />
                                {uploadingFilingId === filing.id ? "Uploading" : "Mark Uploaded"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const handleStore10BEFile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form10BEDraft.file) {
      window.alert("Please select the Form 10BE file from the portal or utility.");
      return;
    }

    const candidate: Form10BEFileRecord = {
      id: Date.now(),
      donorPan: form10BEDraft.donorPan,
      donationAmount: form10BEDraft.donationAmount,
      donationDate: form10BEDraft.donationDate,
      certificateNumber: form10BEDraft.certificateNumber,
      certificateDate: form10BEDraft.certificateDate,
      fileName: form10BEDraft.file.name,
    };
    const matches = getForm10BEDonationMatches({
      form10BEFiles: [candidate],
      donations: donations || [],
      donors: donors || [],
      filings: form10BDFilings || [],
    });
    const matchedDonation = matches.matched[0]?.donation;
    if (!matchedDonation) {
      window.alert("This Form 10BE file does not match a donation declared in uploaded Form 10BD.");
      return;
    }

    try {
      setUploading10BE(true);
      const attachment = await uploadAttachment(form10BEDraft.file);
      const storedFile = getForm10BEFileWithDonation(
        { ...candidate, ...attachment, certificateNumber: form10BEDraft.certificateNumber, certificateDate: form10BEDraft.certificateDate },
        matchedDonation.id,
      );
      onUpdateForm10BEFiles([...(form10BEFiles || []), storedFile]);
      setForm10BEDraft({ donorPan: "", donationDate: "", donationAmount: "", certificateNumber: "", certificateDate: "", file: null });
    } catch {
      window.alert("Could not store the Form 10BE file. Please ensure the backend is running.");
    } finally {
      setUploading10BE(false);
    }
  };

  const render10BE = () => (
    <div className="space-y-6">
      <Header title="Generate Form 10BE" subtitle="Store portal and utility files against declared Form 10BD donations" />
      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl p-6">
        <form onSubmit={handleStore10BEFile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Donor PAN</label>
              <input required value={form10BEDraft.donorPan} onChange={(event) => setForm10BEDraft((prev) => ({ ...prev, donorPan: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Donation Date</label>
              <input required type="date" value={form10BEDraft.donationDate} onChange={(event) => setForm10BEDraft((prev) => ({ ...prev, donationDate: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Donation Amount</label>
              <input required type="number" min="0" step="0.01" value={form10BEDraft.donationAmount} onChange={(event) => setForm10BEDraft((prev) => ({ ...prev, donationAmount: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Certificate Number</label>
              <input value={form10BEDraft.certificateNumber} onChange={(event) => setForm10BEDraft((prev) => ({ ...prev, certificateNumber: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Certificate Date</label>
              <input type="date" value={form10BEDraft.certificateDate} onChange={(event) => setForm10BEDraft((prev) => ({ ...prev, certificateDate: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Portal / Utility File</label>
              <input required type="file" onChange={(event) => setForm10BEDraft((prev) => ({ ...prev, file: event.target.files?.[0] || null }))} className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={uploading10BE} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 disabled:opacity-50 transition`}>
              <Upload size={16} />
              {uploading10BE ? "Storing" : "Store Form 10BE File"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Stored Form 10BE Files</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Each file is linked to a donation already declared in uploaded Form 10BD.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                <th className={thClass}>File</th>
                <th className={thClass}>Donor PAN</th>
                <th className={thClass}>Donation Date</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Certificate No.</th>
                <th className={thClass}>Donation ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {(form10BEFiles || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No Form 10BE files have been stored yet.</td>
                </tr>
              ) : (
                (form10BEFiles || []).map((file) => (
                  <tr key={file.id}>
                    <td className={`${tdClass} font-bold`}>
                      <a href={attachmentHref(file)} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                        {file.fileName}
                      </a>
                    </td>
                    <td className={tdClass}>{file.donorPan}</td>
                    <td className={tdClass}>{formatDate(file.donationDate)}</td>
                    <td className={`${tdClass} font-bold`}>{formatCurrency(file.donationAmount)}</td>
                    <td className={tdClass}>{file.certificateNumber || "--"}</td>
                    <td className={tdClass}>{file.donationId || "--"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const selectedRows =
    drilldownKey === "declared" ?
      reconciliation.declaredDonations
    : reconciliation.notDeclaredGroups.find((group) => group.reasonCode === drilldownKey)?.donations || [];
  const selectedTitle =
    drilldownKey === "declared" ?
      "Donations as per Form 10BD"
    : FORM_10BD_EXCLUSION_REASON_LABELS[
        drilldownKey as keyof typeof FORM_10BD_EXCLUSION_REASON_LABELS
      ] || "Donation details";

  const renderReconciliation = () => (
    <div className="space-y-6">
      <Header title="Donations reconciliation with Form 10BD" subtitle="Match Form 10BD declarations with financial year donations" />
      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">From Date</label>
            <input type="date" value={reconFrom} onChange={(event) => setReconFrom(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">To Date</label>
            <input type="date" value={reconTo} onChange={(event) => setReconTo(event.target.value)} className={inputClass} />
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Total donations</div>
            <div className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(reconciliation.totalAmount)}</div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setDrilldownKey("declared")}
          className={`w-full px-6 py-4 flex items-center justify-between text-left border-b border-slate-200 dark:border-slate-700 ${drilldownKey === "declared" ? "bg-brand-50 dark:bg-brand-900/20" : ""}`}>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Donations as per Form 10BD</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCurrency(reconciliation.declaredAmount)}</span>
        </button>

        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">Donations not declared in Form 10BD</div>
          <div className="mt-3 space-y-2">
            {reconciliation.notDeclaredGroups.length === 0 ? (
              <div className="text-sm text-slate-500">No not-declared donations in this period.</div>
            ) : (
              reconciliation.notDeclaredGroups.map((group) => (
                <button
                  key={group.reasonCode}
                  type="button"
                  onClick={() => setDrilldownKey(group.reasonCode)}
                  className={`w-full rounded-lg border px-4 py-3 flex items-center justify-between text-left transition ${
                    drilldownKey === group.reasonCode ?
                      "border-brand-300 bg-brand-50 dark:bg-brand-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  }`}>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{group.reason}</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCurrency(group.amount)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <span className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Total donations</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(reconciliation.totalAmount)}</span>
        </div>
      </section>

      {renderDonationTable(selectedTitle, "Drilldown for the selected reconciliation line.", selectedRows)}
    </div>
  );

  if (activeView === "10bd") return render10BD();
  if (activeView === "10be") return render10BE();
  if (activeView === "reconciliation") return renderReconciliation();

  const cards = [
    {
      view: "10bd" as const,
      title: "Generate Form 10BD",
      text: "Prepare the portal upload file and record each upload.",
      icon: FileSpreadsheet,
      tone: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
    },
    {
      view: "10be" as const,
      title: "Generate Form 10BE",
      text: "Store portal and utility files against declared donations.",
      icon: FileCheck2,
      tone: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-900/30",
    },
    {
      view: "reconciliation" as const,
      title: "Donations reconciliation with Form 10BD",
      text: "Reconcile declared and not-declared donation totals.",
      icon: RefreshCw,
      tone: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <Header title="Form 10BD & Form 10BE" subtitle="Prepare 80G reporting, store portal evidence, and reconcile declarations" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={() => setActiveView(card.view)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-left shadow-xl transition hover:border-brand-300 hover:shadow-2xl">
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${card.tone}`}>
                <Icon size={22} />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{card.text}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
