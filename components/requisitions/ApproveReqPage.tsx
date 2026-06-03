import React, { useMemo, useState } from "react";
import { RequisitionDetailsDrawer } from "./RequisitionDetailsDrawer";
import type { RentEntry } from "./rentTypes";
import type { TravelExpense } from "./TravelExpensePage";

export const REVIEW_REQUISITIONS_SUBTAB = "Review Requisitions";

interface MasterItem {
  name?: string;
  code?: string;
  status?: string;
}

interface ProjectItem extends MasterItem {
  locations?: string[];
}

interface UserItem {
  name?: string;
  proj?: string;
  fund?: string;
  grant?: string;
  func?: string;
  status?: string;
}

interface ReviewPageInput {
  consultantRecords?: any[];
  consultantVouchersData?: any[];
  rentRecords?: any[];
  rentVouchersData?: any[];
  travelRecords?: any[];
  travelExpenseRecords?: TravelExpense[];
  projects?: ProjectItem[];
  funds?: MasterItem[];
  grants?: MasterItem[];
  functions?: MasterItem[];
  users?: UserItem[];
}

export interface ReviewRequisitionRow {
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
  // Travel expense fields
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
  travelStartDate?: string;
  travelEndDate?: string;
  noOfDays?: number;
  perDiemAmount?: number;
  travelAmount?: number;
  totalAmount?: number;
  travelMode?: string;
  ticketToBeBooked?: string;
  advanceRequired?: number;
  lodgingToBeBooked?: string;
  finalSettlementDate?: string;
  status?: string;
}

interface ApproveRowOptions {
  autoExpenseVoucher: boolean;
  autoBankVoucher: boolean;
}

interface Group {
  name: string;
  ledgers: (string | { name: string; [key: string]: any })[];
}

interface MasterCategory {
  master: string;
  groups: Group[];
}

interface ApproveReqPageProps {
  themeColor?: string;
  rows?: ReviewRequisitionRow[];
  consultantData?: ConsultantData[];
  rentData?: RentEntry[];
  travelData?: TravelData[];
  travelExpenseRecords?: TravelExpense[];
  chartOfAccounts?: MasterCategory[];
  onApproveRow?: (
    reqId: string,
    sourceType: "Consultant" | "Rent" | "Travel",
    requestor: string,
    monthKey: string,
    options: ApproveRowOptions,
  ) => void;
  onResetRow?: (
    reqId: string,
    sourceType: "Consultant" | "Rent" | "Travel",
    requestor: string,
    monthKey: string,
  ) => void;
  onSaveSnapshot?: (rows: ReviewRequisitionRow[]) => void;
}

const clean = (v: unknown) => String(v || "").trim();

const parseDate = (raw: unknown): Date | null => {
  const value = clean(raw);
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
};

const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getCurrentMonthName = () => {
  const now = new Date();
  return now.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const formatDDMMYYYY = (date: Date | null) => {
  if (!date) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const getMonthWindowFromKey = (
  monthKey: string,
): { start: Date; end: Date } | null => {
  const m = clean(monthKey).match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
};

const overlapsMonth = (
  startRaw: unknown,
  endRaw: unknown,
  monthKey: string,
) => {
  const window = getMonthWindowFromKey(monthKey);
  if (!window) return false;
  const start = parseDate(startRaw);
  const end = parseDate(endRaw);
  if (!start || !end) return false;
  return start <= window.end && end >= window.start;
};

const normalizeStatus = (status: unknown) => clean(status).toLowerCase();

export const countRowsToAction = (rows: ReviewRequisitionRow[]) =>
  rows.filter((row) => {
    const s = normalizeStatus(row.status);
    return (
      s !== "approved" && s !== "rejected" && s !== "closed" && s !== "done"
    );
  }).length;

export const buildReviewRequisitionRows = ({
  consultantRecords = [],
  consultantVouchersData = [],
  rentRecords = [],
  rentVouchersData = [],
  travelRecords = [],
  travelExpenseRecords = [],
  projects = [],
  funds = [],
  grants = [],
  functions = [],
  users = [],
}: ReviewPageInput): ReviewRequisitionRow[] => {
  const activeUsers = users.filter(
    (u) => normalizeStatus(u.status || "active") !== "inactive",
  );
  const byCode = (items: MasterItem[]) => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      const code = clean(item.code);
      const name = clean(item.name);
      if (code && name) map.set(code.toLowerCase(), name);
    });
    return map;
  };

  const fundByCode = byCode(funds);
  const grantByCode = byCode(grants);
  const functionByCode = byCode(functions);

  const projectsByName = new Map<string, ProjectItem>();
  const projectsByCode = new Map<string, ProjectItem>();
  projects.forEach((project) => {
    const name = clean(project.name);
    const code = clean(project.code);
    if (name) projectsByName.set(name.toLowerCase(), project);
    if (code) projectsByCode.set(code.toLowerCase(), project);
  });

  const usersByName = new Map<string, UserItem>();
  activeUsers.forEach((user) => {
    const name = clean(user.name);
    if (name) usersByName.set(name.toLowerCase(), user);
  });

  const resolveFromProject = (projectRaw: unknown) => {
    const projectValue = clean(projectRaw);
    const projectItem =
      projectsByName.get(projectValue.toLowerCase()) ||
      projectsByCode.get(projectValue.toLowerCase());
    const projectName = clean(projectItem?.name) || projectValue || "-";
    const projectCode = clean(projectItem?.code || projectValue).toLowerCase();
    const matchedUser =
      activeUsers.find((u) => clean(u.proj).toLowerCase() === projectCode) ||
      null;
    return {
      project: projectName || "-",
      fund:
        fundByCode.get(clean(matchedUser?.fund).toLowerCase()) ||
        clean(matchedUser?.fund) ||
        "-",
      grant:
        grantByCode.get(clean(matchedUser?.grant).toLowerCase()) ||
        clean(matchedUser?.grant) ||
        "-",
      functionName:
        functionByCode.get(clean(matchedUser?.func).toLowerCase()) ||
        clean(matchedUser?.func) ||
        "-",
    };
  };

  const resolveFromLocation = (locationRaw: unknown) => {
    const location = clean(locationRaw);
    if (!location) {
      return { project: "-", fund: "-", grant: "-", functionName: "-" };
    }
    const projectMatch =
      projects.find((p) =>
        (p.locations || []).some(
          (loc) => clean(loc).toLowerCase() === location.toLowerCase(),
        ),
      ) || null;
    if (!projectMatch) {
      return { project: "-", fund: "-", grant: "-", functionName: "-" };
    }
    return resolveFromProject(projectMatch.name || projectMatch.code || "");
  };

  const resolveFromUser = (userRaw: unknown) => {
    const user = usersByName.get(clean(userRaw).toLowerCase()) || null;
    if (!user)
      return { project: "-", fund: "-", grant: "-", functionName: "-" };
    const fromProject = resolveFromProject(user.proj);
    return {
      project: fromProject.project,
      fund:
        fundByCode.get(clean(user.fund).toLowerCase()) ||
        clean(user.fund) ||
        "-",
      grant:
        grantByCode.get(clean(user.grant).toLowerCase()) ||
        clean(user.grant) ||
        "-",
      functionName:
        functionByCode.get(clean(user.func).toLowerCase()) ||
        clean(user.func) ||
        "-",
    };
  };

  const rows: ReviewRequisitionRow[] = [];

  // Get current month key for filtering
  const currentMonthKey = getCurrentMonthKey();
  const currentMonthSuffix = currentMonthKey.substring(5); // e.g., "02" from "2026-02"

  let consultantSeq = 1;
  consultantVouchersData.forEach((snapshot: any) => {
    (snapshot?.consultants || []).forEach((consultant: any) => {
      const consultantName = clean(consultant?.consultantName);
      (consultant?.monthlyDetails || []).forEach((detail: any) => {
        const monthKey = clean(detail?.monthKey);
        if (monthKey !== currentMonthKey) return;
        const amount = Number(detail?.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) return;
        const monthDate = parseDate(`${monthKey}-01`);
        const linkedRecord =
          consultantRecords.find(
            (rec: any) =>
              clean(rec?.vendorName).toLowerCase() ===
              consultantName.toLowerCase(),
          ) || null;
        const mapped =
          linkedRecord && clean(linkedRecord?.agreementSignedBy) ?
            resolveFromUser(linkedRecord?.agreementSignedBy)
          : { project: "-", fund: "-", grant: "-", functionName: "-" };
        const reqId = `CON-${monthKey.replace("-", "")}-${String(consultantSeq).padStart(3, "0")}`;
        consultantSeq += 1;
        rows.push({
          sourceType: "Consultant",
          reqId,
          date: formatDDMMYYYY(monthDate),
          requestor: consultantName || "-",
          project: mapped.project,
          fund: mapped.fund,
          grant: mapped.grant,
          functionName: mapped.functionName,
          amount,
          lcFcra: consultantSeq % 3 === 0 ? "FCRA" : "LC",
          status: clean(detail?.approved) === "Y" ? "Approved" : "Pending",
          expenseVoucherCreated:
            clean(detail?.expenseVoucherCreated) === "Y" ? "Y" : "-",
          paymentVoucherCreated:
            clean(detail?.paymentVoucherCreated) === "Y" ? "Y" : "-",
          attachments: [],
        });
      });
    });
  });

  let rentSeq = 1;
  rentVouchersData.forEach((snapshot: any) => {
    (snapshot?.landlords || []).forEach((landlord: any) => {
      const landlordName = clean(landlord?.landlordName);
      (landlord?.monthlyDetails || []).forEach((detail: any) => {
        const monthKey = clean(detail?.monthKey);
        if (monthKey !== currentMonthKey) return;
        const amount = Number(detail?.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) return;
        const monthDate = parseDate(`${monthKey}-01`);
        const linkedRecord =
          rentRecords.find(
            (rec: any) =>
              clean(rec?.landlordName).toLowerCase() ===
                landlordName.toLowerCase() &&
              overlapsMonth(rec?.startDate, rec?.endDate, monthKey),
          ) ||
          rentRecords.find(
            (rec: any) =>
              clean(rec?.landlordName).toLowerCase() ===
              landlordName.toLowerCase(),
          ) ||
          null;
        const mapped = resolveFromLocation(linkedRecord?.centre);
        const reqId = `RNT-${monthKey.replace("-", "")}-${String(rentSeq).padStart(3, "0")}`;
        rentSeq += 1;
        rows.push({
          sourceType: "Rent",
          reqId,
          date: formatDDMMYYYY(monthDate),
          requestor: landlordName || "-",
          project: mapped.project,
          fund: mapped.fund,
          grant: mapped.grant,
          functionName: mapped.functionName,
          amount,
          lcFcra: rentSeq % 2 === 0 ? "FCRA" : "LC",
          status: clean(detail?.approved) === "Y" ? "Approved" : "Pending",
          expenseVoucherCreated:
            clean(detail?.expenseVoucherCreated) === "Y" ? "Y" : "-",
          paymentVoucherCreated:
            clean(detail?.paymentVoucherCreated) === "Y" ? "Y" : "-",
          attachments: [],
        });
      });
    });
  });

  const expenseByReqId = new Map<string, TravelExpense>();
  travelExpenseRecords.forEach((e) => expenseByReqId.set(e.reqId, e));

  travelRecords.forEach((entry: any) => {
    const status = clean(entry?.status) || "Pending";
    const entryDate = parseDate(entry?.dateOfEntry || entry?.travelStartDate);
    const amount =
      Number(entry?.totalAmount || 0) ||
      Number(entry?.travelAmount || 0) + Number(entry?.perDiemAmount || 0);
    const mapped = resolveFromProject(entry?.projectName);
    const travelExp = expenseByReqId.get(clean(entry?.id));
    const expenseAmount =
      travelExp ?
        travelExp.actualTicketCost +
        travelExp.actualLodgingCost +
        travelExp.actualLocalConveyance +
        travelExp.reqPerDiemAmount
      : undefined;
    rows.push({
      sourceType: "Travel",
      reqId:
        clean(entry?.id) ||
        `TRV-${formatDDMMYYYY(entryDate).replace(/\//g, "")}`,
      date: formatDDMMYYYY(entryDate),
      requestor: clean(entry?.travellerName || entry?.employeeName) || "-",
      project: mapped.project,
      fund: mapped.fund,
      grant: mapped.grant,
      functionName: mapped.functionName,
      amount: Number.isFinite(amount) ? amount : 0,
      lcFcra: amount > 20000 ? "FCRA" : "LC",
      status,
      expenseVoucherCreated:
        clean(entry?.expenseVoucherCreated) === "Y" ? "Y" : "-",
      paymentVoucherCreated:
        clean(entry?.paymentVoucherCreated) === "Y" ? "Y" : "-",
      attachments: [],
      expId: travelExp?.expId,
      expenseAmount,
    });
  });

  return rows.sort((a, b) => {
    const ad = parseDate(a.date);
    const bd = parseDate(b.date);
    if (!ad && !bd) return a.reqId.localeCompare(b.reqId);
    if (!ad) return 1;
    if (!bd) return -1;
    return bd.getTime() - ad.getTime();
  });
};

const extractMonthKeyFromReqId = (reqId: string): string | null => {
  // reqId formats: "RNT-202602-001" or "CON-202602-001"
  const m = reqId.match(/^(?:RNT|CON)-([0-9]{4})([0-9]{2})-/);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
};

const LC_FCRA_OPTIONS = ["LC", "FCRA"];
const SOURCE_TYPE_OPTIONS: ReviewRequisitionRow["sourceType"][] = [
  "Consultant",
  "Rent",
  "Travel",
];

interface EditModal {
  row: ReviewRequisitionRow;
  draft: ReviewRequisitionRow;
  newFiles: File[];
}

interface ApproveModal {
  reqId: string;
  remarks: string;
  autoExpenseVoucher: boolean;
  autoBankVoucher: boolean;
  bankAccount: string;
  voucherAction?: "expense" | "payment" | null;
}

interface RejectModal {
  reqId: string;
  remarks: string;
}

export const ApproveReqPage: React.FC<ApproveReqPageProps> = ({
  themeColor = "brand-600",
  rows = [],
  consultantData = [],
  rentData = [],
  travelData = [],
  travelExpenseRecords = [],
  chartOfAccounts = [],
  onApproveRow,
  onResetRow,
  onSaveSnapshot,
}) => {
  const [rowOverrides, setRowOverrides] = useState<
    Record<string, Partial<ReviewRequisitionRow>>
  >({});
  const [filterReqId, setFilterReqId] = useState("");
  const [filterRequestor, setFilterRequestor] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterFund, setFilterFund] = useState("");
  const [filterGrant, setFilterGrant] = useState("");
  const [filterFunction, setFilterFunction] = useState("");
  const [filterLcFcra, setFilterLcFcra] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<
    "Consultant" | "Rent" | "Travel" | null
  >(null);
  const [expDrawerExpId, setExpDrawerExpId] = useState<string | null>(null);
  const [returnToExpId, setReturnToExpId] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [approveModal, setApproveModal] = useState<ApproveModal | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModal | null>(null);
  const [resetModal, setResetModal] = useState<{ reqId: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkApproveModal, setBulkApproveModal] = useState<{
    reqIds: string[];
    remarks: string;
    autoExpenseVoucher: boolean;
    autoBankVoucher: boolean;
  } | null>(null);

  // Extract bank accounts from Chart of Accounts
  const bankAccounts = useMemo(() => {
    const accounts: string[] = [];
    chartOfAccounts.forEach((master) => {
      master.groups.forEach((group) => {
        group.ledgers.forEach((ledger) => {
          const ledgerName = typeof ledger === "string" ? ledger : ledger.name;
          if (ledgerName.toLowerCase().includes("bank")) {
            accounts.push(ledgerName);
          }
        });
      });
    });
    return accounts;
  }, [chartOfAccounts]);

  // Filter bank accounts by LC/FCRA
  const getBankAccountsByType = (type: string) => {
    if (type === "LC") {
      return bankAccounts.filter(
        (acc) =>
          acc.toLowerCase().includes("local") ||
          (acc.toLowerCase().includes("lc") &&
            !acc.toLowerCase().includes("fcra")),
      );
    } else if (type === "FCRA") {
      return bankAccounts.filter((acc) => acc.toLowerCase().includes("fcra"));
    }
    return bankAccounts;
  };

  const currentMonthName = getCurrentMonthName();

  // Close action menu on outside click
  React.useEffect(() => {
    if (!openActionMenu) return;
    const handler = () => setOpenActionMenu(null);
    document.addEventListener("click", handler, { capture: true });
    return () =>
      document.removeEventListener("click", handler, { capture: true });
  }, [openActionMenu]);

  // Build a quick lookup from expId → TravelExpense for the expense drawer
  const expRecordByExpId = useMemo(() => {
    const map = new Map<string, TravelExpense>();
    travelExpenseRecords.forEach((e) => map.set(e.expId, e));
    return map;
  }, [travelExpenseRecords]);

  const effectiveRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        ...(rowOverrides[row.reqId] || {}),
        status: rowOverrides[row.reqId]?.status || row.status || "Pending",
      })),
    [rows, rowOverrides],
  );

  const filteredRows = useMemo(
    () =>
      effectiveRows.filter(
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
          row.lcFcra.toLowerCase().includes(filterLcFcra.toLowerCase()) &&
          row.status.toLowerCase().includes(filterStatus.toLowerCase()),
      ),
    [
      effectiveRows,
      filterReqId,
      filterRequestor,
      filterType,
      filterDate,
      filterProject,
      filterFund,
      filterGrant,
      filterFunction,
      filterLcFcra,
      filterStatus,
    ],
  );

  const toActionCount = countRowsToAction(effectiveRows);

  const setRowStatus = (reqId: string, nextStatus: string) => {
    setRowOverrides((prev) => ({
      ...prev,
      [reqId]: { ...(prev[reqId] || {}), status: nextStatus },
    }));
  };

  const openApproveModal = (
    reqId: string,
    voucherAction?: "expense" | "payment",
  ) => {
    setApproveModal({
      reqId,
      remarks: "",
      autoExpenseVoucher: voucherAction === "expense",
      autoBankVoucher: voucherAction === "payment",
      bankAccount: "",
      voucherAction: voucherAction ?? null,
    });
  };

  const confirmApprove = () => {
    if (!approveModal) return;
    setRowStatus(approveModal.reqId, "Approved");
    const row = effectiveRows.find((r) => r.reqId === approveModal.reqId);
    if (row && onApproveRow) {
      if (row.sourceType === "Rent" || row.sourceType === "Consultant") {
        const monthKey = extractMonthKeyFromReqId(row.reqId);
        if (monthKey) {
          onApproveRow(row.reqId, row.sourceType, row.requestor, monthKey, {
            autoExpenseVoucher: approveModal.autoExpenseVoucher,
            autoBankVoucher: approveModal.autoBankVoucher,
          });
        }
      } else if (row.sourceType === "Travel") {
        onApproveRow(row.reqId, row.sourceType, row.requestor, "", {
          autoExpenseVoucher: approveModal.autoExpenseVoucher,
          autoBankVoucher: approveModal.autoBankVoucher,
        });
      }
    }
    setApproveModal(null);
  };

  const openRejectModal = (reqId: string) => {
    setRejectModal({ reqId, remarks: "" });
  };

  const confirmReject = () => {
    if (!rejectModal || !rejectModal.remarks.trim()) return;
    setRowStatus(rejectModal.reqId, "Rejected");
    setRejectModal(null);
  };

  const openResetModal = (reqId: string) => {
    setResetModal({ reqId });
  };

  const confirmReset = () => {
    if (!resetModal) return;
    setRowStatus(resetModal.reqId, "Pending");
    const row = effectiveRows.find((r) => r.reqId === resetModal.reqId);
    if (row && onResetRow) {
      if (row.sourceType === "Rent" || row.sourceType === "Consultant") {
        const monthKey = extractMonthKeyFromReqId(row.reqId);
        if (monthKey) {
          onResetRow(row.reqId, row.sourceType, row.requestor, monthKey);
        }
      } else if (row.sourceType === "Travel") {
        onResetRow(row.reqId, row.sourceType, row.requestor, "");
      }
    }
    setResetModal(null);
  };

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

  const openBulkApproveModal = () => {
    if (selectedRows.size === 0) {
      alert("Please select at least one entry to approve.");
      return;
    }
    setBulkApproveModal({
      reqIds: Array.from(selectedRows),
      remarks: "",
      autoExpenseVoucher: false,
      autoBankVoucher: false,
    });
  };

  const confirmBulkApprove = () => {
    if (!bulkApproveModal) return;
    bulkApproveModal.reqIds.forEach((reqId) => {
      setRowStatus(reqId, "Approved");
      const row = effectiveRows.find((r) => r.reqId === reqId);
      if (row && onApproveRow) {
        if (row.sourceType === "Rent" || row.sourceType === "Consultant") {
          const monthKey = extractMonthKeyFromReqId(row.reqId);
          if (monthKey) {
            onApproveRow(row.reqId, row.sourceType, row.requestor, monthKey, {
              autoExpenseVoucher: bulkApproveModal.autoExpenseVoucher,
              autoBankVoucher: bulkApproveModal.autoBankVoucher,
            });
          }
        } else if (row.sourceType === "Travel") {
          onApproveRow(row.reqId, row.sourceType, row.requestor, "", {
            autoExpenseVoucher: bulkApproveModal.autoExpenseVoucher,
            autoBankVoucher: bulkApproveModal.autoBankVoucher,
          });
        }
      }
    });
    setSelectedRows(new Set());
    setBulkApproveModal(null);
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      alert("Please select at least one entry to delete.");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRows.size} selected item(s)?`,
    );
    if (!confirmed) return;
    selectedRows.forEach((reqId) => {
      setRowStatus(reqId, "Deleted");
    });
    setSelectedRows(new Set());
  };

  const openEdit = (row: ReviewRequisitionRow) => {
    setEditModal({
      row,
      draft: { ...row, attachments: [...(row.attachments || [])] },
      newFiles: [],
    });
  };

  const closeEdit = () => setEditModal(null);

  const updateDraft = <K extends keyof ReviewRequisitionRow>(
    field: K,
    value: ReviewRequisitionRow[K],
  ) => {
    setEditModal((prev) =>
      prev ? { ...prev, draft: { ...prev.draft, [field]: value } } : prev,
    );
  };

  const removeAttachment = (index: number) => {
    setEditModal((prev) => {
      if (!prev) return prev;
      const next = [...(prev.draft.attachments || [])];
      next.splice(index, 1);
      return { ...prev, draft: { ...prev.draft, attachments: next } };
    });
  };

  const removeNewFile = (index: number) => {
    setEditModal((prev) => {
      if (!prev) return prev;
      const next = [...prev.newFiles];
      next.splice(index, 1);
      return { ...prev, newFiles: next };
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setEditModal((prev) =>
      prev ? { ...prev, newFiles: [...prev.newFiles, ...files] } : prev,
    );
    e.target.value = "";
  };

  const saveEdit = () => {
    if (!editModal) return;
    const { draft, newFiles } = editModal;
    const savedAttachments = [
      ...(draft.attachments || []),
      ...newFiles.map((f) => f.name),
    ];
    const finalDraft = { ...draft, attachments: savedAttachments };
    setRowOverrides((prev) => ({
      ...prev,
      [finalDraft.reqId]: { ...finalDraft },
    }));
    closeEdit();
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
    // If we navigated here from the expense drawer, go back to it
    if (returnToExpId) {
      setExpDrawerExpId(returnToExpId);
      setReturnToExpId(null);
    }
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
    setFilterStatus("");
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
    filterLcFcra ||
    filterStatus;

  return (
    <>
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className={`bg-${themeColor} px-8 py-6 text-white`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">
                  Review Requisitions
                </h1>
                <p className="text-white/80 text-xs font-medium mt-1">
                  {currentMonthName} queue across Consultant, Rent, and Travel
                  requisitions.
                </p>
              </div>
              <div className="flex items-center gap-4">
                {onSaveSnapshot && (
                  <button
                    onClick={() => onSaveSnapshot(effectiveRows)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition backdrop-blur-sm border border-white/30 shadow-lg"
                    title="Save current review requisitions to JSON file">
                    💾 Save Snapshot
                  </button>
                )}
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/70">
                    To Be Actioned
                  </div>
                  <div className="text-2xl font-black">{toActionCount}</div>
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
                    onClick={openBulkApproveModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-md">
                    <span>✓</span>
                    Approve ({selectedRows.size})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-md">
                    <span>✕</span>
                    Delete ({selectedRows.size})
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
                    <th className="px-4 py-4 text-center">Exp Voucher</th>
                    <th className="px-4 py-4 text-center">Pay Voucher</th>
                    <th className="px-4 py-4 min-w-[130px]">Status</th>
                    <th className="px-4 py-4 text-center min-w-[280px]">
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
                    <th className="px-2 py-2"></th>
                    <th className="px-2 py-2">
                      <input
                        type="text"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
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
                      const showExpenseLinks =
                        row.sourceType === "Travel" &&
                        (normalizeStatus(row.status) === "expense pending" ||
                          row.expenseVoucherCreated === "Y");
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
                            {showExpenseLinks && row.expId ?
                              <div className="flex flex-col gap-0.5">
                                {/* Expense ID — primary, clickable */}
                                <button
                                  onClick={() => setExpDrawerExpId(row.expId!)}
                                  className="text-teal-700 hover:text-teal-900 hover:underline cursor-pointer transition font-black text-xs text-left">
                                  {row.expId}
                                </button>
                                {/* Req ID — sub-label */}
                                <button
                                  onClick={() =>
                                    handleReqIdClick(row.reqId, row.sourceType)
                                  }
                                  className="text-indigo-500 hover:text-indigo-700 hover:underline cursor-pointer transition font-semibold text-[9px] text-left">
                                  Req: {row.reqId}
                                </button>
                              </div>
                            : <button
                                onClick={() =>
                                  handleReqIdClick(row.reqId, row.sourceType)
                                }
                                className="text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer transition font-bold">
                                {row.reqId}
                              </button>
                            }
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
                            {row.expenseVoucherCreated === "Y" ?
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs">
                                Y
                              </span>
                            : <span className="text-slate-400 text-xs">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.paymentVoucherCreated === "Y" ?
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-black text-xs">
                                Y
                              </span>
                            : <span className="text-slate-400 text-xs">-</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                normalizeStatus(row.status) === "approved" ?
                                  "bg-emerald-100 text-emerald-700"
                                : normalizeStatus(row.status) === "rejected" ?
                                  "bg-rose-100 text-rose-700"
                                : (
                                  normalizeStatus(row.status) ===
                                  "expense pending"
                                ) ?
                                  "bg-orange-100 text-orange-700"
                                : "bg-amber-100 text-amber-700"
                              }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-2 flex-nowrap justify-center whitespace-nowrap">
                              {
                                <button
                                  onClick={() => openApproveModal(row.reqId)}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition">
                                  Approve
                                </button>
                              }
                              <button
                                onClick={() => openRejectModal(row.reqId)}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition">
                                Reject
                              </button>
                              <button
                                onClick={() => openResetModal(row.reqId)}
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
                        colSpan={15}
                        className="px-4 py-10 text-center text-sm text-slate-500">
                        No requisitions found for {currentMonthName}.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <RequisitionDetailsDrawer
        reqId={selectedReqId}
        sourceType={selectedSourceType}
        consultantData={consultantData}
        rentData={rentData}
        travelData={travelData}
        onClose={handleCloseDrawer}
      />

      {/* ── Expense Details Drawer (Travel Expense Pending) ── */}
      {expDrawerExpId &&
        (() => {
          const exp = expRecordByExpId.get(expDrawerExpId);
          const linkedRow = effectiveRows.find(
            (r) => r.expId === expDrawerExpId,
          );
          const travelReqDetail = travelData.find(
            (t: any) => t.id === linkedRow?.reqId,
          );
          if (!exp) return null;
          const reqTotal =
            exp.reqTicketCost +
            exp.reqLodgingCost +
            exp.reqLocalConveyance +
            exp.reqPerDiemAmount;
          const actTotal =
            exp.actualTicketCost +
            exp.actualLodgingCost +
            exp.actualLocalConveyance +
            exp.reqPerDiemAmount;
          const fmtInr = (n: number) =>
            `INR ${Math.abs(n).toLocaleString("en-IN")}`;
          const diffLabel = (act: number, req: number) => {
            const d = act - req;
            if (d === 0) return <span className="text-slate-400">—</span>;
            return (
              <span className={d < 0 ? "text-red-600" : "text-emerald-600"}>
                {d > 0 ? "+" : "-"}
                {fmtInr(d)}
              </span>
            );
          };
          const compRows: {
            label: string;
            req: number;
            act: number;
            editable?: boolean;
          }[] = [
            {
              label: "Ticket Cost",
              req: exp.reqTicketCost,
              act: exp.actualTicketCost,
            },
            {
              label: "Lodging Cost",
              req: exp.reqLodgingCost,
              act: exp.actualLodgingCost,
            },
            {
              label: "Local Conveyance",
              req: exp.reqLocalConveyance,
              act: exp.actualLocalConveyance,
            },
            {
              label: "Per Diem",
              req: exp.reqPerDiemAmount,
              act: exp.reqPerDiemAmount,
            },
          ];
          return (
            <div className="fixed inset-0 z-50 flex">
              <div
                className="flex-1 bg-black/30 backdrop-blur-sm"
                onClick={() => setExpDrawerExpId(null)}
              />
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-teal-50 dark:bg-teal-900/20 flex items-start justify-between">
                  <div>
                    <div className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">
                      Travel Expense Details
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {exp.expId}
                    </h2>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div>
                        <span className="font-bold">Traveller:</span>{" "}
                        {exp.travellerName}
                      </div>
                      <div>
                        <span className="font-bold">Project:</span>{" "}
                        {exp.projectName}
                      </div>
                      <div>
                        <span className="font-bold">Travel Period:</span>{" "}
                        {exp.travelStartDate} → {exp.travelEndDate}
                      </div>
                      <div>
                        <span className="font-bold">Submitted On:</span>{" "}
                        {exp.submittedOn}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpDrawerExpId(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-500 text-lg font-black">
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  {/* Linked Req ID */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Travel Exp ID
                    </span>
                    <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-black">
                      {exp.expId}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                      Linked Req
                    </span>
                    <button
                      onClick={() => {
                        if (linkedRow) {
                          const currentExpId = expDrawerExpId;
                          setExpDrawerExpId(null);
                          setReturnToExpId(currentExpId);
                          handleReqIdClick(linkedRow.reqId, "Travel");
                        }
                      }}
                      className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-black hover:underline cursor-pointer">
                      {exp.reqId}
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        exp.expenseStatus === "Approved" ?
                          "bg-green-100 text-green-700"
                        : exp.expenseStatus === "Submitted" ?
                          "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                      }`}>
                      {exp.expenseStatus}
                    </span>
                  </div>

                  {/* Req Details summary (if found) */}
                  {travelReqDetail && (
                    <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 px-4 py-4">
                      <h3 className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-3">
                        Requisition Details — {exp.reqId}
                      </h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        {[
                          [
                            "Traveller",
                            travelReqDetail.travellerName || exp.travellerName,
                          ],
                          [
                            "Project",
                            travelReqDetail.projectName || exp.projectName,
                          ],
                          [
                            "Start Date",
                            travelReqDetail.travelStartDate ||
                              exp.travelStartDate,
                          ],
                          [
                            "End Date",
                            travelReqDetail.travelEndDate || exp.travelEndDate,
                          ],
                          [
                            "Advance Required",
                            `INR ${Number(travelReqDetail.advanceRequired || exp.reqAdvance || 0).toLocaleString("en-IN")}`,
                          ],
                          ["Req Status", travelReqDetail.status || "—"],
                        ].map(([label, val]) => (
                          <div key={label}>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              {label}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {val || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost comparison table */}
                  <div>
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Cost Comparison
                    </h3>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-xs">
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
                          {compRows.map(({ label, req, act }) => (
                            <tr
                              key={label}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                                {label}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">
                                {fmtInr(req)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">
                                {fmtInr(act)}
                              </td>
                              <td className="px-4 py-3 text-right font-black">
                                {diffLabel(act, req)}
                              </td>
                            </tr>
                          ))}
                          {/* Total row */}
                          <tr className="bg-slate-100 dark:bg-slate-800 font-black">
                            <td className="px-4 py-3 text-slate-800 dark:text-white">
                              Total
                            </td>
                            <td className="px-4 py-3 text-right text-slate-800 dark:text-white">
                              {fmtInr(reqTotal)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-800 dark:text-white">
                              {fmtInr(actTotal)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {diffLabel(actTotal, reqTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Advance & Balance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Advance Given
                      </div>
                      <div className="text-base font-black text-slate-800 dark:text-white">
                        {fmtInr(exp.reqAdvance)}
                      </div>
                    </div>
                    <div
                      className={`rounded-xl border px-4 py-3 ${
                        actTotal - exp.reqAdvance < 0 ?
                          "border-red-200 bg-red-50 dark:bg-red-900/10"
                        : "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10"
                      }`}>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Balance (Actual − Advance)
                      </div>
                      <div
                        className={`text-base font-black ${
                          actTotal - exp.reqAdvance < 0 ?
                            "text-red-600"
                          : "text-emerald-600"
                        }`}>
                        {fmtInr(actTotal - exp.reqAdvance)}
                        <span className="text-[9px] ml-1 font-semibold">
                          {actTotal - exp.reqAdvance < 0 ?
                            "(recoverable)"
                          : "(payable)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  {(exp.attachments ?? []).length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Attachments
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(exp.attachments ?? []).map((a, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
                            📎{" "}
                            <span className="max-w-[160px] truncate">
                              {a.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Approve Confirmation Modal ── */}
      {approveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setApproveModal(null)}>
          <div
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div
              className={`px-6 py-5 ${
                approveModal.voucherAction === "expense" ? "bg-blue-600"
                : approveModal.voucherAction === "payment" ? "bg-violet-600"
                : "bg-emerald-500"
              }`}>
              <h2 className="text-xl font-black tracking-tight uppercase text-white">
                {approveModal.voucherAction === "expense" ?
                  "Create Expense Voucher"
                : approveModal.voucherAction === "payment" ?
                  "Create Payment Voucher"
                : "Approve Requisition"}
              </h2>
              <p className="text-white/80 text-xs font-semibold mt-1">
                {approveModal.voucherAction ?
                  `Req: ${approveModal.reqId}`
                : "You are about to approve 1 item(s)."}
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
                  value={approveModal.remarks}
                  onChange={(e) =>
                    setApproveModal((prev) =>
                      prev ? { ...prev, remarks: e.target.value } : prev,
                    )
                  }
                  placeholder="Optional remarks..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400/40 resize-none bg-slate-50"
                />
              </div>
              {/* Show voucher checkboxes for non-travel rows, or for travel expense-pending rows */}
              {(() => {
                const row = effectiveRows.find(
                  (r) => r.reqId === approveModal.reqId,
                );
                const isExpensePending =
                  row?.sourceType === "Travel" &&
                  normalizeStatus(row?.status || "") === "expense pending";
                const showCheckboxes =
                  row?.sourceType !== "Travel" || isExpensePending;
                if (!showCheckboxes) return null;
                return (
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-blue-50/40 transition">
                      <input
                        type="checkbox"
                        checked={approveModal.autoExpenseVoucher}
                        onChange={(e) =>
                          setApproveModal((prev) =>
                            prev ?
                              {
                                ...prev,
                                autoExpenseVoucher: e.target.checked,
                              }
                            : prev,
                          )
                        }
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Create Expense Voucher
                      </span>
                    </label>
                    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-violet-50/40 transition">
                        <input
                          type="checkbox"
                          checked={approveModal.autoBankVoucher}
                          onChange={(e) =>
                            setApproveModal((prev) =>
                              prev ?
                                { ...prev, autoBankVoucher: e.target.checked }
                              : prev,
                            )
                          }
                          className="w-4 h-4 rounded accent-violet-600"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          Create Payment Voucher
                        </span>
                      </label>
                      {approveModal.autoBankVoucher && (
                        <div className="ml-7 flex flex-col gap-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            Select Bank Account
                          </label>
                          <select
                            value={approveModal.bankAccount}
                            onChange={(e) =>
                              setApproveModal((prev) =>
                                prev ?
                                  { ...prev, bankAccount: e.target.value }
                                : prev,
                              )
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-400/40">
                            <option value="">Select Bank Account</option>
                            {row &&
                              getBankAccountsByType(row.lcFcra).map(
                                (account) => (
                                  <option
                                    key={account}
                                    value={account}>
                                    {account}
                                  </option>
                                ),
                              )}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setApproveModal(null)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className={`px-5 py-2 rounded-lg text-white text-xs font-black uppercase tracking-widest transition ${
                  approveModal.voucherAction === "expense" ?
                    "bg-blue-600 hover:bg-blue-700"
                  : approveModal.voucherAction === "payment" ?
                    "bg-violet-600 hover:bg-violet-700"
                  : "bg-emerald-500 hover:bg-emerald-600"
                }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Approve Confirmation Modal ── */}
      {bulkApproveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setBulkApproveModal(null)}>
          <div
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-emerald-500 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight uppercase text-white">
                Bulk Approve Requisitions
              </h2>
              <p className="text-white/80 text-xs font-semibold mt-1">
                You are about to approve {bulkApproveModal.reqIds.length}{" "}
                item(s).
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
                  value={bulkApproveModal.remarks}
                  onChange={(e) =>
                    setBulkApproveModal((prev) =>
                      prev ? { ...prev, remarks: e.target.value } : prev,
                    )
                  }
                  placeholder="Optional remarks..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400/40 resize-none bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-blue-50/40 transition">
                  <input
                    type="checkbox"
                    checked={bulkApproveModal.autoExpenseVoucher}
                    onChange={(e) =>
                      setBulkApproveModal((prev) =>
                        prev ?
                          { ...prev, autoExpenseVoucher: e.target.checked }
                        : prev,
                      )
                    }
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Create Expense Voucher
                  </span>
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-violet-50/40 transition">
                  <input
                    type="checkbox"
                    checked={bulkApproveModal.autoBankVoucher}
                    onChange={(e) =>
                      setBulkApproveModal((prev) =>
                        prev ?
                          { ...prev, autoBankVoucher: e.target.checked }
                        : prev,
                      )
                    }
                    className="w-4 h-4 rounded accent-violet-600"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Create Payment Voucher
                  </span>
                </label>
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setBulkApproveModal(null)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                onClick={confirmBulkApprove}
                className="px-5 py-2 rounded-lg text-white text-xs font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 transition">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Confirmation Modal ── */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setRejectModal(null)}>
          <div
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-rose-500 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight uppercase text-white">
                Reject Requisition
              </h2>
              <p className="text-white/80 text-xs font-semibold mt-1">
                You are about to reject 1 item(s).
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-rose-400/40 resize-none bg-slate-50"
                />
                {rejectModal.remarks.trim() === "" && (
                  <p className="text-[9px] text-rose-500 font-semibold">
                    A reason is required to reject.
                  </p>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectModal.remarks.trim()}
                className="px-5 py-2 rounded-lg bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition disabled:opacity-40 disabled:cursor-not-allowed">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Reset Confirmation Modal ── */}
      {resetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setResetModal(null)}>
          <div
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-orange-500 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight uppercase text-white">
                Reset Requisition
              </h2>
              <p className="text-white/80 text-xs font-semibold mt-1">
                This will set the status back to Pending and remove all
                associated expense &amp; payment vouchers for this month.
              </p>
            </div>
            {/* Body */}
            <div className="p-6">
              <p className="text-sm font-semibold text-slate-700">
                Are you sure you want to reset{" "}
                <span className="font-black text-orange-600">
                  {resetModal.reqId}
                </span>{" "}
                back to Pending? This action will also clear any auto-created
                expense and payment vouchers for this entry in the Vouchers
                screen.
              </p>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setResetModal(null)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-5 py-2 rounded-lg bg-orange-500 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition">
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeEdit}>
          <div
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div
              className={`bg-${themeColor} px-6 py-4 flex items-center justify-between`}>
              <div>
                <h2 className="text-lg font-black tracking-tight uppercase text-white">
                  Edit Requisition
                </h2>
                <p className="text-white/70 text-[10px] font-semibold mt-0.5">
                  {editModal.draft.reqId}
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="text-white/80 hover:text-white text-xl font-black leading-none">
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {/* Source Type */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Type
                </label>
                <select
                  value={editModal.draft.sourceType}
                  onChange={(e) =>
                    updateDraft(
                      "sourceType",
                      e.target.value as ReviewRequisitionRow["sourceType"],
                    )
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700">
                  {SOURCE_TYPE_OPTIONS.map((o) => (
                    <option
                      key={o}
                      value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* Req ID */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Req ID
                </label>
                <input
                  type="text"
                  value={editModal.draft.reqId}
                  onChange={(e) => updateDraft("reqId", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Date
                </label>
                <input
                  type="text"
                  value={editModal.draft.date}
                  onChange={(e) => updateDraft("date", e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* Requestor */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Requestor
                </label>
                <input
                  type="text"
                  value={editModal.draft.requestor}
                  onChange={(e) => updateDraft("requestor", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* Project */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Project
                </label>
                <input
                  type="text"
                  value={editModal.draft.project}
                  onChange={(e) => updateDraft("project", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* Fund */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Fund
                </label>
                <input
                  type="text"
                  value={editModal.draft.fund}
                  onChange={(e) => updateDraft("fund", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* Grant */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Grant
                </label>
                <input
                  type="text"
                  value={editModal.draft.grant}
                  onChange={(e) => updateDraft("grant", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* Function */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Function
                </label>
                <input
                  type="text"
                  value={editModal.draft.functionName}
                  onChange={(e) => updateDraft("functionName", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Amount (INR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editModal.draft.amount}
                  onChange={(e) =>
                    updateDraft("amount", Number(e.target.value))
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700"
                />
              </div>

              {/* LC / FCRA */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  LC / FCRA
                </label>
                <select
                  value={editModal.draft.lcFcra}
                  onChange={(e) => updateDraft("lcFcra", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 bg-white dark:bg-slate-700">
                  {LC_FCRA_OPTIONS.map((o) => (
                    <option
                      key={o}
                      value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attachments */}
              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Attachments
                </label>

                {/* Existing attachments */}
                {(editModal.draft.attachments || []).length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Existing
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(editModal.draft.attachments || []).map((name, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
                          <svg
                            className="w-3 h-3 text-slate-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="max-w-[160px] truncate">{name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(i)}
                            className="ml-1 text-rose-400 hover:text-rose-600 font-black text-xs leading-none">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newly added (not yet saved) */}
                {editModal.newFiles.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                      New — pending save
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {editModal.newFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-semibold text-emerald-800">
                          <svg
                            className="w-3 h-3 text-emerald-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="max-w-[160px] truncate">
                            {file.name}
                          </span>
                          <span className="text-emerald-400 text-[9px]">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNewFile(i)}
                            className="ml-1 text-rose-400 hover:text-rose-600 font-black text-xs leading-none">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <label className="inline-flex items-center gap-2 self-start cursor-pointer px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/30 transition text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Documents
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>

                {(editModal.draft.attachments || []).length === 0 &&
                  editModal.newFiles.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">
                      No attachments yet for this requisition.
                    </p>
                  )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={closeEdit}
                className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className={`px-5 py-2 rounded-lg bg-${themeColor} text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition`}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
