import React, { useState, useMemo } from "react";

interface LedgerItem {
  name: string;
  isPartyAccount?: boolean;
  partyDetails?: any;
}

type LedgerEntry = string | LedgerItem;

interface Group {
  name: string;
  ledgers: LedgerEntry[];
}

interface MasterCategory {
  master: string;
  groups: Group[];
}

interface PartyLedgerMapping {
  id: number;
  partyAccount: string;
  ledgerAccount: string;
  master: string;
  group: string;
}

interface MapExpensesAdminPageProps {
  themeColor?: string;
  chartOfAccounts: MasterCategory[];
  mappingData: PartyLedgerMapping[];
  onSaveMapping: (data: PartyLedgerMapping[]) => void;
}

export const MapExpensesAdminPage: React.FC<MapExpensesAdminPageProps> = ({
  themeColor = "indigo-600",
  chartOfAccounts,
  mappingData,
  onSaveMapping,
}) => {
  const [selectedParty, setSelectedParty] = useState("");
  const [selectedLedger, setSelectedLedger] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Extract all party accounts from all masters
  const partyAccounts = useMemo(() => {
    const parties: { name: string; master: string; group: string }[] = [];
    chartOfAccounts.forEach((master) => {
      master.groups.forEach((group) => {
        group.ledgers.forEach((ledger) => {
          if (typeof ledger === "object" && ledger.isPartyAccount) {
            parties.push({
              name: ledger.name,
              master: master.master,
              group: group.name,
            });
          }
        });
      });
    });
    return parties;
  }, [chartOfAccounts]);

  // Extract all expenditure accounts
  const expenditureAccounts = useMemo(() => {
    const accounts: { name: string; master: string; group: string }[] = [];
    const expenditureMaster = chartOfAccounts.find(
      (m) => m.master === "Expenditure",
    );
    if (expenditureMaster) {
      expenditureMaster.groups.forEach((group) => {
        group.ledgers.forEach((ledger) => {
          const ledgerName = typeof ledger === "string" ? ledger : ledger.name;
          accounts.push({
            name: ledgerName,
            master: "Expenditure",
            group: group.name,
          });
        });
      });
    }
    return accounts;
  }, [chartOfAccounts]);

  const handleAddMapping = () => {
    if (!selectedParty || !selectedLedger) {
      alert("Please select both party account and ledger account");
      return;
    }

    const partyInfo = partyAccounts.find((p) => p.name === selectedParty);
    const ledgerInfo = expenditureAccounts.find(
      (l) => l.name === selectedLedger,
    );

    if (!partyInfo || !ledgerInfo) return;

    if (editingId !== null) {
      // Update existing mapping
      const updatedMappings = mappingData.map((m) =>
        m.id === editingId ?
          {
            ...m,
            partyAccount: selectedParty,
            ledgerAccount: selectedLedger,
            master: ledgerInfo.master,
            group: ledgerInfo.group,
          }
        : m,
      );
      onSaveMapping(updatedMappings);
      setEditingId(null);
    } else {
      // Add new mapping
      const newMapping: PartyLedgerMapping = {
        id: Date.now(),
        partyAccount: selectedParty,
        ledgerAccount: selectedLedger,
        master: ledgerInfo.master,
        group: ledgerInfo.group,
      };
      onSaveMapping([...mappingData, newMapping]);
    }

    setSelectedParty("");
    setSelectedLedger("");
  };

  const handleEdit = (mapping: PartyLedgerMapping) => {
    setSelectedParty(mapping.partyAccount);
    setSelectedLedger(mapping.ledgerAccount);
    setEditingId(mapping.id);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this mapping?")) {
      onSaveMapping(mappingData.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Map Expenses to COA
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Associate party accounts with their respective Chart of Account
            entries.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm mb-8">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-sm">
          {editingId ? "Edit Mapping" : "New Mapping"}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Select Party
              </label>
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white">
                <option value="">Select Party Account</option>
                {partyAccounts.map((party, index) => (
                  <option
                    key={index}
                    value={party.name}>
                    {party.name} ({party.group})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Map Ledger Account
              </label>
              <select
                value={selectedLedger}
                onChange={(e) => setSelectedLedger(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white">
                <option value="">Select Ledger Account</option>
                {expenditureAccounts.map((account, index) => (
                  <option
                    key={index}
                    value={account.name}>
                    {account.name} ({account.group})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddMapping}
              className={`px-6 py-2 bg-${themeColor} text-white rounded-md text-sm font-medium hover:brightness-110 transition shadow-sm whitespace-nowrap`}>
              {editingId ? "Update Mapping" : "Add Mapping"}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setSelectedParty("");
                  setSelectedLedger("");
                }}
                className="px-6 py-2 bg-slate-400 text-white rounded-md text-sm font-medium hover:brightness-110 transition shadow-sm whitespace-nowrap">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Party Account
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Mapped Ledger Account
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {mappingData.length === 0 ?
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-sm text-slate-400">
                  No mappings created yet. Add your first mapping above.
                </td>
              </tr>
            : mappingData.map((mapping) => (
                <tr
                  key={mapping.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {mapping.partyAccount}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {mapping.ledgerAccount} ({mapping.group})
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(mapping)}
                        className="p-1 hover:text-indigo-600 text-slate-400 transition"
                        title="Edit">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(mapping.id)}
                        className="p-1 hover:text-red-600 text-slate-400 transition"
                        title="Delete">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};
