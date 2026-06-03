import React, { useMemo, useState } from "react";
import { CompactDatePicker } from "../shared/CompactDatePicker";

type VendorRecord = {
  id: number;
  name: string;
  category: string;
  credentialRef: string;
  nameAsPerPan?: string;
  contact: string;
  email: string;
  validTill: string;
  status: "Active" | "Pending Renewal" | "Suspended";
};

type RequisitionRecord = {
  id: number;
  requisitionNo: string;
  itemSummary: string;
  program: string;
  fundCode: string;
  amount: number;
  budgetAvailable: number;
  requestedBy: string;
  createdOn: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  budgetCheck: "Pass" | "Fail";
};

type QuotationRecord = {
  id: number;
  requisitionId: number;
  vendorId: number;
  quoteAmount: number;
  deliveryDays: number;
  qualityScore: number;
  invoiceRef: string;
  aiExtractSummary: string;
  sourceFileName?: string;
  selectedByUser?: boolean;
  makerSelectedBy?: string;
  rankOrder?: number;
  aiScore?: number;
  aiReason?: string;
  selectedOn?: string;
  quotesReceivedForRequisition?: number;
  checkerStatus?: "Pending" | "Approved" | "Rejected";
  checkerBy?: string;
  checkerOn?: string;
  checkerRemarks?: string;
  committeeDecision: "Pending" | "Approved" | "Rejected";
  remarks: string;
};

type PurchaseOrderRecord = {
  id: number;
  poNo: string;
  requisitionId: number;
  vendorId: number;
  quoteId: number | null;
  fundCode: string;
  quantity: number;
  poAmount: number;
  deliveryDue: string;
  terms: string;
  status: "Issued" | "Partially Received" | "Closed";
};

type GrnRecord = {
  id: number;
  grnNo: string;
  poId: number;
  receivedQty: number;
  invoiceAmount: number;
  receivedOn: string;
  qualityStatus: "Accepted" | "Partial" | "Rejected";
  discrepancyNote: string;
  matchStatus: "Matched" | "Mismatch";
};

type ProcurementModulePageProps = {
  activeSubTab: string;
  vendors: VendorRecord[];
  requisitions: RequisitionRecord[];
  quotations: QuotationRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  grns: GrnRecord[];
  onVendorsChange: (next: VendorRecord[]) => void;
  onRequisitionsChange: (next: RequisitionRecord[]) => void;
  onQuotationsChange: (next: QuotationRecord[]) => void;
  onPurchaseOrdersChange: (next: PurchaseOrderRecord[]) => void;
  onGrnsChange: (next: GrnRecord[]) => void;
};

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const todayIso = () => new Date().toISOString().slice(0, 10);

const daysUntil = (isoDate: string) => {
  if (!isoDate) return Number.POSITIVE_INFINITY;
  const now = new Date();
  const due = new Date(`${isoDate}T00:00:00`);
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const SectionCard: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="text-sm font-black text-slate-800 dark:text-slate-100">
      {title}
    </div>
    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {subtitle}
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  tone?: "default" | "warn";
}> = ({ label, value, tone = "default" }) => (
  <div
    className={`rounded-2xl border p-4 ${
      tone === "warn" ?
        "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    }`}>
    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {label}
    </div>
    <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
      {value}
    </div>
  </div>
);

export const ProcurementModulePage: React.FC<ProcurementModulePageProps> = ({
  activeSubTab,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // user identity is not passed yet from AppShell; using placeholder until wired.
  vendors,
  requisitions,
  quotations,
  purchaseOrders,
  grns,
  onVendorsChange,
  onRequisitionsChange,
  onQuotationsChange,
  onPurchaseOrdersChange,
  onGrnsChange,
}) => {
  const [vendorForm, setVendorForm] = useState({
    name: "",
    category: "Medical Supplies",
    credentialRef: "",
    nameAsPerPan: "",
    contact: "",
    email: "",
    validTill: "",
    status: "Active" as VendorRecord["status"],
  });
  const [prForm, setPrForm] = useState({
    itemSummary: "",
    program: "",
    fundCode: "",
    amount: "",
    budgetAvailable: "",
    requestedBy: "",
  });
  const [quoteWorkflowReqId, setQuoteWorkflowReqId] = useState("");
  const [quoteUploads, setQuoteUploads] = useState<
    Array<{
      id: number;
      vendorId: string;
      file: File | null;
      remarks: string;
    }>
  >([{ id: Date.now(), vendorId: "", file: null, remarks: "" }]);
  const [isExtractingQuotes, setIsExtractingQuotes] = useState(false);
  const [aiShortlistReqId, setAiShortlistReqId] = useState("");
  const [aiTopThreeIds, setAiTopThreeIds] = useState<number[]>([]);
  const [aiError, setAiError] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiScoreByQuote, setAiScoreByQuote] = useState<
    Record<
      number,
      {
        total: number;
        cost: number;
        delivery: number;
        quality: number;
        invoice: number;
      }
    >
  >({});
  const [checkerRemarksByReq, setCheckerRemarksByReq] = useState<Record<number, string>>(
    {},
  );
  const [poForm, setPoForm] = useState({
    requisitionId: "",
    vendorId: "",
    quoteId: "",
    fundCode: "",
    quantity: "",
    poAmount: "",
    deliveryDue: "",
    terms: "Standard NGO procurement terms and payment on verified delivery.",
  });
  const [grnForm, setGrnForm] = useState({
    poId: "",
    receivedQty: "",
    invoiceAmount: "",
    receivedOn: todayIso(),
    qualityStatus: "Accepted" as GrnRecord["qualityStatus"],
    discrepancyNote: "",
  });

  const requisitionById = useMemo(
    () => new Map(requisitions.map((item) => [item.id, item])),
    [requisitions],
  );
  const vendorById = useMemo(
    () => new Map(vendors.map((item) => [item.id, item])),
    [vendors],
  );
  const quoteById = useMemo(
    () => new Map(quotations.map((item) => [item.id, item])),
    [quotations],
  );
  const poById = useMemo(
    () => new Map(purchaseOrders.map((item) => [item.id, item])),
    [purchaseOrders],
  );

  const addVendor = () => {
    if (!vendorForm.name.trim()) return;
    const next: VendorRecord = {
      id: Date.now(),
      name: vendorForm.name.trim(),
      category: vendorForm.category,
      credentialRef: vendorForm.credentialRef.trim(),
      nameAsPerPan: vendorForm.name.trim(),
      contact: vendorForm.contact.trim(),
      email: vendorForm.email.trim(),
      validTill: vendorForm.validTill,
      status: vendorForm.status,
    };
    onVendorsChange([next, ...vendors]);
    setVendorForm({
      name: "",
      category: "Medical Supplies",
      credentialRef: "",
      nameAsPerPan: "",
      contact: "",
      email: "",
      validTill: "",
      status: "Active",
    });
  };

  const addRequisition = () => {
    if (!prForm.itemSummary.trim()) return;
    const amount = Number(prForm.amount || 0);
    const budgetAvailable = Number(prForm.budgetAvailable || 0);
    const budgetCheck: RequisitionRecord["budgetCheck"] =
      amount <= budgetAvailable ? "Pass" : "Fail";
    const next: RequisitionRecord = {
      id: Date.now(),
      requisitionNo: `PR-${Date.now().toString().slice(-6)}`,
      itemSummary: prForm.itemSummary.trim(),
      program: prForm.program.trim() || "General Program",
      fundCode: prForm.fundCode.trim() || "GEN-FUND",
      amount,
      budgetAvailable,
      requestedBy: prForm.requestedBy.trim() || "Program Team",
      createdOn: todayIso(),
      status: budgetCheck === "Pass" ? "Submitted" : "Draft",
      budgetCheck,
    };
    onRequisitionsChange([next, ...requisitions]);
    setPrForm({
      itemSummary: "",
      program: "",
      fundCode: "",
      amount: "",
      budgetAvailable: "",
      requestedBy: "",
    });
  };

  const updateRequisitionStatus = (
    id: number,
    status: RequisitionRecord["status"],
  ) => {
    onRequisitionsChange(
      requisitions.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  const extractQuotationFileWithAi = async (file: File) => {
    const formData = new FormData();
    formData.append("pdf", file);
    const response = await fetch(
      `/api/extract-procurement-quotation?t=${Date.now()}`,
      {
        method: "POST",
        body: formData,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to read quotation");
    }
    return response.json();
  };

  const addQuotationUploadRow = () => {
    setQuoteUploads((prev) => [
      ...prev,
      { id: Date.now() + prev.length, vendorId: "", file: null, remarks: "" },
    ]);
  };

  const updateQuotationUploadRow = (
    rowId: number,
    key: "vendorId" | "file" | "remarks",
    value: string | File | null,
  ) => {
    setQuoteUploads((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  };

  const runBatchInvoiceReadAndShortlist = async () => {
    const requisitionId = Number(quoteWorkflowReqId || 0);
    if (!requisitionId) {
      setAiError("Select a requisition first.");
      return;
    }
    const validRows = quoteUploads.filter((row) => row.file && row.vendorId);
    if (validRows.length < 3) {
      setAiError("Upload at least 3 quotation files with vendor mapping.");
      return;
    }

    setAiError("");
    setIsExtractingQuotes(true);
    try {
      const newQuotes: QuotationRecord[] = [];
      for (const row of validRows) {
        const extracted = await extractQuotationFileWithAi(row.file as File);
        const quoteAmount =
          Number(extracted.quoteAmount) ||
          Number(extracted.grossAmount) ||
          Number(extracted.totalAmount) ||
          0;
        const deliveryDays = Number(extracted.deliveryDays) || 15;
        const qualityScore = Number(extracted.qualityScore) || 7;
        const invoiceRef =
          String(extracted.invoiceRef || extracted.invoiceNumber || "").trim();
        const aiExtractSummary = String(
          extracted.summary ||
            extracted.keyCommercialTerms ||
            extracted.description ||
            "",
        ).trim();
        newQuotes.push({
          id: Date.now() + newQuotes.length,
          requisitionId,
          vendorId: Number(row.vendorId),
          quoteAmount,
          deliveryDays,
          qualityScore,
          invoiceRef,
          aiExtractSummary,
          sourceFileName: row.file?.name || "",
          selectedByUser: false,
          makerSelectedBy: "",
          aiReason: "",
          committeeDecision: "Pending",
          checkerStatus: "Pending",
          checkerBy: "",
          checkerOn: "",
          checkerRemarks: "",
          remarks: row.remarks || "",
        });
      }

      const nextQuotes = [...newQuotes, ...quotations];
      onQuotationsChange(nextQuotes);
      setAiShortlistReqId(String(requisitionId));
      setAiSummary(
        "AI read completed for uploaded quotations. Ranking generated by weighted factors.",
      );
      setQuoteUploads([{ id: Date.now(), vendorId: "", file: null, remarks: "" }]);

      // Re-run shortlist against merged quote list.
      const candidates = nextQuotes.filter((item) => item.requisitionId === requisitionId);
      if (candidates.length >= 3) {
        const costs = candidates.map((item) => item.quoteAmount);
        const deliveries = candidates.map((item) => item.deliveryDays);
        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const minDelivery = Math.min(...deliveries);
        const maxDelivery = Math.max(...deliveries);
        const normalizeDescending = (value: number, min: number, max: number) => {
          if (max === min) return 1;
          return (max - value) / (max - min);
        };
        const scored = candidates.map((item) => {
          const cost = normalizeDescending(item.quoteAmount, minCost, maxCost);
          const delivery = normalizeDescending(item.deliveryDays, minDelivery, maxDelivery);
          const quality = Math.max(0, Math.min(10, item.qualityScore)) / 10;
          const invoice = item.invoiceRef || item.aiExtractSummary ? 1 : 0.2;
          const total = 0.45 * cost + 0.25 * delivery + 0.2 * quality + 0.1 * invoice;
          return { item, cost, delivery, quality, invoice, total };
        });
        scored.sort((a, b) => b.total - a.total);
        const topThree = scored.slice(0, 3);
        const rankMap = new Map(topThree.map((row, idx) => [row.item.id, idx + 1]));
        const scoreMap = new Map(topThree.map((row) => [row.item.id, row.total]));
        const reasonMap = new Map(
          topThree.map((row) => [
            row.item.id,
            `Cost ${Math.round(row.cost * 100)} | Delivery ${Math.round(
              row.delivery * 100,
            )} | Quality ${Math.round(row.quality * 100)} | Invoice ${Math.round(
              row.invoice * 100,
            )}`,
          ]),
        );
        const persistedQuotes = nextQuotes.map((item) =>
          item.requisitionId !== requisitionId
            ? item
            : {
                ...item,
                rankOrder: rankMap.get(item.id),
                aiScore: scoreMap.get(item.id),
                aiReason: reasonMap.get(item.id) || item.aiReason,
                quotesReceivedForRequisition: candidates.length,
              },
        );
        onQuotationsChange(persistedQuotes);
        setAiTopThreeIds(topThree.map((row) => row.item.id));
        setAiScoreByQuote(
          topThree.reduce(
            (acc, row) => ({
              ...acc,
              [row.item.id]: {
                total: row.total,
                cost: row.cost,
                delivery: row.delivery,
                quality: row.quality,
                invoice: row.invoice,
              },
            }),
            {},
          ),
        );
      }
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "Failed to process uploaded files",
      );
    } finally {
      setIsExtractingQuotes(false);
    }
  };

  const selectAiWinner = (quoteId: number) => {
    const selected = quoteById.get(quoteId);
    if (!selected) return;
    const quotesReceived = quotations.filter(
      (item) => item.requisitionId === selected.requisitionId,
    ).length;
    const now = todayIso();
    onQuotationsChange(
      quotations.map((item) =>
        item.requisitionId !== selected.requisitionId
          ? item
          : {
              ...item,
              selectedByUser: item.id === quoteId,
              makerSelectedBy: item.id === quoteId ? "Maker" : item.makerSelectedBy,
              selectedOn: item.id === quoteId ? now : item.selectedOn,
              quotesReceivedForRequisition:
                item.id === quoteId ? quotesReceived : item.quotesReceivedForRequisition,
              checkerStatus: item.id === quoteId ? "Pending" : item.checkerStatus,
              checkerBy: item.id === quoteId ? "" : item.checkerBy,
              checkerOn: item.id === quoteId ? "" : item.checkerOn,
              checkerRemarks: item.id === quoteId ? "" : item.checkerRemarks,
              committeeDecision: item.id === quoteId ? "Pending" : item.committeeDecision,
            },
      ),
    );
  };

  const approveMakerSelection = (requisitionId: number) => {
    const now = todayIso();
    const remarks = checkerRemarksByReq[requisitionId] || "";
    onQuotationsChange(
      quotations.map((item) =>
        item.requisitionId !== requisitionId
          ? item
          : item.selectedByUser
            ? {
                ...item,
                checkerStatus: "Approved",
                checkerBy: "Approver",
                checkerOn: now,
                checkerRemarks: remarks,
                committeeDecision: "Approved",
              }
            : item,
      ),
    );
  };

  const rejectMakerSelection = (requisitionId: number) => {
    const now = todayIso();
    const remarks = checkerRemarksByReq[requisitionId] || "";
    onQuotationsChange(
      quotations.map((item) =>
        item.requisitionId !== requisitionId
          ? item
          : item.selectedByUser
            ? {
                ...item,
                selectedByUser: false,
                checkerStatus: "Rejected",
                checkerBy: "Approver",
                checkerOn: now,
                checkerRemarks: remarks,
                committeeDecision: "Rejected",
              }
            : item,
      ),
    );
  };

  const addPurchaseOrder = () => {
    const requisitionId = Number(poForm.requisitionId || 0);
    const vendorId = Number(poForm.vendorId || 0);
    if (!requisitionId || !vendorId) return;
    const next: PurchaseOrderRecord = {
      id: Date.now(),
      poNo: `PO-${Date.now().toString().slice(-6)}`,
      requisitionId,
      vendorId,
      quoteId: poForm.quoteId ? Number(poForm.quoteId) : null,
      fundCode: poForm.fundCode.trim() || "GEN-FUND",
      quantity: Number(poForm.quantity || 0),
      poAmount: Number(poForm.poAmount || 0),
      deliveryDue: poForm.deliveryDue,
      terms: poForm.terms.trim(),
      status: "Issued",
    };
    onPurchaseOrdersChange([next, ...purchaseOrders]);
    setPoForm({
      requisitionId: "",
      vendorId: "",
      quoteId: "",
      fundCode: "",
      quantity: "",
      poAmount: "",
      deliveryDue: "",
      terms: "Standard NGO procurement terms and payment on verified delivery.",
    });
  };

  const updatePoStatus = (
    id: number,
    status: PurchaseOrderRecord["status"],
  ) => {
    onPurchaseOrdersChange(
      purchaseOrders.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    );
  };

  const addGrn = () => {
    const poId = Number(grnForm.poId || 0);
    if (!poId) return;
    const po = poById.get(poId);
    if (!po) return;
    const receivedQty = Number(grnForm.receivedQty || 0);
    const invoiceAmount = Number(grnForm.invoiceAmount || 0);
    const mismatch =
      receivedQty !== po.quantity || Math.abs(invoiceAmount - po.poAmount) > 0;
    const next: GrnRecord = {
      id: Date.now(),
      grnNo: `GRN-${Date.now().toString().slice(-6)}`,
      poId,
      receivedQty,
      invoiceAmount,
      receivedOn: grnForm.receivedOn,
      qualityStatus: grnForm.qualityStatus,
      discrepancyNote: grnForm.discrepancyNote.trim(),
      matchStatus: mismatch ? "Mismatch" : "Matched",
    };
    onGrnsChange([next, ...grns]);
    if (!mismatch) {
      updatePoStatus(po.id, "Closed");
    } else if (po.status === "Issued") {
      updatePoStatus(po.id, "Partially Received");
    }
    setGrnForm({
      poId: "",
      receivedQty: "",
      invoiceAmount: "",
      receivedOn: todayIso(),
      qualityStatus: "Accepted",
      discrepancyNote: "",
    });
  };

  const pendingApprovals =
    requisitions.filter((item) => item.status === "Submitted").length +
    quotations.filter((item) => item.committeeDecision === "Pending").length;
  const expiringVendors = vendors.filter(
    (item) => item.status === "Active" && daysUntil(item.validTill) <= 30,
  ).length;
  const delayedDeliveries = purchaseOrders.filter(
    (item) =>
      item.status !== "Closed" &&
      item.deliveryDue &&
      daysUntil(item.deliveryDue) < 0,
  ).length;
  const mismatchAlerts = grns.filter(
    (item) => item.matchStatus === "Mismatch",
  ).length;

  if (activeSubTab === "Vendor Empanelment") {
    return (
      <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
        <SectionCard
          title="Vendor Empanelment"
          subtitle="Create New Vendors and maintain an Approved Vendor Registry with renewal tracking.">
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Vendor name"
              value={vendorForm.name}
              onChange={(e) =>
                setVendorForm({ ...vendorForm, name: e.target.value })
              }
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={vendorForm.category}
              onChange={(e) =>
                setVendorForm({ ...vendorForm, category: e.target.value })
              }>
              <option>Medical Supplies</option>
              <option>Education Materials</option>
              <option>Nutrition & Food</option>
              <option>Logistics</option>
              <option>Consulting Services</option>
            </select>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  PAN NO
                </span>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[10px] font-black uppercase tracking-widest text-brand-600 underline underline-offset-2"
                >
                  Verify PAN
                </a>
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="PAN NO"
                value={vendorForm.credentialRef}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, credentialRef: e.target.value })
                }
              />
            </div>
            <input
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
              placeholder="Name as per PAN"
              value={vendorForm.name}
              readOnly
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Contact number"
              value={vendorForm.contact}
              onChange={(e) =>
                setVendorForm({ ...vendorForm, contact: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Email"
              value={vendorForm.email}
              onChange={(e) =>
                setVendorForm({ ...vendorForm, email: e.target.value })
              }
            />
            <CompactDatePicker
              value={vendorForm.validTill}
              onChange={(value) =>
                setVendorForm({ ...vendorForm, validTill: value })
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={vendorForm.status}
              onChange={(e) =>
                setVendorForm({
                  ...vendorForm,
                  status: e.target.value as VendorRecord["status"],
                })
              }>
              <option>Active</option>
              <option>Pending Renewal</option>
              <option>Suspended</option>
            </select>
            <button
              onClick={addVendor}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
              Add Vendor
            </button>
          </div>
        </SectionCard>
        <SectionCard
          title="Approved Vendor Registry"
          subtitle="Renewal-aware list for audit and sourcing.">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2">Vendor</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Credentials</th>
                  <th className="py-2">Valid Till</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((item) => {
                  const dueIn = daysUntil(item.validTill);
                  const isExpiring = dueIn <= 30;
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 dark:border-slate-700">
                      <td className="py-2 font-semibold">{item.name}</td>
                      <td className="py-2">{item.category}</td>
                      <td className="py-2">{item.credentialRef || "-"}</td>
                      <td className="py-2">{item.validTill || "-"}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            isExpiring ?
                              "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                          }`}>
                          {isExpiring ?
                            `Renew in ${Math.max(dueIn, 0)}d`
                          : item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (activeSubTab === "Purchase Requisitions") {
    return (
      <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
        <SectionCard
          title="Purchase Requisitions"
          subtitle="Raise and route requests with budget checks before approval.">
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Item/requirement summary"
              value={prForm.itemSummary}
              onChange={(e) =>
                setPrForm({ ...prForm, itemSummary: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Program/Project"
              value={prForm.program}
              onChange={(e) =>
                setPrForm({ ...prForm, program: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Fund code"
              value={prForm.fundCode}
              onChange={(e) =>
                setPrForm({ ...prForm, fundCode: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Requested amount"
              type="number"
              value={prForm.amount}
              onChange={(e) => setPrForm({ ...prForm, amount: e.target.value })}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Budget available"
              type="number"
              value={prForm.budgetAvailable}
              onChange={(e) =>
                setPrForm({ ...prForm, budgetAvailable: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Requested by"
              value={prForm.requestedBy}
              onChange={(e) =>
                setPrForm({ ...prForm, requestedBy: e.target.value })
              }
            />
          </div>
          <div className="mt-2">
            <button
              onClick={addRequisition}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
              Raise Requisition
            </button>
          </div>
        </SectionCard>
        <SectionCard
          title="Approval Queue"
          subtitle="Budget-pass requests can move to approval.">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2">PR No</th>
                  <th className="py-2">Program</th>
                  <th className="py-2">Fund</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Budget Check</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-2 font-semibold">{item.requisitionNo}</td>
                    <td className="py-2">{item.program}</td>
                    <td className="py-2">{item.fundCode}</td>
                    <td className="py-2">{fmtCurrency(item.amount)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          item.budgetCheck === "Pass" ?
                            "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                        }`}>
                        {item.budgetCheck}
                      </span>
                    </td>
                    <td className="py-2">{item.status}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          disabled={item.budgetCheck !== "Pass"}
                          onClick={() =>
                            updateRequisitionStatus(item.id, "Approved")
                          }
                          className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50">
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            updateRequisitionStatus(item.id, "Rejected")
                          }
                          className="rounded bg-rose-600 px-2 py-1 text-xs font-bold text-white">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (activeSubTab === "Quotation Comparison") {
    const selectedReqId = Number(quoteWorkflowReqId || aiShortlistReqId || 0);
    const quotesForReq = quotations.filter(
      (item) => item.requisitionId === selectedReqId,
    );
    const topThreeQuotes = aiTopThreeIds
      .map((id) => quoteById.get(id))
      .filter((item): item is QuotationRecord => Boolean(item));
    const selectedQuote = quotesForReq.find((item) => item.selectedByUser);

    return (
      <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
        <SectionCard
          title="Quotation Comparison"
          subtitle="Select requisition, upload 3+ quotation files, run AI read, and shortlist top 3 for final user selection.">
          <div className="grid gap-2 md:grid-cols-2">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={quoteWorkflowReqId}
              onChange={(e) => {
                setQuoteWorkflowReqId(e.target.value);
                setAiShortlistReqId(e.target.value);
                setAiTopThreeIds([]);
                setAiSummary("");
                setAiError("");
              }}>
              <option value="">Select requisition</option>
              {requisitions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.requisitionNo} - {item.itemSummary}
                </option>
              ))}
            </select>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              Quotes Received (Audit): {selectedReqId ? quotesForReq.length : 0}
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {quoteUploads.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Quotation File {index + 1}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={row.vendorId}
                    onChange={(e) =>
                      updateQuotationUploadRow(row.id, "vendorId", e.target.value)
                    }>
                    <option value="">Select vendor</option>
                    {vendors
                      .filter((item) => item.status !== "Suspended")
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) =>
                      updateQuotationUploadRow(
                        row.id,
                        "file",
                        e.target.files?.[0] || null,
                      )
                    }
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-100 file:text-brand-700 file:font-bold"
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Remarks (optional)"
                    value={row.remarks}
                    onChange={(e) =>
                      updateQuotationUploadRow(row.id, "remarks", e.target.value)
                    }
                  />
                </div>
                {row.file && (
                  <div className="mt-2 text-xs font-medium text-slate-600">
                    File: {row.file.name}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={addQuotationUploadRow}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              Add Another Quotation File
            </button>
            <button
              type="button"
              onClick={runBatchInvoiceReadAndShortlist}
              disabled={isExtractingQuotes}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isExtractingQuotes ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Extracting data from quotation files...
                </>
              ) : (
                <>
                  <span>AI</span>
                  Use AI to read this file
                </>
              )}
            </button>
          </div>
          {aiError && (
            <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {aiError}
            </div>
          )}
          {aiSummary && (
            <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
              {aiSummary}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Top 3 Side-by-Side"
          subtitle="System rank order based on cost, delivery, previous quality, and invoice completeness.">
          {topThreeQuotes.length === 0 ? (
            <div className="text-sm text-slate-500">
              Upload quotations and click AI read to generate top 3.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {topThreeQuotes.map((item, index) => {
                const score = aiScoreByQuote[item.id];
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Rank #{index + 1}
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-900">
                      {vendorById.get(item.vendorId)?.name || "-"}
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Cost: {fmtCurrency(item.quoteAmount)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Delivery: {item.deliveryDays} days
                    </div>
                    <div className="text-xs text-slate-600">
                      Previous quality: {item.qualityScore}/10
                    </div>
                    <div className="text-xs text-slate-600">
                      Invoice: {item.invoiceRef || item.sourceFileName || "-"}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-brand-700">
                      Score: {((score?.total || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => selectAiWinner(item.id)}
                        className={`rounded px-3 py-1.5 text-xs font-bold text-white ${
                          item.selectedByUser ? "bg-emerald-700" : "bg-emerald-600"
                        }`}>
                        {item.selectedByUser ? "Selected by User" : "Select This Quote"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Quotation Audit Trail"
          subtitle="Stores all quotes received for each requisition and final selection details for audit.">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2">Requisition</th>
                  <th className="py-2">Vendor</th>
                  <th className="py-2">Source File</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Delivery</th>
                  <th className="py-2">Rank</th>
                  <th className="py-2">Selected</th>
                  <th className="py-2">Checker Status</th>
                  <th className="py-2">Quotes Received</th>
                </tr>
              </thead>
              <tbody>
                {quotations
                  .filter((item) =>
                    selectedReqId ? item.requisitionId === selectedReqId : true,
                  )
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 dark:border-slate-700">
                      <td className="py-2">
                        {requisitionById.get(item.requisitionId)?.requisitionNo || "-"}
                      </td>
                      <td className="py-2">{vendorById.get(item.vendorId)?.name || "-"}</td>
                      <td className="py-2">{item.sourceFileName || "-"}</td>
                      <td className="py-2">{fmtCurrency(item.quoteAmount)}</td>
                      <td className="py-2">{item.deliveryDays} days</td>
                      <td className="py-2">{item.rankOrder ? `#${item.rankOrder}` : "-"}</td>
                      <td className="py-2">{item.selectedByUser ? "Yes" : "No"}</td>
                      <td className="py-2">{item.checkerStatus || "Pending"}</td>
                      <td className="py-2">
                        {item.quotesReceivedForRequisition ||
                          quotations.filter(
                            (q) => q.requisitionId === item.requisitionId,
                          ).length}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {selectedQuote && (
            <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Selected quote: {vendorById.get(selectedQuote.vendorId)?.name || "-"} for{" "}
              {requisitionById.get(selectedQuote.requisitionId)?.requisitionNo || "-"} on{" "}
              {selectedQuote.selectedOn || todayIso()}.
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  if (activeSubTab === "Approve Quotation") {
    const approverRequisitionIds: number[] = Array.from(
      new Set<number>(
        quotations
          .filter((item) => item.selectedByUser && item.checkerStatus !== "Approved")
          .map((item) => item.requisitionId),
      ),
    );

    return (
      <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
        <SectionCard
          title="Approve Quotation"
          subtitle="Approver view of maker-selected quotations with top 3, all options, reasons, and final approve/reject action.">
          {approverRequisitionIds.length === 0 ? (
            <div className="text-sm text-slate-500">
              No quotations are pending checker approval.
            </div>
          ) : (
            <div className="space-y-4">
              {approverRequisitionIds.map((reqId) => {
                const reqQuotes = quotations
                  .filter((item) => item.requisitionId === reqId)
                  .sort((a, b) => (a.rankOrder || 99) - (b.rankOrder || 99));
                const reqTopThree = reqQuotes.filter(
                  (item) => (item.rankOrder || 0) > 0 && (item.rankOrder || 0) <= 3,
                );
                const makerSelected = reqQuotes.find((item) => item.selectedByUser);

                return (
                  <div
                    key={reqId}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-sm font-black text-slate-800">
                      {requisitionById.get(reqId)?.requisitionNo || "Requisition"} - Pending Approval
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Maker selected: {vendorById.get(makerSelected?.vendorId || 0)?.name || "-"} | Quotes received: {reqQuotes.length}
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                        Top 3 with reasons
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        {reqTopThree.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-lg border p-3 ${
                              item.selectedByUser
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-slate-200 bg-white"
                            }`}>
                            <div className="text-xs font-black text-slate-600">
                              Rank #{item.rankOrder}
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                              {vendorById.get(item.vendorId)?.name || "-"}
                            </div>
                            <div className="text-xs text-slate-600">
                              Cost: {fmtCurrency(item.quoteAmount)}
                            </div>
                            <div className="text-xs text-slate-600">
                              Delivery: {item.deliveryDays} days
                            </div>
                            <div className="text-xs text-slate-600">
                              Quality: {item.qualityScore}/10
                            </div>
                            <div className="mt-1 text-[11px] text-brand-700 font-semibold">
                              Reason: {item.aiReason || "Ranked by weighted score"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                        All options
                      </div>
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                              <th className="py-2">Vendor</th>
                              <th className="py-2">Amount</th>
                              <th className="py-2">Delivery</th>
                              <th className="py-2">Quality</th>
                              <th className="py-2">Rank</th>
                              <th className="py-2">Maker Pick</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reqQuotes.map((item) => (
                              <tr
                                key={item.id}
                                className="border-t border-slate-200 dark:border-slate-700">
                                <td className="py-2">{vendorById.get(item.vendorId)?.name || "-"}</td>
                                <td className="py-2">{fmtCurrency(item.quoteAmount)}</td>
                                <td className="py-2">{item.deliveryDays} days</td>
                                <td className="py-2">{item.qualityScore}/10</td>
                                <td className="py-2">{item.rankOrder ? `#${item.rankOrder}` : "-"}</td>
                                <td className="py-2">{item.selectedByUser ? "Yes" : "No"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                        placeholder="Approver remarks"
                        value={checkerRemarksByReq[reqId] || ""}
                        onChange={(e) =>
                          setCheckerRemarksByReq((prev) => ({
                            ...prev,
                            [reqId]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMakerSelection(reqId)}
                          className="rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMakerSelection(reqId)}
                          className="rounded bg-rose-600 px-3 py-2 text-xs font-bold text-white">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  if (activeSubTab === "Purchase Orders") {
    const approvedQuotes = quotations.filter(
      (item) => item.committeeDecision === "Approved",
    );
    return (
      <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
        <SectionCard
          title="Purchase Orders"
          subtitle="Generate POs linked to requisitions, fund codes, and delivery commitments.">
          <div className="grid gap-2 md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={poForm.requisitionId}
              onChange={(e) => {
                const reqId = Number(e.target.value || 0);
                const req = requisitionById.get(reqId);
                setPoForm({
                  ...poForm,
                  requisitionId: e.target.value,
                  fundCode: req?.fundCode || poForm.fundCode,
                });
              }}>
              <option value="">Approved requisition</option>
              {requisitions
                .filter((item) => item.status === "Approved")
                .map((item) => (
                  <option
                    key={item.id}
                    value={item.id}>
                    {item.requisitionNo}
                  </option>
                ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={poForm.vendorId}
              onChange={(e) =>
                setPoForm({ ...poForm, vendorId: e.target.value })
              }>
              <option value="">Vendor</option>
              {vendors
                .filter((item) => item.status === "Active")
                .map((item) => (
                  <option
                    key={item.id}
                    value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={poForm.quoteId}
              onChange={(e) =>
                setPoForm({ ...poForm, quoteId: e.target.value })
              }>
              <option value="">Approved quote (optional)</option>
              {approvedQuotes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}>
                  {requisitionById.get(item.requisitionId)?.requisitionNo ||
                    "PR"}{" "}
                  - {vendorById.get(item.vendorId)?.name || "Vendor"} -{" "}
                  {fmtCurrency(item.quoteAmount)}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Fund code"
              value={poForm.fundCode}
              onChange={(e) =>
                setPoForm({ ...poForm, fundCode: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              placeholder="Quantity"
              value={poForm.quantity}
              onChange={(e) =>
                setPoForm({ ...poForm, quantity: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              placeholder="PO amount"
              value={poForm.poAmount}
              onChange={(e) =>
                setPoForm({ ...poForm, poAmount: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              placeholder="Terms"
              value={poForm.terms}
              onChange={(e) => setPoForm({ ...poForm, terms: e.target.value })}
            />
            <CompactDatePicker
              value={poForm.deliveryDue}
              onChange={(value) =>
                setPoForm({ ...poForm, deliveryDue: value })
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-2">
            <button
              onClick={addPurchaseOrder}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
              Generate PO
            </button>
          </div>
        </SectionCard>
        <SectionCard
          title="PO Register"
          subtitle="Track issuance, delivery commitment, and closure.">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2">PO</th>
                  <th className="py-2">Vendor</th>
                  <th className="py-2">Fund</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Due</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((item) => {
                  const isDelayed =
                    item.status !== "Closed" &&
                    item.deliveryDue &&
                    daysUntil(item.deliveryDue) < 0;
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 dark:border-slate-700">
                      <td className="py-2 font-semibold">{item.poNo}</td>
                      <td className="py-2">
                        {vendorById.get(item.vendorId)?.name || "-"}
                      </td>
                      <td className="py-2">{item.fundCode}</td>
                      <td className="py-2">{fmtCurrency(item.poAmount)}</td>
                      <td className="py-2">
                        <span
                          className={
                            isDelayed ? "text-rose-600 font-semibold" : ""
                          }>
                          {item.deliveryDue || "-"}
                        </span>
                      </td>
                      <td className="py-2">{item.status}</td>
                      <td className="py-2">
                        <button
                          onClick={() => updatePoStatus(item.id, "Closed")}
                          className="rounded bg-slate-700 px-2 py-1 text-xs font-bold text-white">
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (activeSubTab === "Delivery & GRN Tracking") {
    return (
      <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
        <SectionCard
          title="Delivery & GRN Tracking"
          subtitle="Capture receipts and flag PO-GRN-invoice mismatches for three-way matching.">
          <div className="grid gap-2 md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={grnForm.poId}
              onChange={(e) =>
                setGrnForm({ ...grnForm, poId: e.target.value })
              }>
              <option value="">Select PO</option>
              {purchaseOrders.map((item) => (
                <option
                  key={item.id}
                  value={item.id}>
                  {item.poNo} -{" "}
                  {vendorById.get(item.vendorId)?.name || "Vendor"}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              placeholder="Received quantity"
              value={grnForm.receivedQty}
              onChange={(e) =>
                setGrnForm({ ...grnForm, receivedQty: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              placeholder="Invoice amount"
              value={grnForm.invoiceAmount}
              onChange={(e) =>
                setGrnForm({ ...grnForm, invoiceAmount: e.target.value })
              }
            />
            <CompactDatePicker
              value={grnForm.receivedOn}
              onChange={(value) =>
                setGrnForm({ ...grnForm, receivedOn: value })
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={grnForm.qualityStatus}
              onChange={(e) =>
                setGrnForm({
                  ...grnForm,
                  qualityStatus: e.target.value as GrnRecord["qualityStatus"],
                })
              }>
              <option>Accepted</option>
              <option>Partial</option>
              <option>Rejected</option>
            </select>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Discrepancy note"
              value={grnForm.discrepancyNote}
              onChange={(e) =>
                setGrnForm({ ...grnForm, discrepancyNote: e.target.value })
              }
            />
          </div>
          <div className="mt-2">
            <button
              onClick={addGrn}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
              Record GRN
            </button>
          </div>
        </SectionCard>
        <SectionCard
          title="GRN & Match Status"
          subtitle="Three-way match status for finance validation.">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2">GRN</th>
                  <th className="py-2">PO</th>
                  <th className="py-2">Qty (Rec/Ord)</th>
                  <th className="py-2">Amount (Inv/PO)</th>
                  <th className="py-2">Quality</th>
                  <th className="py-2">Match</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((item) => {
                  const po = poById.get(item.poId);
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 dark:border-slate-700">
                      <td className="py-2 font-semibold">{item.grnNo}</td>
                      <td className="py-2">{po?.poNo || "-"}</td>
                      <td className="py-2">
                        {item.receivedQty}/{po?.quantity || 0}
                      </td>
                      <td className="py-2">
                        {fmtCurrency(item.invoiceAmount)} /{" "}
                        {fmtCurrency(po?.poAmount || 0)}
                      </td>
                      <td className="py-2">{item.qualityStatus}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            item.matchStatus === "Matched" ?
                              "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                          }`}>
                          {item.matchStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals}
        />
        <StatCard
          label="Expiring Vendors (30d)"
          value={expiringVendors}
          tone="warn"
        />
        <StatCard
          label="Delayed Deliveries"
          value={delayedDeliveries}
          tone="warn"
        />
        <StatCard
          label="Mismatch Alerts"
          value={mismatchAlerts}
          tone="warn"
        />
      </div>
      <SectionCard
        title="Operational Alerts"
        subtitle="Priority exceptions requiring action.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Expiring Vendors
            </div>
            <div className="mt-2 space-y-2">
              {vendors
                .filter(
                  (item) =>
                    item.status === "Active" && daysUntil(item.validTill) <= 30,
                )
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {item.name} expires on {item.validTill || "N/A"}
                  </div>
                ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Three-Way Mismatch Queue
            </div>
            <div className="mt-2 space-y-2">
              {grns
                .filter((item) => item.matchStatus === "Mismatch")
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {item.grnNo} vs {poById.get(item.poId)?.poNo || "PO"} (
                    {item.discrepancyNote ||
                      "Review quantity/amount difference"}
                    )
                  </div>
                ))}
            </div>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title="Pipeline Snapshot"
        subtitle="Approved PRs, quotes, and PO conversion status.">
        <div className="text-sm text-slate-700 dark:text-slate-300">
          Approved requisitions:{" "}
          <span className="font-bold">
            {requisitions.filter((item) => item.status === "Approved").length}
          </span>
          {" | "}Approved quotations:{" "}
          <span className="font-bold">
            {
              quotations.filter((item) => item.committeeDecision === "Approved")
                .length
            }
          </span>
          {" | "}Issued purchase orders:{" "}
          <span className="font-bold">
            {purchaseOrders.filter((item) => item.status !== "Closed").length}
          </span>
        </div>
      </SectionCard>
    </div>
  );
};
