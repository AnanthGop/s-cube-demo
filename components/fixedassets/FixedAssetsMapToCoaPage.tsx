import React, { useMemo, useState } from "react";

interface CoaGroup {
  name?: string;
  ledgers?: string[];
}

interface CoaMaster {
  master?: string;
  groups?: CoaGroup[];
}

interface FixedAssetJournalEntry {
  ledger?: string;
  placeholder?: string;
  type: "Debit" | "Credit";
}

interface FixedAssetJournalVoucherMappings {
  additionsVoucher?: FixedAssetJournalEntry[];
  disposalVoucher?: FixedAssetJournalEntry[];
}

interface FixedAssetsMapToCoaPageProps {
  chartOfAccounts?: CoaMaster[];
  journalVoucherMappings?: FixedAssetJournalVoucherMappings;
  onUpdateJournalVoucherMappings?: (
    nextData: FixedAssetJournalVoucherMappings,
  ) => void | Promise<void>;
}

const PLACEHOLDER_OPTIONS = [
  "<Asset Account>",
  "<Party Account>",
  "<Bank Account>",
] as const;

const DEFAULT_MAPPINGS: Required<FixedAssetJournalVoucherMappings> = {
  additionsVoucher: [
    { placeholder: "<Asset Account>", type: "Debit" },
    { placeholder: "<Party Account>", type: "Credit" },
  ],
  disposalVoucher: [
    { placeholder: "<Party Account>", type: "Debit" },
    { placeholder: "<Asset Account>", type: "Credit" },
  ],
};

export const FixedAssetsMapToCoaPage: React.FC<
  FixedAssetsMapToCoaPageProps
> = ({
  chartOfAccounts = [],
  journalVoucherMappings = {} as FixedAssetJournalVoucherMappings,
  onUpdateJournalVoucherMappings,
}) => {
  const [editingVoucherType, setEditingVoucherType] = useState<
    "Asset Additions" | "Asset Disposal" | ""
  >("");
  const [selectedMaster, setSelectedMaster] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedLedger, setSelectedLedger] = useState("");
  const [selectedPlaceholder, setSelectedPlaceholder] = useState("");
  const [selectedEntryType, setSelectedEntryType] = useState<"Debit" | "Credit">(
    "Debit",
  );

  const [journalEntryConfigs, setJournalEntryConfigs] = useState(() => ({
    additionsVoucher:
      journalVoucherMappings.additionsVoucher?.length
        ? journalVoucherMappings.additionsVoucher
        : DEFAULT_MAPPINGS.additionsVoucher,
    disposalVoucher:
      journalVoucherMappings.disposalVoucher?.length
        ? journalVoucherMappings.disposalVoucher
        : DEFAULT_MAPPINGS.disposalVoucher,
  }));

  const coaMasters = useMemo(() => {
    return chartOfAccounts
      .map((master) => String(master?.master || "").trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [chartOfAccounts]);

  const coaGroups = useMemo(() => {
    if (!selectedMaster) return [];
    const masterObj = chartOfAccounts.find(
      (item) => String(item?.master || "").trim() === selectedMaster,
    );
    if (!masterObj) return [];
    return (masterObj.groups || [])
      .map((group) => String(group?.name || "").trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [chartOfAccounts, selectedMaster]);

  const coaLedgers = useMemo(() => {
    if (!selectedMaster || !selectedGroup) return [];
    const masterObj = chartOfAccounts.find(
      (item) => String(item?.master || "").trim() === selectedMaster,
    );
    if (!masterObj) return [];
    const groupObj = (masterObj.groups || []).find(
      (group) => String(group?.name || "").trim() === selectedGroup,
    );
    if (!groupObj) return [];
    return (groupObj.ledgers || [])
      .map((ledger) => String(ledger || "").trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [chartOfAccounts, selectedGroup, selectedMaster]);

  const syncMappings = async (
    nextData: Required<FixedAssetJournalVoucherMappings>,
  ) => {
    setJournalEntryConfigs(nextData);
    await onUpdateJournalVoucherMappings?.(nextData);
  };

  const handleEditEntry = (voucherType: "Asset Additions" | "Asset Disposal") => {
    setEditingVoucherType(voucherType);
    setSelectedMaster("");
    setSelectedGroup("");
    setSelectedLedger("");
    setSelectedPlaceholder("");
    setSelectedEntryType("Debit");
  };

  const handleDoneEditing = () => {
    setEditingVoucherType("");
    setSelectedMaster("");
    setSelectedGroup("");
    setSelectedLedger("");
    setSelectedPlaceholder("");
    setSelectedEntryType("Debit");
  };

  const handleAddEntry = async () => {
    if (!editingVoucherType) return;
    if (!selectedLedger && !selectedPlaceholder) return;

    const voucherKey =
      editingVoucherType === "Asset Additions"
        ? "additionsVoucher"
        : "disposalVoucher";

    const nextEntry: FixedAssetJournalEntry = {
      ledger: selectedPlaceholder ? "" : selectedLedger,
      placeholder: selectedPlaceholder || "",
      type: selectedEntryType,
    };

    const nextData = {
      ...journalEntryConfigs,
      [voucherKey]: [...journalEntryConfigs[voucherKey], nextEntry],
    };

    await syncMappings(nextData);
    setSelectedMaster("");
    setSelectedGroup("");
    setSelectedLedger("");
    setSelectedPlaceholder("");
    setSelectedEntryType("Debit");
  };

  const handleRemoveEntry = async (
    voucherType: "Asset Additions" | "Asset Disposal",
    index: number,
  ) => {
    const voucherKey =
      voucherType === "Asset Additions" ? "additionsVoucher" : "disposalVoucher";

    const nextData = {
      ...journalEntryConfigs,
      [voucherKey]: journalEntryConfigs[voucherKey].filter((_, i) => i !== index),
    };

    await syncMappings(nextData);
  };

  const renderVoucherCard = (
    title: "Asset Additions" | "Asset Disposal",
    entries: FixedAssetJournalEntry[],
  ) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4">
          <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            {title}
          </div>
          <button
            onClick={() => handleEditEntry(title)}
            disabled={editingVoucherType === title}
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
          {entries.map((entry, index) => (
            <tr
              key={`${title}-${index}`}
              className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                {entry.placeholder || entry.ledger || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                {entry.type}
              </td>
              <td className="px-6 py-4 text-sm">
                <button
                  onClick={() => handleRemoveEntry(title, index)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6 text-white">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Map to Chart of Accounts
            </h1>
            <p className="text-white/80 text-xs font-medium mt-1">
              Configure journal entries for asset additions and asset disposal with
              hierarchical COA selection.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
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
                      onChange={(event) => {
                        setSelectedMaster(event.target.value);
                        setSelectedGroup("");
                        setSelectedLedger("");
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                      <option value="">Select Master</option>
                      {coaMasters.map((master) => (
                        <option key={master} value={master}>
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
                      onChange={(event) => {
                        setSelectedGroup(event.target.value);
                        setSelectedLedger("");
                      }}
                      disabled={!selectedMaster}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
                      <option value="">Select Group</option>
                      {coaGroups.map((group) => (
                        <option key={group} value={group}>
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
                      onChange={(event) => {
                        setSelectedLedger(event.target.value);
                        if (event.target.value) {
                          setSelectedPlaceholder("");
                        }
                      }}
                      disabled={!selectedGroup}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
                      <option value="">Select Ledger</option>
                      {coaLedgers.map((ledger) => (
                        <option key={ledger} value={ledger}>
                          {ledger}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Dynamic Account
                    </label>
                    <select
                      value={selectedPlaceholder}
                      onChange={(event) => {
                        setSelectedPlaceholder(event.target.value);
                        if (event.target.value) {
                          setSelectedMaster("");
                          setSelectedGroup("");
                          setSelectedLedger("");
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                      <option value="">None</option>
                      {PLACEHOLDER_OPTIONS.map((placeholder) => (
                        <option key={placeholder} value={placeholder}>
                          {placeholder}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Type
                    </label>
                    <select
                      value={selectedEntryType}
                      onChange={(event) =>
                        setSelectedEntryType(
                          event.target.value as "Debit" | "Credit",
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                      <option value="Debit">Debit</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleAddEntry}
                    disabled={!selectedLedger && !selectedPlaceholder}
                    className="px-6 py-2 bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium hover:bg-purple-700 transition shadow-sm">
                    Add Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          {renderVoucherCard(
            "Asset Additions",
            journalEntryConfigs.additionsVoucher,
          )}
          {renderVoucherCard(
            "Asset Disposal",
            journalEntryConfigs.disposalVoucher,
          )}
        </div>
      </div>
    </div>
  );
};
