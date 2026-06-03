import React, { useMemo, useState } from 'react';
import { Download, BarChart2, List } from 'lucide-react';

interface FYItem { id: number; name: string; }

interface AssetPurchaseItem {
  id: number;
  assetId: string;
  dateOfPurchase: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  partyName: string;
  location: string;
  fundType: string;
  assetType: string;
  amountBeforeGst?: string;
  gstAmount?: string;
  totalInvoiceValue: string;
  quantity?: number;
  narration?: string;
}

interface DepreciationRegisterItem {
  id: number;
  fy: string;
  assetId: string;
  assetType: string;
  partyName: string;
  dateOfPurchase: string;
  location: string;
  fundType: string;
  costOfAsset: number;
  openingWDV: number;
  depreciationRateIT: number;
  depreciationAmountIT: number;
  closingWDVIT: number;
  usefulLife: number;
  salvageValue: number;
  depreciationAmountCA: number;
  closingWDVCA: number;
  calculatedOn: string;
}

interface AssetDisposalItem {
  id: number;
  assetId: string;
  disposalDate: string;
  disposalType: string;
}

interface AssetRegisterPageProps {
  fyList: FYItem[];
  purchases: AssetPurchaseItem[];
  depreciationRegister: DepreciationRegisterItem[];
  disposals: AssetDisposalItem[];
  themeColor?: string;
}

const fmt = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Parse ordered list of FYs so we can find all FYs up to the selected one
function parseFYYear(fy: string): number {
  const m = fy.match(/(\d{4})/g);
  return m ? Number(m[0]) : 0;
}

export default function AssetRegisterPage({
  fyList,
  purchases,
  depreciationRegister,
  disposals,
  themeColor = 'brand-600',
}: AssetRegisterPageProps) {
  const [selectedFY, setSelectedFY] = useState('');
  const [viewMode, setViewMode] = useState<'register' | 'summary'>('register');
  const [summaryGroup, setSummaryGroup] = useState<'assetType' | 'location' | 'fundType'>('assetType');
  const [depView, setDepView] = useState<'IT' | 'CA'>('IT');

  const fyOptions = useMemo(() =>
    (fyList || [])
      .map((f) => ({ id: f.id, label: String(f.name || '').trim(), value: String(f.name || '').trim() }))
      .filter((f) => f.label)
      .sort((a, b) => parseFYYear(a.value) - parseFYYear(b.value)),
    [fyList]
  );

  // All FYs up to and including selectedFY (for accumulated depreciation)
  const fysUpTo = useMemo(() => {
    if (!selectedFY) return [];
    const selectedYear = parseFYYear(selectedFY);
    return fyOptions.filter((f) => parseFYYear(f.value) <= selectedYear).map((f) => f.value);
  }, [selectedFY, fyOptions]);

  // Build register rows — one per purchase asset
  const registerRows = useMemo(() => {
    if (!selectedFY) return [];

    return (purchases || []).map((asset) => {
      const cost = Number(String(asset.totalInvoiceValue || '0').replace(/,/g, '')) || 0;

      // Find current FY depreciation entry
      const currentEntry = (depreciationRegister || []).find(
        (r) => r.fy === selectedFY && r.assetId === asset.assetId
      );

      // Accumulated depreciation (all FYs up to and including selected FY)
      const accDepIT = (depreciationRegister || [])
        .filter((r) => fysUpTo.includes(r.fy) && r.assetId === asset.assetId)
        .reduce((s, r) => s + r.depreciationAmountIT, 0);

      const accDepCA = (depreciationRegister || [])
        .filter((r) => fysUpTo.includes(r.fy) && r.assetId === asset.assetId)
        .reduce((s, r) => s + r.depreciationAmountCA, 0);

      const openingWDV = currentEntry ? currentEntry.openingWDV : cost;
      const openingWDVCA = currentEntry ? (currentEntry.openingWDV) : cost; // approximation if no CA-specific opening stored
      const currentDepIT = currentEntry ? currentEntry.depreciationAmountIT : 0;
      const currentDepCA = currentEntry ? currentEntry.depreciationAmountCA : 0;
      const closingWDVIT = currentEntry ? currentEntry.closingWDVIT : cost;
      const closingWDVCA = currentEntry ? currentEntry.closingWDVCA : cost;
      const rateIT = currentEntry ? currentEntry.depreciationRateIT : 0;
      const usefulLife = currentEntry ? currentEntry.usefulLife : 0;
      const salvageValue = currentEntry ? currentEntry.salvageValue : 0;

      // Disposal status
      const disposal = (disposals || []).find((d) => d.assetId === asset.assetId);
      const status = disposal ? `Disposed (${disposal.disposalType})` : 'Active';

      return {
        assetId: asset.assetId,
        assetType: asset.assetType,
        location: asset.location || currentEntry?.location || '—',
        fundType: asset.fundType || currentEntry?.fundType || '—',
        partyName: asset.partyName,
        dateOfPurchase: asset.dateOfPurchase,
        cost,
        openingWDV,
        openingWDVCA,
        rateIT,
        usefulLife,
        salvageValue,
        currentDepIT,
        currentDepCA,
        accDepIT,
        accDepCA,
        closingWDVIT,
        closingWDVCA,
        status,
      };
    });
  }, [selectedFY, purchases, depreciationRegister, disposals, fysUpTo]);

  // Summary rows grouped by chosen dimension
  const summaryRows = useMemo(() => {
    if (!selectedFY || registerRows.length === 0) return [];

    const groups: Record<string, {
      key: string;
      count: number;
      totalCost: number;
      totalAccDepIT: number;
      totalAccDepCA: number;
      totalClosingWDVIT: number;
      totalClosingWDVCA: number;
      totalCurrentDepIT: number;
      totalCurrentDepCA: number;
    }> = {};

    registerRows.forEach((row) => {
      const key = summaryGroup === 'assetType' ? row.assetType
        : summaryGroup === 'location' ? row.location
        : row.fundType;

      if (!groups[key]) {
        groups[key] = { key, count: 0, totalCost: 0, totalAccDepIT: 0, totalAccDepCA: 0, totalClosingWDVIT: 0, totalClosingWDVCA: 0, totalCurrentDepIT: 0, totalCurrentDepCA: 0 };
      }
      groups[key].count += 1;
      groups[key].totalCost += row.cost;
      groups[key].totalAccDepIT += row.accDepIT;
      groups[key].totalAccDepCA += row.accDepCA;
      groups[key].totalClosingWDVIT += row.closingWDVIT;
      groups[key].totalClosingWDVCA += row.closingWDVCA;
      groups[key].totalCurrentDepIT += row.currentDepIT;
      groups[key].totalCurrentDepCA += row.currentDepCA;
    });

    return Object.values(groups).sort((a, b) => a.key.localeCompare(b.key));
  }, [registerRows, summaryGroup, selectedFY]);

  const totalCost = registerRows.reduce((s, r) => s + r.cost, 0);
  const totalAccDepIT = registerRows.reduce((s, r) => s + r.accDepIT, 0);
  const totalAccDepCA = registerRows.reduce((s, r) => s + r.accDepCA, 0);
  const totalCurrentDepIT = registerRows.reduce((s, r) => s + r.currentDepIT, 0);
  const totalCurrentDepCA = registerRows.reduce((s, r) => s + r.currentDepCA, 0);
  const totalClosingWDVIT = registerRows.reduce((s, r) => s + r.closingWDVIT, 0);
  const totalClosingWDVCA = registerRows.reduce((s, r) => s + r.closingWDVCA, 0);

  const exportCSV = () => {
    if (registerRows.length === 0) { window.alert('No data to export.'); return; }
    const headers = [
      'Asset ID', 'Asset Type', 'Location', 'Fund Type', 'Party', 'Date of Purchase',
      'Purchase Cost', 'Opening WDV (IT)', 'IT Rate (%)', 'Current Dep (IT)', 'Acc. Dep (IT)', 'Closing WDV (IT)',
      'Useful Life (Yrs)', 'Salvage Value', 'Current Dep (CA)', 'Acc. Dep (CA)', 'Closing WDV (CA)', 'Status'
    ];
    const rows = registerRows.map((r) => [
      r.assetId, r.assetType, r.location, r.fundType, r.partyName, r.dateOfPurchase,
      r.cost, r.openingWDV, r.rateIT, r.currentDepIT, r.accDepIT, r.closingWDVIT,
      r.usefulLife, r.salvageValue, r.currentDepCA, r.accDepCA, r.closingWDVCA, r.status
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Asset_Register_${selectedFY}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

      {/* FY Selector Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Asset Register</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Select a financial year to view the asset register</p>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[220px] max-w-xs">
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Financial Year</label>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">Select Financial Year</option>
                {fyOptions.map((fy) => (
                  <option key={fy.id} value={fy.value}>{fy.label}</option>
                ))}
              </select>
            </div>
            {selectedFY && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('register')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-extrabold transition ${viewMode === 'register' ? `bg-${themeColor} text-white border-transparent` : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <List size={14} /> Register
                </button>
                <button
                  onClick={() => setViewMode('summary')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-extrabold transition ${viewMode === 'summary' ? `bg-${themeColor} text-white border-transparent` : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <BarChart2 size={14} /> Summary
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedFY && registerRows.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">No assets found. Add assets in Asset Purchases.</p>
        </div>
      )}

      {selectedFY && registerRows.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Assets</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{registerRows.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Purchase Cost</p>
              <p className="text-xl font-extrabold text-slate-700 dark:text-slate-200">₹{fmt(totalCost)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Acc. Depreciation (IT)</p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">₹{fmt(totalAccDepIT)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Net WDV (IT)</p>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">₹{fmt(totalClosingWDVIT)}</p>
            </div>
          </div>

          {viewMode === 'register' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Asset Register — {selectedFY}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-bold">{registerRows.length} asset(s) as at end of {selectedFY}</p>
                </div>
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setDepView('IT')}
                    className={`px-4 py-2 text-xs font-extrabold transition ${depView === 'IT' ? `bg-${themeColor} text-white` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    Income Tax Act
                  </button>
                  <button
                    onClick={() => setDepView('CA')}
                    className={`px-4 py-2 text-xs font-extrabold transition ${depView === 'CA' ? `bg-${themeColor} text-white` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    Companies Act
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                {depView === 'IT' ? (
                  <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3">Asset ID</th>
                        <th className="px-4 py-3">Asset Type</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Fund Type</th>
                        <th className="px-4 py-3">Party</th>
                        <th className="px-4 py-3">Purchase Date</th>
                        <th className="px-4 py-3 text-right">Purchase Cost</th>
                        <th className="px-4 py-3 text-right">Opening WDV</th>
                        <th className="px-4 py-3 text-right">Rate (%)</th>
                        <th className="px-4 py-3 text-right">Dep. This FY</th>
                        <th className="px-4 py-3 text-right">Acc. Depreciation</th>
                        <th className="px-4 py-3 text-right">Closing WDV</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {registerRows.map((row) => (
                        <tr key={row.assetId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{row.assetId}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.assetType}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.location}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.fundType}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.partyName}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.dateOfPurchase}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.cost)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.openingWDV)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                            {row.rateIT > 0 ? `${row.rateIT}%` : <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">₹{fmt(row.currentDepIT)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.accDepIT)}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">₹{fmt(row.closingWDVIT)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 dark:bg-slate-900/60 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
                        <td colSpan={6} className="px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Total</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalCost)}</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(totalCurrentDepIT)}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalAccDepIT)}</td>
                        <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-300">₹{fmt(totalClosingWDVIT)}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3">Asset ID</th>
                        <th className="px-4 py-3">Asset Type</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Fund Type</th>
                        <th className="px-4 py-3">Party</th>
                        <th className="px-4 py-3">Purchase Date</th>
                        <th className="px-4 py-3 text-right">Purchase Cost</th>
                        <th className="px-4 py-3 text-right">Useful Life (Yrs)</th>
                        <th className="px-4 py-3 text-right">Salvage Value (₹)</th>
                        <th className="px-4 py-3 text-right">Dep. This FY</th>
                        <th className="px-4 py-3 text-right">Acc. Depreciation</th>
                        <th className="px-4 py-3 text-right">Closing WDV</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {registerRows.map((row) => (
                        <tr key={row.assetId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{row.assetId}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.assetType}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.location}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.fundType}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.partyName}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.dateOfPurchase}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.cost)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                            {row.usefulLife > 0 ? row.usefulLife : <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.salvageValue)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">₹{fmt(row.currentDepCA)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.accDepCA)}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">₹{fmt(row.closingWDVCA)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 dark:bg-slate-900/60 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
                        <td colSpan={6} className="px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Total</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalCost)}</td>
                        <td colSpan={2} className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(totalCurrentDepCA)}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalAccDepCA)}</td>
                        <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-300">₹{fmt(totalClosingWDVCA)}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {viewMode === 'summary' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Summary — {selectedFY}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-bold">Grouped analysis of fixed assets</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Group by:</span>
                  {(['assetType', 'location', 'fundType'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSummaryGroup(g)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold transition ${summaryGroup === g ? `bg-${themeColor} text-white border-transparent` : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      {g === 'assetType' ? 'Asset Type' : g === 'location' ? 'Location' : 'Fund Type'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3">{summaryGroup === 'assetType' ? 'Asset Type' : summaryGroup === 'location' ? 'Location' : 'Fund Type'}</th>
                      <th className="px-4 py-3 text-right">Assets</th>
                      <th className="px-4 py-3 text-right">Total Cost</th>
                      <th className="px-4 py-3 text-right">Dep. This FY (IT)</th>
                      <th className="px-4 py-3 text-right">Acc. Dep. (IT)</th>
                      <th className="px-4 py-3 text-right">Net WDV (IT)</th>
                      <th className="px-4 py-3 text-right">Dep. This FY (CA)</th>
                      <th className="px-4 py-3 text-right">Acc. Dep. (CA)</th>
                      <th className="px-4 py-3 text-right">Net WDV (CA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {summaryRows.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.key}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">{row.count}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.totalCost)}</td>
                        <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(row.totalCurrentDepIT)}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.totalAccDepIT)}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">₹{fmt(row.totalClosingWDVIT)}</td>
                        <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(row.totalCurrentDepCA)}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.totalAccDepCA)}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">₹{fmt(row.totalClosingWDVCA)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-900/60 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Total</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">{registerRows.length}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalCost)}</td>
                      <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(totalCurrentDepIT)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalAccDepIT)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-300">₹{fmt(totalClosingWDVIT)}</td>
                      <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(totalCurrentDepCA)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalAccDepCA)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-300">₹{fmt(totalClosingWDVCA)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
