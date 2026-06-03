import { useState, useMemo } from "react";

interface TravelEntry {
  id: string;
  employeeName: string;
  employeeLedger: string;
  travelStartDate: string;
  travelEndDate: string;
  frequency: string;
  fromDate: string;
  toDate: string;
  amount: string;
}

interface CoaGroup {
  master: string;
  group: string;
}

interface CoaMaster {
  master: string;
}

interface TravelMapping {
  ledger?: string;
  employee?: string;
  type: "Debit" | "Credit";
}

interface TravelMapToCoaPageProps {
  travelRecords: TravelEntry[];
  journalVoucherMappings: {
    expenseVoucher?: TravelMapping[];
    perDiemVoucher?: TravelMapping[];
    advanceVoucher?: TravelMapping[];
    paymentVoucher?: TravelMapping[];
    employeeMappings?: { employee: string; ledger: string }[];
  };
  onUpdateJournalVoucherMappings: (mappings: {
    expenseVoucher: TravelMapping[];
    perDiemVoucher: TravelMapping[];
    advanceVoucher: TravelMapping[];
    paymentVoucher: TravelMapping[];
    employeeMappings: { employee: string; ledger: string }[];
  }) => void;
  chartOfAccounts: {
    master: string;
    group: string;
    ledger: string;
    code: string;
  }[];
  onBackToLanding?: () => void;
}

export const TravelMapToCoaPage = ({
  travelRecords,
  journalVoucherMappings,
  onUpdateJournalVoucherMappings,
  chartOfAccounts,
  onBackToLanding,
}: TravelMapToCoaPageProps) => {
  const [editingVoucherType, setEditingVoucherType] = useState<string>("");
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>("");

  const [selectedMaster, setSelectedMaster] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] =
    useState<string>("");
  const [selectedEntryType, setSelectedEntryType] = useState<string>("Debit");

  const [journalEntryConfigs, setJournalEntryConfigs] = useState<{
    expenseVoucher: TravelMapping[];
    perDiemVoucher: TravelMapping[];
    advanceVoucher: TravelMapping[];
    paymentVoucher: TravelMapping[];
  }>({
    expenseVoucher: journalVoucherMappings.expenseVoucher?.length ?
      journalVoucherMappings.expenseVoucher
    : [
        { ledger: "Travel Account", type: "Debit" },
        { ledger: "<Party Account>", type: "Credit" },
      ],
    perDiemVoucher: journalVoucherMappings.perDiemVoucher?.length ?
      journalVoucherMappings.perDiemVoucher
    : [
        { ledger: "Per Diem Account", type: "Debit" },
        { ledger: "<Party Account>", type: "Credit" },
      ],
    advanceVoucher: journalVoucherMappings.advanceVoucher?.length ?
      journalVoucherMappings.advanceVoucher
    : [
        { ledger: "Advance Account", type: "Debit" },
        { ledger: "<Party Account>", type: "Credit" },
      ],
    paymentVoucher: journalVoucherMappings.paymentVoucher?.length ?
      journalVoucherMappings.paymentVoucher
    : [
        { ledger: "<Party Account>", type: "Debit" },
        { ledger: "Bank", type: "Credit" },
      ],
  });

  const uniqueTravelRecords = useMemo(() => {
    const seen = new Set<string>();
    return travelRecords.filter((record) => {
      if (seen.has(record.employeeName)) return false;
      seen.add(record.employeeName);
      return true;
    });
  }, [travelRecords]);

  const employeeDetailsLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    uniqueTravelRecords.forEach((r) => {
      lookup[r.employeeName] = r.employeeLedger;
    });
    return lookup;
  }, [uniqueTravelRecords]);

  const sundryCreditorLedgers = useMemo(() => {
    const ledgers = new Set<string>();
    uniqueTravelRecords.forEach((r) => {
      if (r.employeeLedger) ledgers.add(r.employeeLedger);
    });
    return Array.from(ledgers);
  }, [uniqueTravelRecords]);

  const coaMasters = useMemo(() => {
    const mastersSet = new Set<string>();
    chartOfAccounts.forEach((coa) => {
      if (coa.master) mastersSet.add(coa.master);
    });
    return Array.from(mastersSet).sort();
  }, [chartOfAccounts]);

  const coaGroups = useMemo(() => {
    if (!selectedMaster) return [];
    const groupsSet = new Set<string>();
    chartOfAccounts.forEach((coa) => {
      if (coa.master === selectedMaster && coa.group) {
        groupsSet.add(coa.group);
      }
    });
    return Array.from(groupsSet).sort();
  }, [chartOfAccounts, selectedMaster]);

  const coaLedgers = useMemo(() => {
    if (!selectedGroup) return [];
    const ledgersSet = new Set<string>();
    chartOfAccounts.forEach((coa) => {
      if (
        coa.master === selectedMaster &&
        coa.group === selectedGroup &&
        coa.ledger
      ) {
        ledgersSet.add(coa.ledger);
      }
    });
    return Array.from(ledgersSet).sort();
  }, [chartOfAccounts, selectedMaster, selectedGroup]);

  const handleAddEntry = () => {
    if (!selectedVoucherType) return;

    const voucherKey =
      selectedVoucherType === "Expense Voucher" ? "expenseVoucher"
      : selectedVoucherType === "Per Diem Voucher" ? "perDiemVoucher"
      : selectedVoucherType === "Advance Given Voucher" ? "advanceVoucher"
      : "paymentVoucher";

    let newEntry: TravelMapping;
    if (selectedEmployeeDetail && selectedEmployeeDetail !== "") {
      const ledgerFromLookup = employeeDetailsLookup[selectedEmployeeDetail];
      newEntry = {
        employee: selectedEmployeeDetail,
        ledger: ledgerFromLookup || "",
        type: selectedEntryType as "Debit" | "Credit",
      };
    } else if (selectedLedger) {
      newEntry = {
        ledger: selectedLedger,
        type: selectedEntryType as "Debit" | "Credit",
      };
    } else {
      return;
    }

    const updatedConfigs = {
      ...journalEntryConfigs,
      [voucherKey]: [...journalEntryConfigs[voucherKey], newEntry],
    };

    setJournalEntryConfigs(updatedConfigs);
    onUpdateJournalVoucherMappings({
      ...updatedConfigs,
      employeeMappings: journalVoucherMappings.employeeMappings || [],
    });

    setSelectedMaster("");
    setSelectedGroup("");
    setSelectedLedger("");
    setSelectedEmployeeDetail("");
    setSelectedEntryType("Debit");
  };

  const handleRemoveEntry = (voucherType: string, index: number) => {
    const voucherKey =
      voucherType === "Expense Voucher" ? "expenseVoucher"
      : voucherType === "Per Diem Voucher" ? "perDiemVoucher"
      : voucherType === "Advance Given Voucher" ? "advanceVoucher"
      : "paymentVoucher";
    const updatedConfigs = {
      ...journalEntryConfigs,
      [voucherKey]: journalEntryConfigs[voucherKey].filter(
        (_, i) => i !== index,
      ),
    };
    setJournalEntryConfigs(updatedConfigs);
    onUpdateJournalVoucherMappings({
      ...updatedConfigs,
      employeeMappings: journalVoucherMappings.employeeMappings || [],
    });
  };

  const handleEditEntry = (voucherType: string) => {
    setEditingVoucherType(voucherType);
    setSelectedVoucherType(voucherType);
  };

  const handleDoneEditing = () => {
    setEditingVoucherType("");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Map to Chart of Accounts
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Configure journal entries for Expense, Per Diem, Advance Given, and
                Payment Vouchers with hierarchical COA selection.
              </p>
            </div>
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                Back to Travel Landing Page
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
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
                    Party Account
                  </label>
                  <select
                    value={selectedEmployeeDetail}
                    onChange={(e) => setSelectedEmployeeDetail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    <option value="">None</option>
                    <option value="<Party Account>">
                      &lt;Party Account&gt;
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    <option value="Debit">Debit</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddEntry}
                  disabled={!selectedLedger && !selectedEmployeeDetail}
                  className="px-6 py-2 bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium hover:bg-purple-700 transition shadow-sm">
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
              <button
                onClick={() => handleEditEntry("Expense Voucher")}
                disabled={editingVoucherType === "Expense Voucher"}
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
                    {entry.ledger || entry.employee || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {entry.type}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleRemoveEntry("Expense Voucher", idx)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Per Diem Voucher Configuration */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
              <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                Per Diem Voucher
              </div>
              <button
                onClick={() => handleEditEntry("Per Diem Voucher")}
                disabled={editingVoucherType === "Per Diem Voucher"}
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
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {journalEntryConfigs.perDiemVoucher.map((entry, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {entry.ledger || entry.employee || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {entry.type}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleRemoveEntry("Per Diem Voucher", idx)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Advance Given Voucher Configuration */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
              <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                Advance Given Voucher
              </div>
              <button
                onClick={() => handleEditEntry("Advance Given Voucher")}
                disabled={editingVoucherType === "Advance Given Voucher"}
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
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {journalEntryConfigs.advanceVoucher.map((entry, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {entry.ledger || entry.employee || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {entry.type}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleRemoveEntry("Advance Given Voucher", idx)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
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
                    {entry.ledger || entry.employee || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {entry.type}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleRemoveEntry("Payment Voucher", idx)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
};
