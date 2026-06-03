import React, { useMemo, useState } from 'react';
import { CompactDatePicker } from '../shared/CompactDatePicker';

interface BeneficiaryItem {
  id: number;
  name: string;
  location: string;
  batchNumber: string;
}

interface FeeMasterItem {
  id: number;
  location: string;
  feesApplicable: 'Yes' | 'No';
  feeAmount: string;
}

interface FeeCollectionItem {
  id?: number;
  beneficiaryId: number;
  amountCollected: string;
  collectionDate: string;
  receiptNumber: string;
  createdAt?: string;
}

interface CollectFeesPageProps {
  beneficiaries: BeneficiaryItem[];
  feeMaster: FeeMasterItem[];
  collections: FeeCollectionItem[];
  onUpdate: (data: FeeCollectionItem[]) => void;
  themeColor?: string;
}

interface ReportRow {
  id: number;
  name: string;
  location: string;
  batchNumber: string;
  feesDue: number;
  feeCollected: number;
  balanceDue: number;
}

interface CollectionDraft {
  amount: string;
  date: string;
}

export const CollectFeesPage: React.FC<CollectFeesPageProps> = ({
  beneficiaries,
  feeMaster,
  collections,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [collectingFor, setCollectingFor] = useState<ReportRow | null>(null);
  const [historyFor, setHistoryFor] = useState<ReportRow | null>(null);
  const [draft, setDraft] = useState<CollectionDraft>({ amount: '', date: '' });

  const normalizedCollections = useMemo<FeeCollectionItem[]>(() => {
    return (collections || []).map((item, index) => ({
      ...item,
      id: item.id ?? Date.now() + index,
      receiptNumber: item.receiptNumber || `RCPT-${String(item.beneficiaryId).padStart(4, '0')}-${String(index + 1).padStart(3, '0')}`
    }));
  }, [collections]);

  const feeMap = useMemo(() => {
    const map = new Map<string, FeeMasterItem>();
    (feeMaster || []).forEach((item) => {
      map.set(item.location.toLowerCase(), item);
    });
    return map;
  }, [feeMaster]);

  const collectionsByBeneficiary = useMemo(() => {
    const map = new Map<number, FeeCollectionItem[]>();
    normalizedCollections.forEach((item) => {
      if (!map.has(item.beneficiaryId)) map.set(item.beneficiaryId, []);
      map.get(item.beneficiaryId)?.push(item);
    });

    map.forEach((arr) => {
      arr.sort((a, b) => {
        const aTime = new Date(a.createdAt || a.collectionDate || 0).getTime();
        const bTime = new Date(b.createdAt || b.collectionDate || 0).getTime();
        return bTime - aTime;
      });
    });

    return map;
  }, [normalizedCollections]);

  const reportData = useMemo<ReportRow[]>(() => {
    return (beneficiaries || []).map((beneficiary) => {
      const feeRecord = feeMap.get((beneficiary.location || '').toLowerCase());
      const feesDue = feeRecord && feeRecord.feesApplicable === 'Yes' ? Number(feeRecord.feeAmount || 0) : 0;
      const rows = collectionsByBeneficiary.get(beneficiary.id) || [];
      const feeCollected = rows.reduce((sum, row) => sum + (Number(row.amountCollected) || 0), 0);
      const balanceDue = Math.max(feesDue - feeCollected, 0);

      return {
        id: beneficiary.id,
        name: beneficiary.name,
        location: beneficiary.location,
        batchNumber: beneficiary.batchNumber,
        feesDue,
        feeCollected,
        balanceDue
      };
    });
  }, [beneficiaries, feeMap, collectionsByBeneficiary]);

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return reportData.filter((item) => {
      const matchesLocation = selectedLocation === 'ALL' || item.location === selectedLocation;
      const matchesBatch = selectedBatch === 'ALL' || item.batchNumber === selectedBatch;
      const matchesQuery =
        query === '' ||
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.batchNumber.toLowerCase().includes(query);

      return (
        matchesLocation &&
        matchesBatch &&
        matchesQuery
      );
    });
  }, [reportData, searchText, selectedLocation, selectedBatch]);

  const locationOptions = useMemo(() => {
    return Array.from(new Set(reportData.map((item) => item.location).filter(Boolean)));
  }, [reportData]);

  const batchOptions = useMemo(() => {
    const rows = selectedLocation === 'ALL'
      ? reportData
      : reportData.filter((item) => item.location === selectedLocation);
    return Array.from(new Set(rows.map((item) => item.batchNumber).filter(Boolean)));
  }, [reportData, selectedLocation]);

  const totalFeesDue = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.feesDue, 0);
  }, [filteredData]);

  const totalBalance = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.balanceDue, 0);
  }, [filteredData]);

  const formatCurrency = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;

  const createReceiptNumber = (beneficiaryId: number, sequence: number) => {
    return `RCPT-${String(beneficiaryId).padStart(4, '0')}-${String(sequence).padStart(3, '0')}`;
  };

  const downloadReceipt = (row: ReportRow, amountCollected: number, collectionDate: string, receiptNumber: string) => {
    const updatedCollected = row.feeCollected + amountCollected;
    const updatedBalance = Math.max(row.feesDue - updatedCollected, 0);

    const receiptText = [
      'S3 ENTERPRISE ERP',
      'FEE RECEIPT',
      '',
      `Receipt No: ${receiptNumber}`,
      `Date: ${collectionDate}`,
      `Beneficiary Name: ${row.name}`,
      `Location: ${row.location}`,
      `Batch Number: ${row.batchNumber || '--'}`,
      `Fees Due: ${formatCurrency(row.feesDue)}`,
      `Fee Collected (This Receipt): ${formatCurrency(amountCollected)}`,
      `Total Fee Collected: ${formatCurrency(updatedCollected)}`,
      `Balance Due: ${formatCurrency(updatedBalance)}`
    ].join('\r\n');

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${row.name.replace(/\s+/g, '_')}_${receiptNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const openCollectDialog = (row: ReportRow) => {
    if (row.balanceDue <= 0) return;
    setCollectingFor(row);
    setDraft({ amount: '', date: '' });
  };

  const submitCollection = () => {
    if (!collectingFor) return;

    const amount = Number(draft.amount);
    const date = draft.date.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Please enter a valid collected amount greater than 0.');
      return;
    }

    if (!date) {
      window.alert('Please select collection date.');
      return;
    }

    if (amount > collectingFor.balanceDue) {
      window.alert('Collected amount cannot exceed balance due.');
      return;
    }

    const existingRows = collectionsByBeneficiary.get(collectingFor.id) || [];
    const sequence = existingRows.length + 1;
    const receiptNumber = createReceiptNumber(collectingFor.id, sequence);

    const nextRow: FeeCollectionItem = {
      id: Date.now(),
      beneficiaryId: collectingFor.id,
      amountCollected: String(amount),
      collectionDate: date,
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    const nextCollections = [...normalizedCollections, nextRow];
    onUpdate(nextCollections);
    downloadReceipt(collectingFor, amount, date, receiptNumber);
    setCollectingFor(null);
    setDraft({ amount: '', date: '' });
  };

  const historyRows = useMemo(() => {
    if (!historyFor) return [];
    return collectionsByBeneficiary.get(historyFor.id) || [];
  }, [collectionsByBeneficiary, historyFor]);

  const redownloadReceipt = (row: ReportRow, item: FeeCollectionItem) => {
    downloadReceipt(row, Number(item.amountCollected || 0), item.collectionDate, item.receiptNumber);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Collect Fees</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Beneficiary fee due report from Fee Master</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg bg-${themeColor}/10 text-${themeColor} text-sm font-extrabold`}>
              Total Due: {formatCurrency(totalFeesDue)}
            </div>
            <div className="px-4 py-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-sm font-extrabold">
              Total Balance: {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by beneficiary, location or batch"
              className="w-full max-w-md px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setSelectedBatch('ALL');
              }}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Locations</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Batches</option>
              {batchOptions.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3">Name of Beneficiary</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Fees Due</th>
                  <th className="px-4 py-3 text-right">Fee Collected</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      No fee report rows found.
                    </td>
                  </tr>
                )}
                {filteredData.map((item) => {
                  const isFullyPaid = item.balanceDue <= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        <button
                          onClick={() => setHistoryFor(item)}
                          className="underline decoration-dotted underline-offset-4 hover:text-brand-600"
                          title="View collection history"
                        >
                          {item.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.location}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.batchNumber || '--'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{formatCurrency(item.feesDue)}</span>
                          <button
                            onClick={() => openCollectDialog(item)}
                            disabled={isFullyPaid}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${isFullyPaid ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : `bg-${themeColor} text-white hover:opacity-90`}`}
                          >
                            {isFullyPaid ? 'Fully Paid' : 'Collect Fees'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-slate-700 dark:text-slate-200">{formatCurrency(item.feeCollected)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-slate-700 dark:text-slate-200">{formatCurrency(item.balanceDue)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setHistoryFor(item)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-extrabold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {collectingFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Collect Fees</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">{collectingFor.name} - Balance {formatCurrency(collectingFor.balanceDue)}</p>
              </div>
              <button
                onClick={() => setCollectingFor(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-sm font-bold"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Amount to Collect</label>
                <input
                  type="number"
                  min={0}
                  max={collectingFor.balanceDue}
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) => setDraft((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Collection Date</label>
                <CompactDatePicker
                  value={draft.date}
                  onChange={(value) => setDraft((prev) => ({ ...prev, date: value }))}
                  className="border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setCollectingFor(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCollection}
                  className={`px-5 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
                >
                  Save and Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 md:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Fee Collection History</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
                  {historyFor.name} | Due {formatCurrency(historyFor.feesDue)} | Collected {formatCurrency(historyFor.feeCollected)} | Balance {formatCurrency(historyFor.balanceDue)}
                </p>
              </div>
              <button
                onClick={() => setHistoryFor(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-extrabold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3">Receipt Number</th>
                      <th className="px-4 py-3">Collection Date</th>
                      <th className="px-4 py-3 text-right">Amount Collected</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {historyRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                          No collection history found for this student.
                        </td>
                      </tr>
                    )}
                    {historyRows.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.receiptNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.collectionDate}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-slate-700 dark:text-slate-200">{formatCurrency(Number(item.amountCollected || 0))}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => redownloadReceipt(historyFor, item)}
                            className={`px-3 py-1.5 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}
                          >
                            Download Receipt
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
      )}
    </div>
  );
};
