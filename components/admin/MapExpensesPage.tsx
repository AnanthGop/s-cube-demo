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

interface MapExpensesPageProps {
  themeColor?: string;
  rentRecords?: RentRecord[];
  chartOfAccounts?: CoaMaster[];
  journalVoucherMappings?: LandlordMapping[];
  onUpdateJournalVoucherMappings?: (
    nextData: LandlordMapping[],
  ) => void | Promise<void>;
}

export const MapExpensesPage: React.FC<MapExpensesPageProps> = ({
  themeColor = "indigo-600",
  rentRecords = [],
  chartOfAccounts = [],
  journalVoucherMappings = [],
  onUpdateJournalVoucherMappings,
}) => {
  const [activeTab, setActiveTab] = useState<"journal" | "liabilities">(
    "journal",
  );
  const [selectedLandlord, setSelectedLandlord] = useState("");
  const [selectedLiabilityLedger, setSelectedLiabilityLedger] = useState("");
  const [isExpenseJeEdit, setIsExpenseJeEdit] = useState(false);
  const [isPaymentJeEdit, setIsPaymentJeEdit] = useState(false);
  const [expenseDebitLedger, setExpenseDebitLedger] = useState("Rent");
  const [expenseCreditLedger, setExpenseCreditLedger] = useState(
    "<Landlord Details>",
  );
  const [paymentDebitLedger, setPaymentDebitLedger] = useState(
    "<Landlord Details>",
  );
  const [paymentCreditLedger, setPaymentCreditLedger] = useState("Bank");

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

  const mappedLandlords = useMemo(
    () =>
      new Set(
        journalVoucherMappings
          .map((item) => String(item?.landlordName || "").trim())
          .filter((name) => name.length > 0),
      ),
    [journalVoucherMappings],
  );

  const unmappedLandlords = useMemo(
    () =>
      uniqueLandlordRecords.filter(
        (record) => !mappedLandlords.has(String(record.landlordName || "")),
      ),
    [uniqueLandlordRecords, mappedLandlords],
  );

  const landlordOptions = useMemo(
    () =>
      unmappedLandlords.map((entry) => String(entry.landlordName || "")).sort(),
    [unmappedLandlords],
  );

  const handleAddMapping = async () => {
    if (!selectedLandlord || !selectedLiabilityLedger) return;
    const mappedOn = new Date().toLocaleDateString("en-GB");
    const nextMapping: LandlordMapping = {
      landlordName: selectedLandlord,
      ledgerName: selectedLiabilityLedger,
      mappedOn,
    };
    const existingIndex = journalVoucherMappings.findIndex(
      (item) => item.landlordName === selectedLandlord,
    );
    const nextData =
      existingIndex === -1 ?
        [...journalVoucherMappings, nextMapping]
      : journalVoucherMappings.map((item, idx) =>
          idx === existingIndex ? nextMapping : item,
        );
    await onUpdateJournalVoucherMappings?.(nextData);
    setSelectedLandlord("");
    setSelectedLiabilityLedger("");
  };

  const availableJeLedgers = useMemo(() => {
    const list = [
      "Rent",
      "Bank",
      "<Landlord Details>",
      ...sundryCreditorLedgers,
      ...journalVoucherMappings.map((item) => String(item.ledgerName || "").trim()),
    ].filter((item) => item.length > 0);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
  }, [sundryCreditorLedgers, journalVoucherMappings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Map to Chart of Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Configure journal mapping and view ledgers under Sundry Creditors.
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("journal")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition ${
              activeTab === "journal"
                ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                : "bg-slate-50 dark:bg-slate-900/40 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}>
            Journal Voucher Master
          </button>
          <button
            onClick={() => setActiveTab("liabilities")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition ${
              activeTab === "liabilities"
                ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                : "bg-slate-50 dark:bg-slate-900/40 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}>
            Journal Entries
          </button>
        </div>
      </div>

      {activeTab === "journal" ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Journal Voucher Master
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="min-w-[250px] flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Landlord Name
                  </label>
                  <select
                    value={selectedLandlord}
                    onChange={(e) => setSelectedLandlord(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    <option value="">Select Landlord</option>
                    {landlordOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[250px] flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Sundry Creditors
                  </label>
                  <select
                    value={selectedLiabilityLedger}
                    onChange={(e) => setSelectedLiabilityLedger(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    <option value="">Select Ledger</option>
                    {sundryCreditorLedgers.map((ledger) => (
                      <option key={ledger} value={ledger}>
                        {ledger}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddMapping}
                  disabled={!selectedLandlord || !selectedLiabilityLedger}
                  className={`px-6 py-2 bg-${themeColor} disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium hover:brightness-110 transition shadow-sm whitespace-nowrap`}>
                  Add Mapping
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Mapping Done So Far
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Landlord</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mapped Ledger</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Centre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mapped On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {journalVoucherMappings.length > 0 ? (
                  journalVoucherMappings.map((item) => {
                    const details = landlordDetailsLookup.get(item.landlordName);
                    return (
                      <tr key={item.landlordName} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{item.landlordName}</td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{item.ledgerName}</td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{String(details?.centre || "-")}</td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{item.mappedOn}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400" colSpan={4}>
                      No mappings added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Landlord Details Not Mapped
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Landlord</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Centre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Rent</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {unmappedLandlords.length > 0 ? (
                  unmappedLandlords.map((item) => (
                    <tr key={String(item.landlordName)} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{String(item.landlordName || "-")}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{String(item.centre || "-")}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{String(item.startDate || "-")}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{String(item.endDate || "-")}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                        {typeof item.currentRent === "number" ? item.currentRent.toLocaleString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">{String(item.status || "-")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400" colSpan={6}>
                      All landlords are mapped.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  Expense Voucher
                </div>
                <button
                  onClick={() => setIsExpenseJeEdit((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  {isExpenseJeEdit ? "Done" : "Edit"}
                </button>
              </div>
              {isExpenseJeEdit && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={expenseDebitLedger}
                    onChange={(e) => setExpenseDebitLedger(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {availableJeLedgers.map((ledger) => (
                      <option key={`exp-dr-${ledger}`} value={ledger}>
                        {ledger}
                      </option>
                    ))}
                  </select>
                  <select
                    value={expenseCreditLedger}
                    onChange={(e) => setExpenseCreditLedger(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {availableJeLedgers.map((ledger) => (
                      <option key={`exp-cr-${ledger}`} value={ledger}>
                        {ledger}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ledger</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Journal Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {expenseDebitLedger}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">Debit</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {expenseCreditLedger}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">Credit</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  Payment Voucher
                </div>
                <button
                  onClick={() => setIsPaymentJeEdit((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  {isPaymentJeEdit ? "Done" : "Edit"}
                </button>
              </div>
              {isPaymentJeEdit && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={paymentDebitLedger}
                    onChange={(e) => setPaymentDebitLedger(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {availableJeLedgers.map((ledger) => (
                      <option key={`pay-dr-${ledger}`} value={ledger}>
                        {ledger}
                      </option>
                    ))}
                  </select>
                  <select
                    value={paymentCreditLedger}
                    onChange={(e) => setPaymentCreditLedger(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {availableJeLedgers.map((ledger) => (
                      <option key={`pay-cr-${ledger}`} value={ledger}>
                        {ledger}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ledger</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Journal Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {paymentDebitLedger}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">Debit</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">
                    {paymentCreditLedger}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-100">Credit</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
