import React, { useState } from "react";
import { Printer, X } from "lucide-react";
import { CompactDatePicker } from "../shared/CompactDatePicker";

interface FundType {
  id: number;
  name: string;
  code: string;
  status: string;
}

interface Location {
  id: number;
  region: string;
  state: string;
  city: string;
  address: string;
  name: string;
  status: string;
  creator: string;
  date: string;
}

interface ChartOfAccountsGroup {
  name: string;
  ledgers: string[];
}

interface ChartOfAccounts {
  master: string;
  groups: ChartOfAccountsGroup[];
}

interface PartyLedgerMapping {
  id: number;
  partyAccount: string;
  ledgerAccount: string;
  master: string;
  group: string;
}

interface CreateVoucherProps {
  type: "Expense" | "Bank";
  themeColor: string;
  fundTypes?: FundType[];
  chartOfAccounts?: ChartOfAccounts[];
  locationsList?: Location[];
  mappingData?: PartyLedgerMapping[];
  data?: VoucherEntry[];
  onUpdate?: (data: VoucherEntry[]) => void | Promise<void>;
}

interface VoucherEntry {
  id: string;
  voucherDate: string;
  location: string;
  partyName: string;
  fundType: string;
  expenseType: string;
  ledgerAccount: string;
  invoiceNo: string;
  invoiceDate: string;
  amountBeforeGST: number;
  gstAmount: number;
  totalInvoiceAmount: number;
  tdsAmount: number;
  netAmountPayable: number;
  narration: string;
}

export const CreateVoucher: React.FC<CreateVoucherProps> = ({
  type,
  themeColor,
  fundTypes = [],
  chartOfAccounts = [],
  locationsList = [],
  mappingData = [],
  data = [],
  onUpdate,
}) => {
  // Get active fund types
  const activeFundTypes = fundTypes.filter((f) => f.status === "Active");

  // Get active locations
  const activeLocations = locationsList.filter((l) => l.status === "Active");

  // Get expense ledgers from chart of accounts
  const expenseLedgers =
    chartOfAccounts
      .find((coa) => coa.master === "Expenditure")
      ?.groups.flatMap((group) =>
        group.ledgers.map((l) => (typeof l === "string" ? l : l.name)),
      ) || [];

  // Get sundry creditors from chart of accounts (party names)
  const sundryCreditors =
    chartOfAccounts
      .find((coa) => coa.master === "Liabilities")
      ?.groups.find((group) => group.name === "Sundry Creditors")
      ?.ledgers.map((l) => (typeof l === "string" ? l : l.name)) || [];

  // Expense type options
  const expenseTypeOptions = ["Fixed Asset Purchase", "Expenses"];

  // Date conversion utilities
  const convertToInputFormat = (date: string): string => {
    // Convert DD/MM/YYYY to YYYY-MM-DD for input fields
    if (!date) return "";
    const parts = date.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return date;
  };

  const convertToDisplayFormat = (date: string): string => {
    // Convert YYYY-MM-DD to DD/MM/YYYY for storage
    if (!date) return "";
    const parts = date.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return date;
  };

  const vouchers = data;

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<VoucherEntry | null>(
    null,
  );
  const [formData, setFormData] = useState<VoucherEntry>({
    id: "",
    voucherDate: "",
    location: "",
    partyName: "",
    fundType: "",
    expenseType: "",
    ledgerAccount: "",
    invoiceNo: "",
    invoiceDate: "",
    amountBeforeGST: 0,
    gstAmount: 0,
    totalInvoiceAmount: 0,
    tdsAmount: 0,
    netAmountPayable: 0,
    narration: "",
  });

  const handleAddNew = () => {
    setViewMode("form");
    setEditingId(null);
    // Generate proper voucher number based on type
    const prefix = type === "Expense" ? "EV" : "BV";
    const maxId = vouchers.reduce((max, v) => {
      const num = parseInt(v.id.replace(/\D/g, ""), 10);
      return num > max ? num : max;
    }, 0);
    setFormData({
      id: `${prefix}-${String(maxId + 1).padStart(3, "0")}`,
      voucherDate: "",
      location: "",
      partyName: "",
      fundType: "",
      expenseType: "",
      ledgerAccount: "",
      invoiceNo: "",
      invoiceDate: "",
      amountBeforeGST: 0,
      gstAmount: 0,
      totalInvoiceAmount: 0,
      tdsAmount: 0,
      netAmountPayable: 0,
      narration: "",
    });
  };

  const handleEdit = (voucher: VoucherEntry) => {
    setViewMode("form");
    setEditingId(voucher.id);
    // Convert dates to input format when editing
    setFormData({
      ...voucher,
      voucherDate: convertToInputFormat(voucher.voucherDate),
      invoiceDate: convertToInputFormat(voucher.invoiceDate),
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this voucher?")) {
      const updated = vouchers.filter((v) => v.id !== id);
      if (onUpdate) {
        await onUpdate(updated);
      }
    }
  };

  const handleSave = async () => {
    // Convert dates back to display format before saving
    const dataToSave = {
      ...formData,
      voucherDate: convertToDisplayFormat(formData.voucherDate),
      invoiceDate: convertToDisplayFormat(formData.invoiceDate),
    };

    let updated: VoucherEntry[];
    if (editingId) {
      updated = vouchers.map((v) => (v.id === editingId ? dataToSave : v));
    } else {
      updated = [...vouchers, dataToSave];
    }

    if (onUpdate) {
      await onUpdate(updated);
    }
    setViewMode("list");
    setEditingId(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setEditingId(null);
  };

  // Helper function to get filtered ledger accounts for the selected party
  const getFilteredLedgerAccounts = (): string[] => {
    // If no party is selected, show all expense ledgers
    if (!formData.partyName || mappingData.length === 0) {
      return expenseLedgers;
    }

    // Get all mapped ledger accounts for the selected party
    const mappedLedgers = mappingData
      .filter((m) => m.partyAccount === formData.partyName)
      .map((m) => m.ledgerAccount);

    // If mappings exist for this party, show only those ledgers
    // Otherwise, show all expense ledgers
    return mappedLedgers.length > 0 ? mappedLedgers : expenseLedgers;
  };

  const updateFormField = (
    field: keyof VoucherEntry,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Clear ledger account when party changes (user must manually select)
      if (field === "partyName" && typeof value === "string") {
        updated.ledgerAccount = "";
      }

      // Auto-calculate total invoice amount
      if (field === "amountBeforeGST" || field === "gstAmount") {
        updated.totalInvoiceAmount =
          Number(updated.amountBeforeGST) + Number(updated.gstAmount);
      }

      // Auto-calculate net amount payable
      if (
        field === "totalInvoiceAmount" ||
        field === "tdsAmount" ||
        field === "amountBeforeGST" ||
        field === "gstAmount"
      ) {
        updated.netAmountPayable =
          Number(updated.totalInvoiceAmount) - Number(updated.tdsAmount);
      }

      return updated;
    });
  };

  const handleExport = () => {
    alert("Exporting voucher details to Excel...");
  };

  const handlePrint = () => {
    try {
      if (typeof window !== "undefined") {
        window.print();
      }
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  // Voucher Details Drawer Component
  const VoucherDetailsDrawer = () => {
    if (!viewingVoucher) return null;

    return (
      <>
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] animate-in fade-in duration-300"
          onClick={() => setViewingVoucher(null)}
        />

        <div className="fixed top-0 right-0 h-full w-[520px] bg-white dark:bg-slate-900 shadow-2xl z-[999] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="bg-purple-600 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/80">
                  {type === "Expense" ? "EXPENSE VOUCHER" : "BANK VOUCHER"}
                </h3>
                <h2 className="text-2xl font-black text-white mt-1">
                  {viewingVoucher.id}
                </h2>
              </div>
              <button
                onClick={() => setViewingVoucher(null)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition">
                Close
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Main Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Party Name:
                </label>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {viewingVoucher.partyName || "N/A"}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Month:
                </label>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {viewingVoucher.voucherDate}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Amount:
                </label>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  INR {viewingVoucher.totalInvoiceAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Net Payable:
                </label>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  INR {viewingVoucher.netAmountPayable.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Journal Entries Table */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                JOURNAL
              </label>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Ledger
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Journal Type
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Debit Amount
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Credit Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {/* Debit Entry - Expense Ledger */}
                    <tr className="bg-white dark:bg-slate-900">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {viewingVoucher.ledgerAccount}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        Debit
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">
                        INR {viewingVoucher.totalInvoiceAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        -
                      </td>
                    </tr>
                    {/* Credit Entry - Party Account or Bank */}
                    <tr className="bg-white dark:bg-slate-900">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {viewingVoucher.partyName || "Bank"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        Credit
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        -
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">
                        INR {viewingVoucher.netAmountPayable.toLocaleString()}
                      </td>
                    </tr>
                    {/* TDS Account Entry if TDS exists */}
                    {viewingVoucher.tdsAmount > 0 && (
                      <tr className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                          TDS Account (194I)
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          Credit
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500">
                          -
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">
                          INR {viewingVoucher.tdsAmount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Narration */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                NARRATION
              </label>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewingVoucher.narration || "No narration provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-white border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              <span>PRINT</span>
            </button>
            <button
              onClick={() => setViewingVoucher(null)}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition">
              CLOSE
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Voucher Details Drawer */}
      <VoucherDetailsDrawer />

      {
        viewMode === "form" ?
          // Form View - Full Screen
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div
              className={`bg-${themeColor} px-10 py-6 flex items-center justify-between text-white`}>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {editingId ? "Edit" : "Create"} {type} Voucher
                </h2>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                  {editingId ?
                    "Update voucher details"
                  : "Enter voucher information"}
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                ← Back to List
              </button>
            </div>

            <div className="p-10">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Form fields will be here */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Voucher Date
                    </label>
                    <CompactDatePicker
                      value={formData.voucherDate}
                      onChange={(value) =>
                        updateFormField("voucherDate", value)
                      }
                      className="border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Location
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) =>
                        updateFormField("location", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none">
                      <option value="">Select Location</option>
                      {activeLocations.map((location) => (
                        <option
                          key={location.id}
                          value={location.name}>
                          {location.name} - {location.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Fund Type
                    </label>
                    <select
                      value={formData.fundType}
                      onChange={(e) =>
                        updateFormField("fundType", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none">
                      <option value="">Select Fund Type</option>
                      {activeFundTypes.map((fund) => (
                        <option
                          key={fund.id}
                          value={fund.name}>
                          {fund.name} ({fund.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Expense Type
                    </label>
                    <select
                      value={formData.expenseType}
                      onChange={(e) =>
                        updateFormField("expenseType", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none">
                      <option value="">Select Expense Type</option>
                      {expenseTypeOptions.map((type) => (
                        <option
                          key={type}
                          value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Party Name
                    </label>
                    <select
                      value={formData.partyName}
                      onChange={(e) =>
                        updateFormField("partyName", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none">
                      <option value="">Select Party</option>
                      {sundryCreditors.map((party) => (
                        <option
                          key={party}
                          value={party}>
                          {party}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Ledger Account
                    </label>
                    <select
                      value={formData.ledgerAccount}
                      onChange={(e) =>
                        updateFormField("ledgerAccount", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none">
                      <option value="">Select Ledger Account</option>
                      {getFilteredLedgerAccounts().map((ledger) => (
                        <option
                          key={ledger}
                          value={ledger}>
                          {ledger}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Invoice No
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) =>
                        updateFormField("invoiceNo", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Invoice Date
                    </label>
                    <CompactDatePicker
                      value={formData.invoiceDate}
                      onChange={(value) =>
                        updateFormField("invoiceDate", value)
                      }
                      className="border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Amount Before GST
                    </label>
                    <input
                      type="number"
                      value={formData.amountBeforeGST}
                      onChange={(e) =>
                        updateFormField(
                          "amountBeforeGST",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      GST Amount
                    </label>
                    <input
                      type="number"
                      value={formData.gstAmount}
                      onChange={(e) =>
                        updateFormField(
                          "gstAmount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Total Invoice Amount
                    </label>
                    <input
                      type="number"
                      value={formData.totalInvoiceAmount}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      TDS Amount
                    </label>
                    <input
                      type="number"
                      value={formData.tdsAmount}
                      onChange={(e) =>
                        updateFormField(
                          "tdsAmount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Net Amount Payable
                    </label>
                    <input
                      type="number"
                      value={formData.netAmountPayable}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                      Narration
                    </label>
                    <textarea
                      value={formData.narration}
                      onChange={(e) =>
                        updateFormField("narration", e.target.value)
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className={`px-6 py-2 bg-${themeColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition`}>
                    {editingId ? "Update" : "Save"} Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>
          // List View - Table with all vouchers
        : <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div
              className={`bg-${themeColor} px-10 py-6 flex items-center justify-between text-white`}>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Create {type} Voucher
                </h2>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                  Manage Voucher Entries
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExport}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition">
                  📥 Excel
                </button>
                <button
                  onClick={handleAddNew}
                  className="px-6 py-2 bg-white text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-50 transition">
                  ➕ Add Voucher
                </button>
              </div>
            </div>

            <div className="p-10">
              <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-700">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-4 whitespace-nowrap">
                        Voucher No
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap">
                        Voucher Date
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap">
                        Party Name
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap">Fund Type</th>
                      <th className="px-4 py-4 whitespace-nowrap">
                        Expense Type
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap">
                        Ledger Account
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap">
                        Invoice No
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap">
                        Invoice Date
                      </th>
                      <th className="px-4 py-4 text-right whitespace-nowrap">
                        Amt Before GST
                      </th>
                      <th className="px-4 py-4 text-right whitespace-nowrap">
                        GST Amt
                      </th>
                      <th className="px-4 py-4 text-right whitespace-nowrap">
                        Total Invoice
                      </th>
                      <th className="px-4 py-4 text-right whitespace-nowrap">
                        TDS Amt
                      </th>
                      <th className="px-4 py-4 text-right whitespace-nowrap">
                        Net Payable
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap">Narration</th>
                      <th className="px-4 py-4 text-center whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {vouchers.map((voucher) => (
                      <tr
                        key={voucher.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-4 text-xs font-mono font-bold whitespace-nowrap">
                          <button
                            onClick={() => setViewingVoucher(voucher)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 hover:underline-offset-4 transition-all">
                            {voucher.id}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {voucher.voucherDate}
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {voucher.partyName}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {voucher.fundType}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {voucher.expenseType}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {voucher.ledgerAccount}
                        </td>
                        <td className="px-4 py-4 text-xs font-mono text-brand-600 whitespace-nowrap">
                          {voucher.invoiceNo}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {voucher.invoiceDate}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          ₹{voucher.amountBeforeGST.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          ₹{voucher.gstAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          ₹{voucher.totalInvoiceAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-semibold text-orange-600 whitespace-nowrap">
                          ₹{voucher.tdsAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-black text-emerald-600 whitespace-nowrap">
                          ₹{voucher.netAmountPayable.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                          {voucher.narration}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(voucher)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-blue-600 transition">
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(voucher.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-red-600 transition">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {vouchers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">
                    No vouchers created yet. Click "Add Voucher" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

      }
    </div>
  );
};
