import React from "react";
import { Printer, X } from "lucide-react";
import type { RentEntry } from "./rentTypes";

interface ConsultantData {
  id: string;
  vendorName: string;
  location?: string;
  postingFrequency?: string;
  panNo?: string;
  bankDetails?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  agreementSignedBy?: string;
  expenseHead?: string;
  agreementStartDate?: string;
  agreementEndDate?: string;
  autoPosting?: string;
  autoPostingDate?: string;
  attachments?: string;
  budgetCode?: string;
  grossAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  totalAmount?: number;
  tdsRuleName?: string;
  tdsPercent?: number;
}

interface TravelData {
  id: string;
  dateOfEntry?: string;
  travellerType?: string;
  travellerName?: string;
  projectName?: string;
  destinationFrom?: string;
  destinationTo?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  noOfDays?: number;
  perDiemAmount?: number;
  travelAmount?: number;
  lodgingCost?: number;
  localConveyance?: number;
  totalAmount?: number;
  travelMode?: string;
  ticketToBeBooked?: string;
  advanceRequired?: number;
  lodgingToBeBooked?: string;
  finalSettlementDate?: string;
  status?: string;
}

interface RequisitionDetailsDrawerProps {
  reqId: string | null;
  sourceType: "Consultant" | "Rent" | "Travel" | null;
  consultantData?: ConsultantData[];
  rentData?: RentEntry[];
  travelData?: TravelData[];
  onClose: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  const cleaned = String(dateStr).trim();
  if (!cleaned) return "-";

  // If already in dd/mm/yyyy format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) return cleaned;

  // If in yyyy-mm-dd format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const [year, month, day] = cleaned.split("-");
    return `${day}/${month}/${year}`;
  }

  return cleaned;
};

const formatCurrency = (amount?: number) => {
  if (!amount || !Number.isFinite(amount)) return "INR 0";
  return `INR ${Number(amount).toLocaleString()}`;
};

export const RequisitionDetailsDrawer: React.FC<
  RequisitionDetailsDrawerProps
> = ({
  reqId,
  sourceType,
  consultantData = [],
  rentData = [],
  travelData = [],
  onClose,
}) => {
  if (!reqId || !sourceType) return null;

  const handlePrint = () => {
    try {
      if (typeof window !== "undefined") {
        window.print();
      }
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  // Find the matching data based on requisition type and ID
  let detailsContent: React.ReactNode = null;
  let headerTitle = "";
  let headerSubtitle = "";

  if (sourceType === "Consultant") {
    // Extract consultant name from reqId or find matching consultant
    const consultant =
      consultantData.find((c) => {
        // Match by ID or by vendor name in the reqId
        return c.id === reqId || reqId.includes(c.vendorName);
      }) || consultantData[0]; // Fallback to first item for demo

    if (consultant) {
      headerTitle = consultant.vendorName || "Consultant";
      headerSubtitle = "Consultant Requisition";

      detailsContent = (
        <>
          {/* Amount Section */}
          <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Gross Amount
              </label>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatCurrency(consultant.grossAmount)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Total (with GST)
              </label>
              <div className="text-xl font-black text-emerald-600">
                {formatCurrency(consultant.totalAmount)}
              </div>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Vendor Information
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Consultant ID"
                value={consultant.id}
              />
              <DetailRow
                label="Location"
                value={consultant.location}
              />
              <DetailRow
                label="PAN Number"
                value={consultant.panNo}
              />
              <DetailRow
                label="Email"
                value={consultant.email}
              />
              <DetailRow
                label="Contact Number"
                value={consultant.contactNumber}
              />
              <DetailRow
                label="Address"
                value={consultant.address}
              />
            </div>
          </div>

          {/* Agreement Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Agreement Details
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Agreement Signed By"
                value={consultant.agreementSignedBy}
              />
              <DetailRow
                label="Start Date"
                value={formatDate(consultant.agreementStartDate)}
              />
              <DetailRow
                label="End Date"
                value={formatDate(consultant.agreementEndDate)}
              />
              <DetailRow
                label="Posting Frequency"
                value={consultant.postingFrequency}
              />
              <DetailRow
                label="Auto Posting"
                value={consultant.autoPosting === "Y" ? "Yes" : "No"}
              />
              <DetailRow
                label="Auto Posting Date"
                value={formatDate(consultant.autoPostingDate)}
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Financial Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="GST %"
                value={
                  consultant.gstPercent ? `${consultant.gstPercent}%` : "-"
                }
              />
              <DetailRow
                label="GST Amount"
                value={formatCurrency(consultant.gstAmount)}
              />
              <DetailRow
                label="TDS Rule"
                value={consultant.tdsRuleName}
              />
              <DetailRow
                label="TDS %"
                value={
                  consultant.tdsPercent ? `${consultant.tdsPercent}%` : "-"
                }
              />
              <DetailRow
                label="Budget Code"
                value={consultant.budgetCode}
              />
              <DetailRow
                label="Bank Details"
                value={consultant.bankDetails}
              />
            </div>
          </div>
        </>
      );
    }
  } else if (sourceType === "Rent") {
    const rent =
      rentData.find((r) => {
        return r.id === reqId || reqId.includes(r.landlordName);
      }) || rentData[0];

    if (rent) {
      headerTitle = rent.landlordName || "Landlord";
      headerSubtitle = "Rent Requisition";

      detailsContent = (
        <>
          {/* Amount Section */}
          <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Rent Amount
              </label>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatCurrency(rent.rentAmount)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Current Rent
              </label>
              <div className="text-xl font-black text-emerald-600">
                {formatCurrency(rent.currentRent)}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Property Information
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Rent ID"
                value={rent.id}
              />
              <DetailRow
                label="Centre/Location"
                value={rent.centre}
              />
              <DetailRow
                label="Landlord Name"
                value={rent.landlordName}
              />
              <DetailRow
                label="PAN Number"
                value={rent.panNumber}
              />
              <DetailRow
                label="Bank Details"
                value={rent.bankDetails}
              />
            </div>
          </div>

          {/* Agreement Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Rental Agreement
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Agreement Number"
                value={rent.rentalAgreement}
              />
              <DetailRow
                label="Start Date"
                value={formatDate(rent.startDate)}
              />
              <DetailRow
                label="End Date"
                value={formatDate(rent.endDate)}
              />
              <DetailRow
                label="Renewal Alert"
                value={rent.renewalIn2Months}
              />
              <DetailRow
                label="Active for JV"
                value={rent.activeForJV === "Y" ? "Yes" : "No"}
              />
              <DetailRow
                label="Auto Posting Date"
                value={formatDate(rent.autoPostingDate)}
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Financial Details
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Security Deposit"
                value={formatCurrency(rent.securityDeposit)}
              />
              <DetailRow
                label="Deposit Refunded"
                value={rent.securityDepositRefunded === "Y" ? "Yes" : "No"}
              />
              {rent.securityDepositRefunded === "Y" && (
                <>
                  <DetailRow
                    label="Amount Refunded"
                    value={formatCurrency(rent.amountRefunded)}
                  />
                  <DetailRow
                    label="Date of Refund"
                    value={formatDate(rent.dateOfRefund)}
                  />
                </>
              )}
              <DetailRow
                label="TDS %"
                value={rent.tds ? `${rent.tds}%` : "-"}
              />
              <DetailRow
                label="Budget Code"
                value={rent.budgetCode}
              />
            </div>
          </div>

          {/* Increment Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Increment Details
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Increment Type"
                value={rent.incrementType}
              />
              <DetailRow
                label="Increment Value"
                value={rent.incrementValue?.toString()}
              />
              <DetailRow
                label="Increment Period"
                value={rent.incrementPeriod}
              />
            </div>
          </div>

          {/* Remarks */}
          {rent.remarks && (
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Remarks
              </label>
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border-l-4 border-amber-400 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {rent.remarks}
              </div>
            </div>
          )}
        </>
      );
    }
  } else if (sourceType === "Travel") {
    const travel =
      travelData.find((t) => {
        return t.id === reqId;
      }) || travelData[0];

    if (travel) {
      headerTitle = travel.travellerName || "Traveller";
      headerSubtitle = "Travel Requisition";

      const totalAmount =
        travel.totalAmount ||
        Number(travel.travelAmount || 0) +
          Number(travel.perDiemAmount || 0) +
          Number(travel.lodgingCost || 0) +
          Number(travel.localConveyance || 0);

      detailsContent = (
        <>
          {/* Amount Section */}
          <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Total Amount
              </label>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Duration
              </label>
              <div className="text-xl font-black text-emerald-600">
                {travel.noOfDays || 0} Days
              </div>
            </div>
          </div>

          {/* Traveller Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Traveller Information
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Travel ID"
                value={travel.id}
              />
              <DetailRow
                label="Traveller Type"
                value={travel.travellerType}
              />
              <DetailRow
                label="Traveller Name"
                value={travel.travellerName}
              />
              <DetailRow
                label="Project"
                value={travel.projectName}
              />
            </div>
          </div>

          {/* Travel Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Travel Details
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Date of Entry"
                value={formatDate(travel.dateOfEntry)}
              />
              <DetailRow
                label="Destination From"
                value={travel.destinationFrom}
              />
              <DetailRow
                label="Destination To"
                value={travel.destinationTo}
              />
              <DetailRow
                label="Start Date"
                value={formatDate(travel.travelStartDate)}
              />
              <DetailRow
                label="End Date"
                value={formatDate(travel.travelEndDate)}
              />
              <DetailRow
                label="Travel Mode"
                value={travel.travelMode}
              />
              <DetailRow
                label="Ticket to be Booked"
                value={travel.ticketToBeBooked}
              />
              <DetailRow
                label="Lodging to be Booked"
                value={travel.lodgingToBeBooked}
              />
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">
              Financial Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <DetailRow
                label="Ticket Cost"
                value={formatCurrency(travel.travelAmount)}
              />
              <DetailRow
                label="Per Diem Amount"
                value={formatCurrency(travel.perDiemAmount)}
              />
              <DetailRow
                label="Lodging Cost"
                value={formatCurrency(travel.lodgingCost)}
              />
              <DetailRow
                label="Local Conveyance"
                value={formatCurrency(travel.localConveyance)}
              />
              <DetailRow
                label="Advance Given"
                value={formatCurrency(travel.advanceRequired)}
              />
              <DetailRow
                label="Final Settlement Date"
                value={formatDate(travel.finalSettlementDate)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              Status
            </label>
            <div>
              <span
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  travel.status?.toLowerCase() === "approved" ?
                    "bg-emerald-100 text-emerald-700"
                  : travel.status?.toLowerCase() === "rejected" ?
                    "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
                }`}>
                {travel.status || "Pending"}
              </span>
            </div>
          </div>
        </>
      );
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-[999] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-brand-600 px-8 py-8 text-white z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                {headerSubtitle}
              </span>
              <h2 className="text-2xl font-black mt-1 leading-tight">
                {headerTitle}
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {reqId}
                </span>
                <span className="px-3 py-1 bg-indigo-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {sourceType}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/40 flex items-center justify-center transition group">
              <X className="w-5 h-5 group-hover:scale-110 transition" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {detailsContent || (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-semibold">
                No details found for this requisition.
              </p>
              <p className="text-xs mt-2">Req ID: {reqId}</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20 mt-auto sticky bottom-0">
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white/80 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition rounded-2xl text-[10px] font-black uppercase tracking-widest">
              Close Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper component for detail rows
const DetailRow: React.FC<{ label: string; value?: string }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-right max-w-[60%] break-words">
      {value || "-"}
    </span>
  </div>
);
