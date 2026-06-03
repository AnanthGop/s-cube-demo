import React, { useMemo, useState } from "react";
import { CheckCircle2, FileCheck2, FileText, Send } from "lucide-react";
import type { DonorRecord, FundTypeItem } from "./donorRules";
import type { DonationRecord } from "./donationRules";
import {
  generateReceiptForDonation,
  getDonationReceiptBuckets,
  get80GEligibilityBreakup,
  markDonationReceiptPosted,
  markDonationValidated,
  validateDonationForReceipt,
} from "./donationRules";

interface DonationReceiptsPageProps {
  donors: DonorRecord[];
  donations: DonationRecord[];
  fundTypes: FundTypeItem[];
  onUpdate: (donations: DonationRecord[]) => void;
  themeColor?: string;
}

type ReceiptBucketKey =
  | "pendingValidation"
  | "pendingGeneration"
  | "generated"
  | "pendingPosting";

const formatCurrency = (value: string | number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const normalizeDate = (date: string) => {
  if (!date) return "--";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }
  return date;
};

export const DonationReceiptsPage: React.FC<DonationReceiptsPageProps> = ({
  donors,
  donations,
  fundTypes,
  onUpdate,
  themeColor = "brand-600",
}) => {
  const [selectedBucket, setSelectedBucket] =
    useState<ReceiptBucketKey>("pendingValidation");
  const [postingDates, setPostingDates] = useState<Record<number, string>>({});
  const buckets = useMemo(
    () => getDonationReceiptBuckets(donations || [], donors || []),
    [donations, donors],
  );

  const getDonorReceiptMode = (donation: DonationRecord) =>
    donors.find((donor) => donor.id === donation.donorId)?.modeOfReceipt || "--";

  const updateDonation = (nextDonation: DonationRecord) => {
    onUpdate(
      (donations || []).map((donation) =>
        donation.id === nextDonation.id ? nextDonation : donation,
      ),
    );
  };

  const handleValidateDonation = (donation: DonationRecord) => {
    const validation = validateDonationForReceipt(donation, donors || []);
    if (!validation.valid) {
      window.alert(validation.errors.join("\n"));
      return;
    }

    updateDonation(markDonationValidated(donation));
  };

  const handleGenerateReceipt = (donation: DonationRecord) => {
    updateDonation(generateReceiptForDonation(donation, donations || [], fundTypes || []));
  };

  const handlePostingDateChange = (donationId: number, value: string) => {
    setPostingDates((prev) => ({ ...prev, [donationId]: value }));
  };

  const handlePostingToggle = (donation: DonationRecord, checked: boolean) => {
    if (!checked) {
      updateDonation({
        ...donation,
        receiptPosted: "No",
        receiptPostedDate: "",
      });
      return;
    }

    const receiptPostedDate =
      postingDates[donation.id] || donation.receiptPostedDate || "";
    if (!receiptPostedDate) {
      window.alert("Please select the postal posting date before marking posted.");
      return;
    }

    updateDonation(markDonationReceiptPosted(donation, receiptPostedDate));
  };

  const summaryCards = [
    {
      key: "pendingValidation" as const,
      title: "Donations Pending To Be Validated",
      subtitle: "Review saved donation details",
      label: "Pending validation",
      value: buckets.pendingValidation.length,
      icon: <FileCheck2 size={20} />,
      iconClassName: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    {
      key: "pendingGeneration" as const,
      title: "Receipts Pending To Be Generated",
      subtitle: "Generate receipt numbers",
      label: "Pending generation",
      value: buckets.pendingGeneration.length,
      icon: <FileText size={20} />,
      iconClassName: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    },
    {
      key: "generated" as const,
      title: "Receipts Generated",
      subtitle: "All donations with receipt numbers",
      label: "Generated receipts",
      value: buckets.generated.length,
      icon: <CheckCircle2 size={20} />,
      iconClassName:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    {
      key: "pendingPosting" as const,
      title: "Receipts Pending To Be Posted",
      subtitle: "Postal receipt dispatch",
      label: "Pending postal dispatch",
      value: buckets.pendingPosting.length,
      icon: <Send size={20} />,
      iconClassName: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    },
  ];

  const renderEmptyRow = (message: string, colSpan: number) => (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-500">
        {message}
      </td>
    </tr>
  );

  const renderCommonCells = (donation: DonationRecord) => {
    const eightyGBreakup = get80GEligibilityBreakup(donation);

    return (
      <>
        <td className="px-4 py-3 text-sm font-extrabold text-slate-800 dark:text-slate-100">
          {donation.donorName}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          {normalizeDate(donation.donationDate)}
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
      </>
    );
  };

  const renderSummaryCard = (card: (typeof summaryCards)[number]) => {
    const isSelected = selectedBucket === card.key;
    return (
      <button
        key={card.key}
        type="button"
        onClick={() => setSelectedBucket(card.key)}
        className={`w-full rounded-lg border bg-white dark:bg-slate-800 p-6 text-left shadow-xl transition hover:border-brand-300 hover:shadow-2xl ${
          isSelected ?
            "border-brand-400 ring-2 ring-brand-500/20"
          : "border-slate-200 dark:border-slate-700"
        }`}>
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${card.iconClassName}`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {card.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {card.subtitle}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
            {card.label}
          </div>
          <div className="mt-2 h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 flex items-center text-base font-extrabold text-slate-900 dark:text-white">
            {card.value}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Donation Receipts
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
            Validate donations, generate receipts, and track postal dispatch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {summaryCards.map(renderSummaryCard)}
      </div>

      {selectedBucket === "pendingValidation" && (
      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Donations Pending To Be Validated
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review saved donation details
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Amt eligible for 80G</th>
                <th className="px-4 py-3">Amount not eligible for 80G</th>
                <th className="px-4 py-3">Donation Type</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Fund Type</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {buckets.pendingValidation.length === 0 &&
                renderEmptyRow("No donations pending validation.", 9)}
              {buckets.pendingValidation.map((donation) => (
                <tr key={donation.id}>
                  {renderCommonCells(donation)}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleValidateDonation(donation)}
                      className={`px-3 py-2 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}>
                      Validate Donation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {selectedBucket === "pendingGeneration" && (
      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Receipts Pending To Be Generated
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate receipt numbers
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Amt eligible for 80G</th>
                <th className="px-4 py-3">Amount not eligible for 80G</th>
                <th className="px-4 py-3">Donation Type</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Fund Type</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {buckets.pendingGeneration.length === 0 &&
                renderEmptyRow("No receipts pending generation.", 9)}
              {buckets.pendingGeneration.map((donation) => (
                <tr key={donation.id}>
                  {renderCommonCells(donation)}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleGenerateReceipt(donation)}
                      className={`px-3 py-2 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}>
                      Generate Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {selectedBucket === "generated" && (
      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Receipts Generated
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All donations with receipt numbers
          </p>
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
                <th className="px-4 py-3">Receipt Preference</th>
                <th className="px-4 py-3">Posted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {buckets.generated.length === 0 &&
                renderEmptyRow("No receipts have been generated.", 11)}
              {buckets.generated.map((donation) => (
                <tr key={donation.id}>
                  <td className="px-4 py-3 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {donation.receiptNumber}
                  </td>
                  {renderCommonCells(donation)}
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {getDonorReceiptMode(donation)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {normalizeDate(donation.receiptPostedDate || "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {selectedBucket === "pendingPosting" && (
      <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Receipts Pending To Be Posted
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Postal receipt dispatch
          </p>
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
                <th className="px-4 py-3">Posted Date</th>
                <th className="px-4 py-3 text-right">Posted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {buckets.pendingPosting.length === 0 &&
                renderEmptyRow("No postal receipts pending dispatch.", 11)}
              {buckets.pendingPosting.map((donation) => (
                <tr key={donation.id}>
                  <td className="px-4 py-3 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {donation.receiptNumber}
                  </td>
                  {renderCommonCells(donation)}
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={
                        postingDates[donation.id] ||
                        donation.receiptPostedDate ||
                        ""
                      }
                      onChange={(event) =>
                        handlePostingDateChange(donation.id, event.target.value)
                      }
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={donation.receiptPosted === "Yes"}
                      onChange={(event) =>
                        handlePostingToggle(donation, event.target.checked)
                      }
                      className="h-4 w-4 accent-brand-600"
                      aria-label={`Mark ${donation.receiptNumber} as posted`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  );
};
