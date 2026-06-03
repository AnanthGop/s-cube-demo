import React, { useMemo, useState } from "react";

interface RentRecord {
  landlordName?: string;
  centre?: string;
  startDate?: string;
  endDate?: string;
  currentRent?: number;
  status?: string;
}

interface CoaGroup {
  name?: string;
  ledgers?: string[];
}

interface CoaMaster {
  master?: string;
  groups?: CoaGroup[];
}

interface LandlordMapping {
  landlordName: string;
  ledgerName: string;
  mappedOn: string;
}

interface TdsAccountMapping {
  accountName?: string;
  type?: string;
  section?: string;
  rate?: number;
  appliedOn?: string;
}

interface TdsRuleItem {
  fy?: string;
  type?: string;
  section?: string;
  rate?: number;
  status?: string;
}

interface MapExpensesPageProps {
  themeColor?: string;
  rentRecords?: RentRecord[];
  chartOfAccounts?: CoaMaster[];
  tdsRules?: TdsRuleItem[];
  journalVoucherMappings?: LandlordMapping[];
  tdsAccountMappings?: TdsAccountMapping[];
  onUpdateJournalVoucherMappings?: (
    nextData: LandlordMapping[],
  ) => void | Promise<void>;
  onUpdateTdsAccountMappings?: (
    nextData: TdsAccountMapping[],
  ) => void | Promise<void>;
  onBackToLanding?: () => void;
}

export const MapExpensesPage: React.FC<MapExpensesPageProps> = ({
  themeColor = "indigo-600",
  rentRecords = [],
  chartOfAccounts = [],
  tdsRules = [],
  journalVoucherMappings = [],
  tdsAccountMappings = [],
  onUpdateJournalVoucherMappings,
  onUpdateTdsAccountMappings,
  onBackToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<"entries" | "tds">("entries");
  const [selectedTdsRuleIndex, setSelectedTdsRuleIndex] = useState("");
  const [expenseVoucherTdsEnabled, setExpenseVoucherTdsEnabled] =
    useState(true);

  // Journal Entry configuration states
  const [editingVoucherType, setEditingVoucherType] = useState<string>("");
  const [selectedMaster, setSelectedMaster] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedLedger, setSelectedLedger] = useState("");
  const [selectedLandlordDetail, setSelectedLandlordDetail] = useState("");
  const [selectedEntryType, setSelectedEntryType] = useState("Debit");
  const [selectedVoucherType, setSelectedVoucherType] =
    useState("Expense Voucher");
  const [showTds, setShowTds] = useState(true);

  // Store journal entry configurations
  const [journalEntryConfigs, setJournalEntryConfigs] = useState<{
    expenseVoucher: Array<{
      ledger: string;
      landlord: string;
      type: string;
      showTds: boolean;
    }>;
    paymentVoucher: Array<{
      ledger: string;
      landlord: string;
      type: string;
      showTds: boolean;
    }>;
  }>({
    expenseVoucher: [
      {
        ledger: "Rent",
        landlord: "",
        type: "Debit",
        showTds: false,
      },
      {
        ledger: "<Landlord Details>",
        landlord: "",
        type: "Credit",
        showTds: false,
      },
    ],
    paymentVoucher: [
      {
        ledger: "<Landlord Details>",
        landlord: "",
        type: "Debit",
        showTds: false,
      },
      { ledger: "Bank", landlord: "", type: "Credit", showTds: false },
    ],
  });

  const uniqueLandlordRecords = useMemo(() => {
    const byLandlord = new Map<string, RentRecord>();
    rentRecords.forEach((entry) => {
      const landlordName = String(entry?.landlordName || "").trim();
      if (!landlordName || byLandlord.has(landlordName)) return;
      byLandlord.set(landlordName, { ...entry, landlordName });
    });
    return Array.from(byLandlord.values()).sort((a, b) =>
      String(a.landlordName || "").localeCompare(String(b.landlordName || "")),
    );
  }, [rentRecords]);

  const landlordDetailsLookup = useMemo(() => {
    const lookup = new Map<string, RentRecord>();
    uniqueLandlordRecords.forEach((record) => {
      const key = String(record.landlordName || "");
      if (key) lookup.set(key, record);
    });
    return lookup;
  }, [uniqueLandlordRecords]);

  const sundryCreditorLedgers = useMemo(() => {
    const allLedgers: string[] = [];
    const targetGroupNames = new Set([
      "sundry creditors",
      "sundry creditors group",
    ]);
    chartOfAccounts.forEach((master) => {
      (master?.groups || []).forEach((group) => {
        const groupName = (group?.name || "").trim().toLowerCase();
        if (targetGroupNames.has(groupName)) {
          (group?.ledgers || []).forEach((ledger) => {
            const ledgerName = String(ledger || "").trim();
            if (ledgerName) allLedgers.push(ledgerName);
          });
        }
      });
    });
    return [...new Set(allLedgers)].sort((a, b) => a.localeCompare(b));
  }, [chartOfAccounts]);

  // COA Hierarchy for Journal Entry selection
  const coaMasters = useMemo(() => {
    return chartOfAccounts
      .map((master) => String(master?.master || "").trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [chartOfAccounts]);

  const coaGroups = useMemo(() => {
    if (!selectedMaster) return [];
    const masterObj = chartOfAccounts.find(
      (m) => String(m?.master || "").trim() === selectedMaster,
    );
    if (!masterObj) return [];
    return (masterObj.groups || [])
      .map((g) => String(g?.name || "").trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [chartOfAccounts, selectedMaster]);

  const coaLedgers = useMemo(() => {
    if (!selectedMaster || !selectedGroup) return [];
    const masterObj = chartOfAccounts.find(
      (m) => String(m?.master || "").trim() === selectedMaster,
    );
    if (!masterObj) return [];
    const groupObj = (masterObj.groups || []).find(
      (g) => String(g?.name || "").trim() === selectedGroup,
    );
    if (!groupObj) return [];
    return (groupObj.ledgers || [])
      .map((l) => String(l || "").trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [chartOfAccounts, selectedMaster, selectedGroup]);

  const tdsAccountOptions = useMemo(() => {
    return tdsAccountMappings
      .map((item) => String(item?.accountName || "").trim())
      .filter((name) => name.length > 0);
  }, [tdsAccountMappings]);

  const latestFyName = useMemo(() => {
    const fyNames = [
      ...new Set(
        tdsRules
          .map((rule) => String(rule.fy || "").trim())
          .filter((fy) => fy.length > 0),
      ),
    ];
    if (fyNames.length === 0) return "";
    const parseStartYear = (fy: string) => {
      const m = fy.match(/^(\d{4})\s*-\s*(\d{4})$/);
      return m ? Number(m[1]) : Number.NaN;
    };
    fyNames.sort((a, b) => {
      const ay = parseStartYear(a);
      const by = parseStartYear(b);
      if (Number.isFinite(ay) && Number.isFinite(by)) return by - ay;
      return b.localeCompare(a);
    });
    return fyNames[0];
  }, [tdsRules]);

  const latestFyTdsRules = useMemo(() => {
    if (!latestFyName) return [];
    return tdsRules
      .filter((rule) => {
        if (String(rule.fy || "").trim() !== latestFyName) return false;
        const status = String(rule.status || "")
          .trim()
          .toLowerCase();
        return status === "" || status === "active" || status === "open";
      })
      .sort((a, b) => String(a.type || "").localeCompare(String(b.type || "")));
  }, [tdsRules, latestFyName]);

  const handleApplyTdsAccount = async () => {
    if (selectedTdsRuleIndex === "") return;
    const selectedRule = latestFyTdsRules[Number(selectedTdsRuleIndex)];
    if (!selectedRule) return;
    const appliedOn = new Date().toLocaleDateString("en-GB");
    const nextData = [
      {
        accountName: `TDS Account (${String(selectedRule.section || "194I")})`,
        type: String(selectedRule.type || ""),
        section: String(selectedRule.section || ""),
        rate: Number(selectedRule.rate || 0),
        appliedOn,
      },
      ...tdsAccountMappings,
    ];
    await onUpdateTdsAccountMappings?.(nextData);
    setSelectedTdsRuleIndex("");
  };

  const handleToggleExpenseTds = () => {
    setExpenseVoucherTdsEnabled((prev) => !prev);
  };

  const handleAddEntry = () => {
    const voucherKey =
      selectedVoucherType === "Expense Voucher" ? "expenseVoucher" : (
        "paymentVoucher"
      );
    const newEntry = {
      ledger: selectedLedger || "",
      landlord: selectedLandlordDetail,
      type: selectedEntryType,
      showTds: showTds,
    };

    setJournalEntryConfigs((prev) => ({
      ...prev,
      [voucherKey]: [...prev[voucherKey], newEntry],
    }));

    // Reset form
    setSelectedMaster("");
    setSelectedGroup("");
    setSelectedLedger("");
    setSelectedLandlordDetail("");
    setSelectedEntryType("Debit");
    setShowTds(false);
  };

  const handleRemoveEntry = (voucherType: string, index: number) => {
    const key =
      voucherType === "Expense Voucher" ? "expenseVoucher" : "paymentVoucher";
    setJournalEntryConfigs((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleEditEntry = (voucherType: string) => {
    setEditingVoucherType(voucherType);
    setSelectedVoucherType(voucherType);
  };

  const handleDoneEditing = () => {
    setEditingVoucherType("");
  };

  const availableJeLedgers = useMemo(() => {
    const list = [
      "Rent",
      "Bank",
      "<Landlord Details>",
      ...sundryCreditorLedgers,
      ...journalVoucherMappings.map((item) =>
        String(item.ledgerName || "").trim(),
      ),
    ].filter((item) => item.length > 0);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
  }, [sundryCreditorLedgers, journalVoucherMappings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Map to Chart of Accounts
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Configure journal entries for Expense and Payment Vouchers with
                hierarchical COA selection.
              </p>
            </div>
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                Back to Rent Landing Page
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("entries")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition ${
                activeTab === "entries" ?
                  "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}>
              Journal Entries
            </button>
            <button
              onClick={() => setActiveTab("tds")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition ${
                activeTab === "tds" ?
                  "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}>
              TDS Account
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "entries" ?
            <div className="space-y-6">
              {/* Add Entry Form */}
              {editingVoucherType && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                      Add Entry to {editingVoucherType}
                    </div>
                    <button
                      onClick={handleDoneEditing}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                      Done
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                          COA Master
                        </label>
                        <select
                          value={selectedMaster}
                          onChange={(e) => {
                            setSelectedMaster(e.target.value);
                            setSelectedGroup("");
                            setSelectedLedger("");
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                          <option value="">Select Master</option>
                          {coaMasters.map((master) => (
                            <option
                              key={master}
                              value={master}>
                              {master}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                          Group
                        </label>
                        <select
                          value={selectedGroup}
                          onChange={(e) => {
                            setSelectedGroup(e.target.value);
                            setSelectedLedger("");
                          }}
                          disabled={!selectedMaster}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
                          <option value="">Select Group</option>
                          {coaGroups.map((group) => (
                            <option
                              key={group}
                              value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                          Ledger
                        </label>
                        <select
                          value={selectedLedger}
                          onChange={(e) => setSelectedLedger(e.target.value)}
                          disabled={!selectedGroup}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
                          <option value="">Select Ledger</option>
                          {coaLedgers.map((ledger) => (
                            <option
                              key={ledger}
                              value={ledger}>
                              {ledger}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                          Landlord Details
                        </label>
                        <select
                          value={selectedLandlordDetail}
                          onChange={(e) =>
                            setSelectedLandlordDetail(e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                          <option value="">None</option>
                          <option value="<Landlord Details>">
                            &lt;Landlord Details&gt;
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                          Type
                        </label>
                        <select
                          value={selectedEntryType}
                          onChange={(e) => setSelectedEntryType(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                          <option value="Debit">Debit</option>
                          <option value="Credit">Credit</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showTds}
                            onChange={(e) => setShowTds(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Show TDS
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleAddEntry}
                        disabled={!selectedLedger && !selectedLandlordDetail}
                        className={`px-6 py-2 bg-${themeColor} disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium hover:brightness-110 transition shadow-sm`}>
                        Add Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Expense Voucher Configuration */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                      Expense Voucher
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleExpenseTds}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                          expenseVoucherTdsEnabled ?
                            "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}>
                        {expenseVoucherTdsEnabled ? "TDS On" : "TDS Off"}
                      </button>
                      <button
                        onClick={() => handleEditEntry("Expense Voucher")}
                        disabled={editingVoucherType === "Expense Voucher"}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ledger
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        TDS
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {journalEntryConfigs.expenseVoucher.map((entry, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          {entry.ledger || entry.landlord || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          {entry.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          {entry.showTds ? "Yes" : "No"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() =>
                              handleRemoveEntry("Expense Voucher", idx)
                            }
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expenseVoucherTdsEnabled && (
                      <tr className="bg-amber-50/30 dark:bg-amber-900/10">
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100 font-medium">
                          TDS Account (194I)
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          Credit
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          -
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 italic">
                          TDS Deduction
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Voucher Configuration */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                      Payment Voucher
                    </div>
                    <button
                      onClick={() => handleEditEntry("Payment Voucher")}
                      disabled={editingVoucherType === "Payment Voucher"}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50">
                      Edit
                    </button>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ledger
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        TDS
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {journalEntryConfigs.paymentVoucher.map((entry, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          {entry.ledger || entry.landlord || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          {entry.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                          {entry.showTds ? "Yes" : "No"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() =>
                              handleRemoveEntry("Payment Voucher", idx)
                            }
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {journalEntryConfigs.paymentVoucher.some(
                      (e) => e.showTds,
                    ) &&
                      tdsAccountOptions.length > 0 && (
                        <tr className="bg-amber-50/30 dark:bg-amber-900/10">
                          <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100 font-medium">
                            {tdsAccountOptions[0]} (Auto)
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                            Credit
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                            -
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 italic">
                            TDS Deduction
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          : <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  TDS Account Mapping
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="min-w-[280px] flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                        TDS Master (Latest FY
                        {latestFyName ? `: ${latestFyName}` : ""})
                      </label>
                      <select
                        value={selectedTdsRuleIndex}
                        onChange={(e) =>
                          setSelectedTdsRuleIndex(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        <option value="">Select Type | Section (Rate%)</option>
                        {latestFyTdsRules.map((item, idx) => (
                          <option
                            key={`${item.fy}-${item.type}-${idx}`}
                            value={String(idx)}>
                            {`${String(item.type || "-")} | ${String(item.section || "-")} (${Number(item.rate || 0)}%)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleApplyTdsAccount}
                      disabled={selectedTdsRuleIndex === ""}
                      className={`px-6 py-2 bg-${themeColor} disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium hover:brightness-110 transition shadow-sm whitespace-nowrap`}>
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  Selected TDS Master
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {tdsAccountMappings.length > 0 ?
                      tdsAccountMappings.map((item, idx) => (
                        <tr
                          key={`${item.type}-${item.section}-${idx}`}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                            {String(item.type || "-")}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                            {String(item.section || "-")}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                            {`${Number(item.rate || 0)}%`}
                          </td>
                        </tr>
                      ))
                    : <tr>
                        <td
                          className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400"
                          colSpan={3}>
                          No TDS master selected yet.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
};
