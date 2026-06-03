import React, { useMemo, useState } from "react";
import { RequisitionDetailsDrawer } from "../requisitions/RequisitionDetailsDrawer";

export interface ExpenseVoucherRow {
  sourceType: "Consultant" | "Rent" | "Travel";
  reqId: string;
  date: string;
  requestor: string;
  project: string;
  fund: string;
  grant: string;
  functionName: string;
  amount: number;
  lcFcra: string;
  status: string;
  expenseVoucherCreated?: string;
  paymentVoucherCreated?: string;
  attachments?: string[];
  expId?: string;
  expenseAmount?: number;
}

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
  employeeName?: string;
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

interface RentEntry {
  id: string;
  landlordName: string;
  location?: string;
  panNo?: string;
  bankDetails?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  agreementStartDate?: string;
  agreementEndDate?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  postingFrequency?: string;
  autoPosting?: string;
  [key: string]: any;
}

interface ApproveExpenseVoucherPageProps {
  themeColor?: string;
  data?: ExpenseVoucherRow[];
  onCreateExpenseVoucher?: (reqId: string, sourceType: string) => void;
  consultantData?: ConsultantData[];
  rentData?: RentEntry[];
  travelData?: TravelData[];
}

const clean = (v: unknown) => String(v || "").trim();
const normalizeStatus = (status: unknown) => clean(status).toLowerCase();

const getCurrentMonthName = () => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
};

export const ApproveExpenseVoucherPage: React.FC<
  ApproveExpenseVoucherPageProps
> = ({
  themeColor = "brand-600",
  data = [],
  onCreateExpenseVoucher,
  consultantData = [],
  rentData = [],
  travelData = [],
}) => {
  const [filterReqId, setFilterReqId] = useState("");
  const [filterRequestor, setFilterRequestor] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterFund, setFilterFund] = useState("");
  const [filterGrant, setFilterGrant] = useState("");
  const [filterFunction, setFilterFunction] = useState("");
  const [filterLcFcra, setFilterLcFcra] = useState("");
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<
    "Consultant" | "Rent" | "Travel" | null
  >(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [createVoucherModal, setCreateVoucherModal] = useState<{
    reqId: string;
    sourceType: string;
    remarks: string;
    createPaymentVoucher: boolean;
  } | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    reqId: string;
    remarks: string;
  } | null>(null);
  const [editModal, setEditModal] = useState<{
    row: ExpenseVoucherRow;
    draft: ExpenseVoucherRow;
  } | null>(null);

  const currentMonthName = getCurrentMonthName();

  // Filter data: status = 'Approved' AND expenseVoucherCreated = '-'
  const filteredData = useMemo(() => {
    return data.filter(
      (row) =>
        normalizeStatus(row.status) === "approved" &&
        (row.expenseVoucherCreated === "-" || !row.expenseVoucherCreated),
    );
  }, [data]);

  const filteredRows = useMemo(
    () =>
      filteredData.filter(
        (row) =>
          row.reqId.toLowerCase().includes(filterReqId.toLowerCase()) &&
          row.requestor.toLowerCase().includes(filterRequestor.toLowerCase()) &&
          row.sourceType.toLowerCase().includes(filterType.toLowerCase()) &&
          row.date.toLowerCase().includes(filterDate.toLowerCase()) &&
          row.project.toLowerCase().includes(filterProject.toLowerCase()) &&
          row.fund.toLowerCase().includes(filterFund.toLowerCase()) &&
          row.grant.toLowerCase().includes(filterGrant.toLowerCase()) &&
          row.functionName
            .toLowerCase()
            .includes(filterFunction.toLowerCase()) &&
          row.lcFcra.toLowerCase().includes(filterLcFcra.toLowerCase()),
      ),
    [
      filteredData,
      filterReqId,
      filterRequestor,
      filterType,
      filterDate,
      filterProject,
      filterFund,
      filterGrant,
      filterFunction,
      filterLcFcra,
    ],
  );

  const toggleRowSelection = (reqId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) {
        next.delete(reqId);
      } else {
        next.add(reqId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRows.map((r) => r.reqId)));
    }
  };

  const handleReqIdClick = (
    reqId: string,
    sourceType: "Consultant" | "Rent" | "Travel",
  ) => {
    setSelectedReqId(reqId);
    setSelectedSourceType(sourceType);
  };

  const handleCloseDrawer = () => {
    setSelectedReqId(null);
    setSelectedSourceType(null);
  };

  const openCreateVoucherModal = (reqId: string, sourceType: string) => {
    setCreateVoucherModal({
      reqId,
      sourceType,
      remarks: "",
      createPaymentVoucher: false,
    });
  };

  const confirmCreateVoucher = () => {
    if (!createVoucherModal) return;
    if (onCreateExpenseVoucher) {
      onCreateExpenseVoucher(
        createVoucherModal.reqId,
        createVoucherModal.sourceType,
      );
    }
    setCreateVoucherModal(null);
  };

  const openRejectModal = (reqId: string) => {
    setRejectModal({ reqId, remarks: "" });
  };

  const confirmReject = () => {
    if (!rejectModal || !rejectModal.remarks.trim()) return;
    console.log(`Rejecting expense voucher for ${rejectModal.reqId}`);
    // TODO: Implement reject logic
    setRejectModal(null);
  };

  const handleReset = (reqId: string) => {
    console.log(`Resetting ${reqId}`);
    // TODO: Implement reset logic
  };

  const openEdit = (row: ExpenseVoucherRow) => {
    setEditModal({ row, draft: { ...row } });
  };

  const updateEditDraft = <K extends keyof ExpenseVoucherRow>(
    field: K,
    value: ExpenseVoucherRow[K],
  ) => {
    setEditModal((prev) =>
      prev ? { ...prev, draft: { ...prev.draft, [field]: value } } : prev,
    );
  };

  const saveEdit = () => {
    if (!editModal) return;
    console.log("Saving changes:", editModal.draft);
    // TODO: Implement save logic to update the data
    setEditModal(null);
  };

  const handleBulkCreateVouchers = () => {
    if (selectedRows.size === 0) {
      alert("Please select at least one entry to create expense vouchers.");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to create expense vouchers for ${selectedRows.size} selected item(s)?`,
    );
    if (!confirmed) return;

    selectedRows.forEach((reqId) => {
      const row = filteredRows.find((r) => r.reqId === reqId);
      if (row && onCreateExpenseVoucher) {
        onCreateExpenseVoucher(row.reqId, row.sourceType);
      }
    });
    setSelectedRows(new Set());
  };

  const clearAllFilters = () => {
    setFilterType("");
    setFilterReqId("");
    setFilterDate("");
    setFilterRequestor("");
    setFilterProject("");
    setFilterFund("");
    setFilterGrant("");
    setFilterFunction("");
    setFilterLcFcra("");
  };

  const hasActiveFilters =
    filterType ||
    filterReqId ||
    filterDate ||
    filterRequestor ||
    filterProject ||
    filterFund ||
    filterGrant ||
    filterFunction ||
    filterLcFcra;

  return (
    <>
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className={`bg-${themeColor} px-8 py-6 text-white`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">
                  Approve Expense Voucher
                </h1>
                <p className="text-white/80 text-xs font-medium mt-1">
                  {currentMonthName} - Approved requisitions ready for expense
                  voucher creation.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/70">
                    To Be Actioned
                  </div>
                  <div className="text-2xl font-black">
                    {filteredRows.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Total Records: {filteredRows.length}
                  {selectedRows.size > 0 && (
                    <span className="ml-3 text-brand-600">
                      ({selectedRows.size} selected)
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition">
                    <span>✕</span>
                    Clear Filters
                  </button>
                )}
              </div>
              {selectedRows.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkCreateVouchers}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-md">
                    <span>✓</span>
                    Create Vouchers ({selectedRows.size})
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-300">
                    <th className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.size === filteredRows.length &&
                          filteredRows.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Req ID / Exp ID</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Requestor</th>
                    <th className="px-4 py-4">Project</th>
                    <th className="px-4 py-4">Fund</th>
                    <th className="px-4 py-4">Grant</th>
                    <th className="px-4 py-4">Function</th>
                    <th className="px-4 py-4 text-right">Req Amount</th>
                    <th className="px-4 py-4 text-center">Budget Status</th>
                    <th className="px-4 py-4">LC / FCRA</th>
                    <th className="px-4 py-4 text-center min-w-[200px]">
                      Action
                    </th>
                  </tr>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-2 py-2"></th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterReqId}
                        onChange={(e) => setFilterReqId(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterRequestor}
                        onChange={(e) => setFilterRequestor(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterFund}
                        onChange={(e) => setFilterFund(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterGrant}
                        onChange={(e) => setFilterGrant(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterFunction}
                        onChange={(e) => setFilterFunction(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2"></th>
                    <th className="px-2 py-2"></th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterLcFcra}
                        onChange={(e) => setFilterLcFcra(e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRows.length > 0 ?
                    filteredRows.map((row) => {
                      return (
                        <tr
                          key={`${row.sourceType}-${row.reqId}`}
                          className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.reqId)}
                              onChange={() => toggleRowSelection(row.reqId)}
                              className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">
                            {row.sourceType}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            <button
                              onClick={() =>
                                handleReqIdClick(row.reqId, row.sourceType)
                              }
                              className="text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer transition font-bold">
                              {row.reqId}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {row.date}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {row.requestor}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {row.project}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {row.fund}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {row.grant}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {row.functionName}
                          </td>
                          {/* Req Amount */}
                          <td className="px-4 py-3 text-xs font-black text-slate-900 text-right whitespace-nowrap">
                            INR {Number(row.amount || 0).toLocaleString()}
                          </td>
                          {/* Budget Status */}
                          <td className="px-4 py-3 text-center">
                            {row.requestor === "Consult-B" ?
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap bg-red-100 text-red-700">
                                Over Budget
                              </span>
                            : <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap bg-green-100 text-green-700">
                                Within Budget
                              </span>
                            }
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {row.lcFcra}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-2 flex-nowrap justify-center whitespace-nowrap">
                              <button
                                onClick={() =>
                                  openCreateVoucherModal(
                                    row.reqId,
                                    row.sourceType,
                                  )
                                }
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition">
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(row.reqId)}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition">
                                Reject
                              </button>
                              <button
                                onClick={() => handleReset(row.reqId)}
                                className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition">
                                Reset
                              </button>
                              <button
                                onClick={() => openEdit(row)}
                                className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : <tr>
                      <td
                        colSpan={13}
                        className="px-6 py-12 text-center text-slate-500 text-sm font-semibold">
                        No approved requisitions awaiting expense voucher
                        creation.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Requisition Details Drawer */}
      {selectedReqId && selectedSourceType && (
        <RequisitionDetailsDrawer
          reqId={selectedReqId}
          sourceType={selectedSourceType}
          consultantData={consultantData}
          rentData={rentData}
          travelData={travelData}
          onClose={handleCloseDrawer}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-rose-500 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight uppercase text-white">
                Reject Expense Voucher
              </h2>
              <p className="text-white/80 text-xs font-semibold mt-1">
                Req: {rejectModal.reqId}
              </p>
            </div>
            {/* Body */}
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Reason / Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectModal.remarks}
                  onChange={(e) =>
                    setRejectModal((prev) =>
                      prev ? { ...prev, remarks: e.target.value } : prev,
                    )
                  }
                  placeholder="Mandatory reason for rejection..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition"
                />
              </div>
            </div>
            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition">
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectModal.remarks.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-brand-600 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight uppercase text-white">
                Edit Requisition
              </h2>
              <p className="text-white/80 text-xs font-semibold mt-1">
                {editModal.row.reqId}
              </p>
            </div>
            {/* Body */}
            <div className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Type
                  </label>
                  <select
                    value={editModal.draft.sourceType}
                    onChange={(e) =>
                      updateEditDraft(
                        "sourceType",
                        e.target.value as "Consultant" | "Rent" | "Travel",
                      )
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition">
                    <option value="Consultant">Consultant</option>
                    <option value="Rent">Rent</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Req ID
                  </label>
                  <input
                    type="text"
                    value={editModal.draft.reqId}
                    onChange={(e) => updateEditDraft("reqId", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Date
                  </label>
                  <input
                    type="text"
                    value={editModal.draft.date}
                    onChange={(e) => updateEditDraft("date", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Requestor
                  </label>
                  <input
                    type="text"
                    value={editModal.draft.requestor}
                    onChange={(e) =>
                      updateEditDraft("requestor", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Project
                  </label>
                  <input
                    type="text"
                    value={editModal.draft.project}
                    onChange={(e) => updateEditDraft("project", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Fund
                  </label>
                  <input
                    type="text"
                    value={editModal.draft.fund}
                    onChange={(e) => updateEditDraft("fund", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Grant
                  </label>
                  <input
                    type="text"
                    value={editModal.draft.grant}
                    onChange={(e) => updateEditDraft("grant", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Function
                  </label>
                  <input
                    type="text"
                    value={editModal.draft.functionName}
                    onChange={(e) =>
                      updateEditDraft("functionName", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={editModal.draft.amount}
                    onChange={(e) =>
                      updateEditDraft("amount", Number(e.target.value))
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    LC / FCRA
                  </label>
                  <select
                    value={editModal.draft.lcFcra}
                    onChange={(e) => updateEditDraft("lcFcra", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition">
                    <option value="LC">LC</option>
                    <option value="FCRA">FCRA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                  Attachments
                </label>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:border-brand-500 hover:text-brand-600 transition">
                  <span className="text-lg">+</span>
                  Add Documents
                </button>
                {(
                  editModal.draft.attachments &&
                  editModal.draft.attachments.length > 0
                ) ?
                  <div className="mt-2 text-xs text-slate-500">
                    {editModal.draft.attachments.length} file(s) attached
                  </div>
                : <div className="mt-2 text-xs italic text-slate-400">
                    No attachments yet for this requisition.
                  </div>
                }
              </div>
            </div>
            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-md">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Expense Voucher Modal */}
      {createVoucherModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-emerald-600 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight uppercase text-white">
                Approve Requisition
              </h2>
              <p className="text-white/80 text-xs font-semibold mt-1">
                You are about to approve 1 item(s).
              </p>
            </div>
            {/* Body */}
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Reason / Remarks
                </label>
                <textarea
                  rows={4}
                  value={createVoucherModal.remarks}
                  onChange={(e) =>
                    setCreateVoucherModal((prev) =>
                      prev ? { ...prev, remarks: e.target.value } : prev,
                    )
                  }
                  placeholder="Optional remarks..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="createPaymentVoucher"
                  checked={createVoucherModal.createPaymentVoucher}
                  onChange={(e) =>
                    setCreateVoucherModal((prev) =>
                      prev ?
                        { ...prev, createPaymentVoucher: e.target.checked }
                      : prev,
                    )
                  }
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="createPaymentVoucher"
                  className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                  Create Payment Voucher
                </label>
              </div>
            </div>
            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCreateVoucherModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition">
                Cancel
              </button>
              <button
                onClick={confirmCreateVoucher}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-md">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
