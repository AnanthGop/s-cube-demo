import React, { useMemo, useState } from 'react';
import { ArrowLeft, Calculator, Trash2, Download, RefreshCw } from 'lucide-react';

interface FYItem {
  id: number;
  name: string;
}

interface AssetPurchaseItem {
  id: number;
  assetId: string;
  dateOfPurchase: string;
  partyName: string;
  assetType: string;
  totalInvoiceValue: string;
  narration: string;
  location?: string;
  fundType?: string;
}

interface DepreciationRateITItem {
  id: number;
  fy: string;
  assetType: string;
  depreciationRate: string;
}

interface DepreciationRateCAItem {
  id: number;
  fy: string;
  assetType: string;
  usefulLife: string;
  salvageValue: string;
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

interface DepreciationCalculationPageProps {
  fyList: FYItem[];
  purchases: AssetPurchaseItem[];
  depreciationRatesIT: DepreciationRateITItem[];
  depreciationRatesCA: DepreciationRateCAItem[];
  depreciationRegister: DepreciationRegisterItem[];
  onUpdateRegister: (data: DepreciationRegisterItem[]) => void;
  themeColor?: string;
  onBack?: () => void;
}

const round2 = (v: number) => Math.round(v * 100) / 100;
const fmt = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DepreciationCalculationPage({
  fyList,
  purchases,
  depreciationRatesIT,
  depreciationRatesCA,
  depreciationRegister,
  onUpdateRegister,
  themeColor = 'brand-600',
  onBack,
}: DepreciationCalculationPageProps) {
  const [selectedFY, setSelectedFY] = useState('');
  const [viewMode, setViewMode] = useState<'IT' | 'CA'>('IT');

  const fyOptions = useMemo(() =>
    (fyList || []).map((f) => ({ id: f.id, label: String(f.name || '').trim(), value: String(f.name || '').trim() })).filter((f) => f.label),
    [fyList]
  );

  const registerForFY = useMemo(() =>
    (depreciationRegister || []).filter((r) => r.fy === selectedFY),
    [depreciationRegister, selectedFY]
  );

  const extractYear = (fyName: string): number => {
    const match = fyName.match(/(\d{4})/g);
    return match && match.length > 0 ? Number(match[0]) : 0;
  };

  const getPreviousFYName = (fy: string): string | null => {
    const currentYear = extractYear(fy);
    if (currentYear === 0) return null;
    const prev = fyOptions.find((f) => extractYear(f.value) === currentYear - 1);
    return prev?.value || null;
  };

  const calculateDepreciation = () => {
    if (!selectedFY) {
      window.alert('Please select a financial year.');
      return;
    }

    const prevFY = getPreviousFYName(selectedFY);

    // Remove existing entries for this FY and recalculate
    const otherEntries = (depreciationRegister || []).filter((r) => r.fy !== selectedFY);

    const newEntries: DepreciationRegisterItem[] = (purchases || []).map((asset) => {
      const cost = Number(String(asset.totalInvoiceValue || '0').replace(/,/g, '')) || 0;

      // Find previous year's closing WDV for this asset
      const prevEntry = prevFY
        ? (depreciationRegister || []).find((r) => r.fy === prevFY && r.assetId === asset.assetId)
        : null;
      const openingWDV = prevEntry ? prevEntry.closingWDVIT : cost;

      // IT Act rate
      const itRate = (depreciationRatesIT || []).find(
        (r) => r.fy === selectedFY && r.assetType === asset.assetType
      );
      const rateIT = itRate ? (Number(itRate.depreciationRate) || 0) : 0;
      const depAmtIT = round2(openingWDV * rateIT / 100);
      const closingIT = round2(Math.max(0, openingWDV - depAmtIT));

      // Companies Act rate (SLM)
      const caRate = (depreciationRatesCA || []).find(
        (r) => r.fy === selectedFY && r.assetType === asset.assetType
      );
      const usefulLife = caRate ? (Number(caRate.usefulLife) || 0) : 0;
      const salvageValuePct = caRate ? (Number(caRate.salvageValue) || 0) : 0;
      const salvageValue = round2(cost * salvageValuePct / 100);
      const openingWDVCA = prevEntry ? prevEntry.closingWDVCA : cost;
      const depAmtCA = usefulLife > 0 ? round2((cost - salvageValue) / usefulLife) : 0;
      const closingCA = round2(Math.max(salvageValue, openingWDVCA - depAmtCA));

      return {
        id: Date.now() + Math.random(),
        fy: selectedFY,
        assetId: asset.assetId,
        assetType: asset.assetType,
        partyName: asset.partyName,
        dateOfPurchase: asset.dateOfPurchase,
        location: asset.location || '',
        fundType: asset.fundType || '',
        costOfAsset: cost,
        openingWDV,
        depreciationRateIT: rateIT,
        depreciationAmountIT: depAmtIT,
        closingWDVIT: closingIT,
        usefulLife,
        salvageValue,
        depreciationAmountCA: depAmtCA,
        closingWDVCA: closingCA,
        calculatedOn: new Date().toISOString(),
      };
    });

    onUpdateRegister([...otherEntries, ...newEntries]);
    window.alert(`Depreciation calculated for ${newEntries.length} asset(s) for FY ${selectedFY}.`);
  };

  const deleteDepreciation = () => {
    if (!selectedFY) {
      window.alert('Please select a financial year.');
      return;
    }
    if (!window.confirm(`Delete all depreciation records for FY ${selectedFY}?`)) return;
    onUpdateRegister((depreciationRegister || []).filter((r) => r.fy !== selectedFY));
  };

  const exportCSV = () => {
    if (registerForFY.length === 0) {
      window.alert('No data to export.');
      return;
    }

    const headers = viewMode === 'IT'
      ? ['FY', 'Asset ID', 'Asset Type', 'Party', 'Date of Purchase', 'Location', 'Fund Type', 'Cost', 'Opening WDV', 'IT Rate (%)', 'Depreciation (IT)', 'Closing WDV (IT)']
      : ['FY', 'Asset ID', 'Asset Type', 'Party', 'Date of Purchase', 'Location', 'Fund Type', 'Cost', 'Useful Life (Yrs)', 'Salvage Value', 'Depreciation (CA)', 'Closing WDV (CA)'];

    const rows = registerForFY.map((r) => viewMode === 'IT'
      ? [r.fy, r.assetId, r.assetType, r.partyName, r.dateOfPurchase, r.location, r.fundType, r.costOfAsset, r.openingWDV, r.depreciationRateIT, r.depreciationAmountIT, r.closingWDVIT]
      : [r.fy, r.assetId, r.assetType, r.partyName, r.dateOfPurchase, r.location, r.fundType, r.costOfAsset, r.usefulLife, r.salvageValue, r.depreciationAmountCA, r.closingWDVCA]
    );

    const csvContent = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Depreciation_Register_${selectedFY || 'All'}_${viewMode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDepIT = registerForFY.reduce((s, r) => s + r.depreciationAmountIT, 0);
  const totalDepCA = registerForFY.reduce((s, r) => s + r.depreciationAmountCA, 0);
  const totalClosingIT = registerForFY.reduce((s, r) => s + r.closingWDVIT, 0);
  const totalClosingCA = registerForFY.reduce((s, r) => s + r.closingWDVCA, 0);
  const totalCost = registerForFY.reduce((s, r) => s + r.costOfAsset, 0);
  const totalOpeningWDV = registerForFY.reduce((s, r) => s + r.openingWDV, 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-semibold">Back to Depreciation</span>
        </button>
      )}

      {/* Controls Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Depreciation Calculation</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Calculate and manage depreciation for fixed assets</p>
        </div>

        <div className="p-6 space-y-4">
          {/* FY Selector + Actions */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] max-w-xs">
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

            <button
              onClick={calculateDepreciation}
              disabled={!selectedFY}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Calculator size={16} />
              Calculate Depreciation
            </button>

            <button
              onClick={deleteDepreciation}
              disabled={!selectedFY || registerForFY.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-sm font-extrabold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              Delete Depreciation
            </button>
          </div>

          {/* Info banner when FY is selected */}
          {selectedFY && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2">
              <RefreshCw size={12} />
              {registerForFY.length > 0
                ? `${registerForFY.length} asset(s) computed for ${selectedFY}. Click Calculate to recalculate.`
                : `No depreciation calculated yet for ${selectedFY}. Click Calculate to run.`
              }
            </div>
          )}
        </div>
      </div>

      {/* Depreciation Register */}
      {registerForFY.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Depreciation Register — {selectedFY}</h3>
              <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-bold">
                Calculated on {new Date(registerForFY[0]?.calculatedOn || '').toLocaleDateString('en-IN')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* IT / CA Toggle */}
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setViewMode('IT')}
                  className={`px-4 py-2 text-xs font-extrabold transition ${viewMode === 'IT' ? `bg-${themeColor} text-white` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  Income Tax Act
                </button>
                <button
                  onClick={() => setViewMode('CA')}
                  className={`px-4 py-2 text-xs font-extrabold transition ${viewMode === 'CA' ? `bg-${themeColor} text-white` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  Companies Act
                </button>
              </div>

              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Assets</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{registerForFY.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Depreciation {viewMode === 'IT' ? '(IT)' : '(CA)'}</p>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                ₹{fmt(viewMode === 'IT' ? totalDepIT : totalDepCA)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Closing WDV {viewMode === 'IT' ? '(IT)' : '(CA)'}</p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                ₹{fmt(viewMode === 'IT' ? totalClosingIT : totalClosingCA)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Financial Year</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">{selectedFY}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {viewMode === 'IT' ? (
              <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3">Asset ID</th>
                    <th className="px-4 py-3">Asset Type</th>
                    <th className="px-4 py-3">Party</th>
                    <th className="px-4 py-3">Date of Purchase</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Fund Type</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Opening WDV</th>
                    <th className="px-4 py-3 text-right">Rate (%)</th>
                    <th className="px-4 py-3 text-right">Depreciation</th>
                    <th className="px-4 py-3 text-right">Closing WDV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {registerForFY.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{row.assetId}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.assetType}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.partyName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.dateOfPurchase}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.location || <span className="text-slate-400 italic">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.fundType || <span className="text-slate-400 italic">—</span>}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.costOfAsset)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.openingWDV)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                        {row.depreciationRateIT > 0 ? `${row.depreciationRateIT}%` : <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">₹{fmt(row.depreciationAmountIT)}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">₹{fmt(row.closingWDVIT)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 dark:bg-slate-900/60 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
                    <td colSpan={6} className="px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Total</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalCost)}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalOpeningWDV)}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(totalDepIT)}</td>
                    <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-300">₹{fmt(totalClosingIT)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3">Asset ID</th>
                    <th className="px-4 py-3">Asset Type</th>
                    <th className="px-4 py-3">Party</th>
                    <th className="px-4 py-3">Date of Purchase</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Fund Type</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Useful Life (Yrs)</th>
                    <th className="px-4 py-3 text-right">Salvage Value (₹)</th>
                    <th className="px-4 py-3 text-right">Depreciation</th>
                    <th className="px-4 py-3 text-right">Closing WDV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {registerForFY.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{row.assetId}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.assetType}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.partyName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.dateOfPurchase}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.location || <span className="text-slate-400 italic">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.fundType || <span className="text-slate-400 italic">—</span>}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.costOfAsset)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                        {row.usefulLife > 0 ? row.usefulLife : <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(row.salvageValue)}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">₹{fmt(row.depreciationAmountCA)}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">₹{fmt(row.closingWDVCA)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 dark:bg-slate-900/60 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
                    <td colSpan={6} className="px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Total</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">₹{fmt(totalCost)}</td>
                    <td colSpan={2} className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{fmt(totalDepCA)}</td>
                    <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-300">₹{fmt(totalClosingCA)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

