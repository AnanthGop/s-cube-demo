import React, { useMemo, useState } from 'react';

interface FinancialYearItem {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
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

interface DepreciationPageProps {
  fyList: FinancialYearItem[];
  assetTypes: string[];
  depreciationRatesIT: DepreciationRateITItem[];
  depreciationRatesCA: DepreciationRateCAItem[];
  onUpdateIT: (items: DepreciationRateITItem[]) => void;
  onUpdateCA: (items: DepreciationRateCAItem[]) => void;
  themeColor?: string;
}

interface FormStateIT {
  fy: string;
  assetType: string;
  depreciationRate: string;
}

interface FormStateCA {
  fy: string;
  assetType: string;
  usefulLife: string;
  salvageValue: string;
}

const emptyFormIT: FormStateIT = {
  fy: '',
  assetType: '',
  depreciationRate: ''
};

const emptyFormCA: FormStateCA = {
  fy: '',
  assetType: '',
  usefulLife: '',
  salvageValue: ''
};

export const DepreciationPage: React.FC<DepreciationPageProps> = ({
  fyList,
  assetTypes,
  depreciationRatesIT,
  depreciationRatesCA,
  onUpdateIT,
  onUpdateCA,
  themeColor = 'brand-600'
}) => {
  const [selectedFY, setSelectedFY] = useState<string>('');
  const [formIT, setFormIT] = useState<FormStateIT>(emptyFormIT);
  const [formCA, setFormCA] = useState<FormStateCA>(emptyFormCA);

  const fyOptions = useMemo(() => {
    return (fyList || []).map((item) => ({
      id: item.id,
      label: String(item.name || '').trim(),
      value: String(item.name || '').trim()
    })).filter((item) => Boolean(item.label));
  }, [fyList]);

  const assetTypeOptions = useMemo(() => {
    const cleaned = (assetTypes || []).map((item) => String(item || '').trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  }, [assetTypes]);

  const filteredRatesIT = useMemo(() => {
    if (!selectedFY) return depreciationRatesIT || [];
    return (depreciationRatesIT || []).filter((item) => item.fy === selectedFY);
  }, [depreciationRatesIT, selectedFY]);

  const filteredRatesCA = useMemo(() => {
    if (!selectedFY) return depreciationRatesCA || [];
    return (depreciationRatesCA || []).filter((item) => item.fy === selectedFY);
  }, [depreciationRatesCA, selectedFY]);

  const extractYear = (fyName: string): number => {
    const match = fyName.match(/(\d{4})/g);
    if (match && match.length > 0) {
      return Number(match[0]);
    }
    return 0;
  };

  const getPreviousFY = () => {
    if (!selectedFY) return null;
    const currentYear = extractYear(selectedFY);
    if (currentYear === 0) return null;

    const previousYear = currentYear - 1;
    const candidateFY = fyOptions.find((fy) => extractYear(fy.value) === previousYear);
    return candidateFY?.value || null;
  };

  const importRatesIT = () => {
    const prevFY = getPreviousFY();
    if (!prevFY) {
      window.alert('No previous financial year found to import from.');
      return;
    }

    const prevRates = (depreciationRatesIT || []).filter((item) => item.fy === prevFY);
    if (prevRates.length === 0) {
      window.alert(`No depreciation rates found for ${prevFY}.`);
      return;
    }

    const existingAssetsInCurr = new Set(
      (depreciationRatesIT || [])
        .filter((item) => item.fy === selectedFY)
        .map((item) => item.assetType)
    );

    const ratesToImport: DepreciationRateITItem[] = prevRates
      .filter((rate) => !existingAssetsInCurr.has(rate.assetType))
      .map((rate) => ({
        ...rate,
        id: Date.now() + Math.random(),
        fy: selectedFY
      }));

    if (ratesToImport.length === 0) {
      window.alert('All rates from previous year already exist in current year.');
      return;
    }

    onUpdateIT([...(depreciationRatesIT || []), ...ratesToImport]);
    window.alert(`Imported ${ratesToImport.length} depreciation rate(s) from ${prevFY}.`);
  };

  const importRatesCA = () => {
    const prevFY = getPreviousFY();
    if (!prevFY) {
      window.alert('No previous financial year found to import from.');
      return;
    }

    const prevRates = (depreciationRatesCA || []).filter((item) => item.fy === prevFY);
    if (prevRates.length === 0) {
      window.alert(`No depreciation rates found for ${prevFY}.`);
      return;
    }

    const existingAssetsInCurr = new Set(
      (depreciationRatesCA || [])
        .filter((item) => item.fy === selectedFY)
        .map((item) => item.assetType)
    );

    const ratesToImport: DepreciationRateCAItem[] = prevRates
      .filter((rate) => !existingAssetsInCurr.has(rate.assetType))
      .map((rate) => ({
        ...rate,
        id: Date.now() + Math.random(),
        fy: selectedFY
      }));

    if (ratesToImport.length === 0) {
      window.alert('All rates from previous year already exist in current year.');
      return;
    }

    onUpdateCA([...(depreciationRatesCA || []), ...ratesToImport]);
    window.alert(`Imported ${ratesToImport.length} depreciation rate(s) from ${prevFY}.`);
  };

  const saveIT = () => {
    if (!formIT.fy || !formIT.assetType || !formIT.depreciationRate) {
      window.alert('Please fill all required fields.');
      return;
    }

    const depRate = Number(formIT.depreciationRate) || 0;
    if (depRate < 0 || depRate > 100) {
      window.alert('Depreciation Rate should be between 0 and 100.');
      return;
    }

    const payload: DepreciationRateITItem = {
      id: Date.now(),
      fy: formIT.fy,
      assetType: formIT.assetType,
      depreciationRate: String(depRate)
    };

    onUpdateIT([...(depreciationRatesIT || []), payload]);
    setFormIT(emptyFormIT);
    window.alert('Income Tax depreciation rate saved successfully.');
  };

  const saveCA = () => {
    if (!formCA.fy || !formCA.assetType || !formCA.usefulLife || !formCA.salvageValue) {
      window.alert('Please fill all required fields.');
      return;
    }

    const life = Number(formCA.usefulLife) || 0;
    const salvage = Number(formCA.salvageValue) || 0;

    if (life <= 0) {
      window.alert('Useful Life should be greater than 0.');
      return;
    }

    if (salvage < 0) {
      window.alert('Salvage Value cannot be negative.');
      return;
    }

    const payload: DepreciationRateCAItem = {
      id: Date.now(),
      fy: formCA.fy,
      assetType: formCA.assetType,
      usefulLife: String(life),
      salvageValue: String(salvage)
    };

    onUpdateCA([...(depreciationRatesCA || []), payload]);
    setFormCA(emptyFormCA);
    window.alert('Companies Act depreciation rate saved successfully.');
  };

  const removeIT = (id: number) => {
    onUpdateIT((depreciationRatesIT || []).filter((item) => item.id !== id));
  };

  const removeCA = (id: number) => {
    onUpdateCA((depreciationRatesCA || []).filter((item) => item.id !== id));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Depreciation Masters Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Depreciation Masters</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Maintain depreciation rates as per Income Tax Act and Companies Act, 2013</p>
        </div>

        <div className="p-6 space-y-6">
          {/* FY Selector Section */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">Select Financial Year</h3>
            <div className="space-y-4">
              <div className="max-w-xs">
                <select
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="">All Financial Years</option>
                  {fyOptions.map((fy) => (
                    <option key={fy.id} value={fy.value}>{fy.label}</option>
                  ))}
                </select>
              </div>

              {selectedFY && getPreviousFY() && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={importRatesIT}
                    className="px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700 text-xs font-extrabold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    Import IT Rates from {getPreviousFY()}
                  </button>
                  <button
                    onClick={importRatesCA}
                    className="px-4 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
                  >
                    Import CA Rates from {getPreviousFY()}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Income Tax Act Depreciation Rates Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Depreciation Rates - Income Tax Act</h3>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 space-y-4">
              {selectedFY ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Financial Year</label>
                      <input
                        value={selectedFY}
                        readOnly
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/70 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Select Asset</label>
                      <select
                        value={formIT.assetType}
                        onChange={(e) => setFormIT((prev) => ({ ...prev, assetType: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                      >
                        <option value="">Select Asset Type</option>
                        {assetTypeOptions.map((asset) => (
                          <option key={asset} value={asset}>{asset}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Depreciation Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formIT.depreciationRate}
                        onChange={(e) => setFormIT((prev) => ({ ...prev, depreciationRate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveIT}
                      className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
                    >
                      Save Rate
                    </button>
                    <button
                      onClick={() => setFormIT(emptyFormIT)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-extrabold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      Clear
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-center bg-white dark:bg-slate-900/20">
                  <p className="text-sm text-slate-600 dark:text-slate-300">Select a financial year to add or view depreciation rates.</p>
                </div>
              )}

              {filteredRatesIT.length > 0 && (
                <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="px-3 py-2">Financial Year</th>
                          <th className="px-3 py-2">Asset Type</th>
                          <th className="px-3 py-2 text-right">Rate (%)</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredRatesIT.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.fy}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.assetType}</td>
                            <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-200">{row.depreciationRate}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => removeIT(row.id)}
                                className="px-2 py-1 rounded border border-rose-300 dark:border-rose-700 text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Companies Act Depreciation Rates Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Depreciation Rates - Companies Act, 2013</h3>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 space-y-4">
              {selectedFY ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Financial Year</label>
                      <input
                        value={selectedFY}
                        readOnly
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/70 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Select Asset</label>
                      <select
                        value={formCA.assetType}
                        onChange={(e) => setFormCA((prev) => ({ ...prev, assetType: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                      >
                        <option value="">Select Asset Type</option>
                        {assetTypeOptions.map((asset) => (
                          <option key={asset} value={asset}>{asset}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Useful Life (Years)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formCA.usefulLife}
                        onChange={(e) => setFormCA((prev) => ({ ...prev, usefulLife: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Salvage Value</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formCA.salvageValue}
                        onChange={(e) => setFormCA((prev) => ({ ...prev, salvageValue: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveCA}
                      className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
                    >
                      Save Rate
                    </button>
                    <button
                      onClick={() => setFormCA(emptyFormCA)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-extrabold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      Clear
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-center bg-white dark:bg-slate-900/20">
                  <p className="text-sm text-slate-600 dark:text-slate-300">Select a financial year to add or view depreciation rates.</p>
                </div>
              )}

              {filteredRatesCA.length > 0 && (
                <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="px-3 py-2">Financial Year</th>
                          <th className="px-3 py-2">Asset Type</th>
                          <th className="px-3 py-2 text-right">Life (Years)</th>
                          <th className="px-3 py-2 text-right">Salvage Value</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredRatesCA.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.fy}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.assetType}</td>
                            <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-200">{row.usefulLife}</td>
                            <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-200">{row.salvageValue}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => removeCA(row.id)}
                                className="px-2 py-1 rounded border border-rose-300 dark:border-rose-700 text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Depreciation Calculation Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Depreciation Calculation</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Calculate depreciation for assets</p>
        </div>

        <div className="p-6">
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center bg-slate-50 dark:bg-slate-900/40">
            <p className="text-sm text-slate-600 dark:text-slate-300">Depreciation calculation features coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
