import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { CompactDatePicker } from '../shared/CompactDatePicker';

interface AssetPurchaseItem {
  id: number;
  assetId: string;
  dateOfPurchase: string;
  location?: string;
  fundType?: string;
  assetType: string;
  totalInvoiceValue: string;
}

interface AssetDisposalItem {
  id: number;
  disposalDate: string;
  assetId: string;
  assetType: string;
  location: string;
  fundType: string;
  purchaseDate: string;
  disposalType: 'Sale' | 'Scrap' | 'Write-off';
  bookValue: string;
  accumulatedDepreciation: string;
  wdv: string;
  saleValue: string;
  profitOrLoss: string;
  narration: string;
}

interface AssetDisposalPageProps {
  purchases: AssetPurchaseItem[];
  disposals: AssetDisposalItem[];
  onUpdate: (items: AssetDisposalItem[]) => void;
  themeColor?: string;
}

interface FormState {
  disposalDate: string;
  assetId: string;
  disposalType: 'Sale' | 'Scrap' | 'Write-off';
  bookValue: string;
  accumulatedDepreciation: string;
  saleValue: string;
  narration: string;
}

interface DeleteConfirmState {
  ids: number[];
  title: string;
  message: string;
}

const PAGE_SIZE = 10;

const emptyForm: FormState = {
  disposalDate: '',
  assetId: '',
  disposalType: 'Sale',
  bookValue: '',
  accumulatedDepreciation: '0',
  saleValue: '',
  narration: ''
};

const toDDMMYYYY = (isoDate: string) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

const toIsoDateInput = (value: string) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const parseAmount = (value: string) => {
  const n = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const formatIndianAmount = (value: number) => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const AssetDisposalPage: React.FC<AssetDisposalPageProps> = ({
  purchases,
  disposals,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const disposedAssetIds = useMemo(
    () => new Set((disposals || []).filter((item) => item.id !== editingId).map((item) => item.assetId)),
    [disposals, editingId]
  );

  const availableAssets = useMemo(
    () => (purchases || []).filter((item) => !disposedAssetIds.has(item.assetId)),
    [purchases, disposedAssetIds]
  );

  const selectedAsset = useMemo(
    () => availableAssets.find((item) => item.assetId === form.assetId) || null,
    [availableAssets, form.assetId]
  );

  const bookValue = parseAmount(form.bookValue || (selectedAsset?.totalInvoiceValue || '0'));
  const accumulatedDepreciation = parseAmount(form.accumulatedDepreciation);
  const wdv = round2(Math.max(bookValue - accumulatedDepreciation, 0));
  const saleValue = parseAmount(form.saleValue);
  const effectiveSaleValue = form.disposalType === 'Write-off' ? 0 : saleValue;
  const profitOrLoss = round2(effectiveSaleValue - wdv);

  const filteredData = useMemo(() => {
    const query = filterValue.trim().toLowerCase();
    if (!query) return disposals || [];
    return (disposals || []).filter((item) =>
      [
        item.assetId,
        item.assetType,
        item.location,
        item.fundType,
        item.disposalType,
        item.narration
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [disposals, filterValue]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredData]);

  const pageStart = filteredData.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredData.length);
  const allVisibleSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(item.id));

  useEffect(() => {
    setCurrentPage(1);
  }, [filterValue]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleAssetChange = (assetId: string) => {
    const picked = availableAssets.find((item) => item.assetId === assetId);
    setForm((prev) => ({
      ...prev,
      assetId,
      bookValue: String(parseAmount(picked?.totalInvoiceValue || '0')),
      accumulatedDepreciation: prev.assetId === assetId ? prev.accumulatedDepreciation : '0',
      saleValue: prev.disposalType === 'Write-off' ? '0' : prev.saleValue
    }));
  };

  const resetFormState = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (item: AssetDisposalItem) => {
    setEditingId(item.id);
    setForm({
      disposalDate: toIsoDateInput(item.disposalDate),
      assetId: item.assetId,
      disposalType: item.disposalType,
      bookValue: String(item.bookValue || ''),
      accumulatedDepreciation: String(item.accumulatedDepreciation || '0'),
      saleValue: item.disposalType === 'Write-off' ? '' : String(item.saleValue || ''),
      narration: item.narration || ''
    });
    setIsFormOpen(true);
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        paginatedData.forEach((item) => next.delete(item.id));
      } else {
        paginatedData.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const requestDeleteRows = (ids: number[]) => {
    if (ids.length === 0) {
      window.alert('Please select at least one entry to delete.');
      return;
    }
    setDeleteConfirm({
      ids,
      title: ids.length === 1 ? 'Delete Asset Disposal?' : 'Delete Selected Asset Disposals?',
      message: ids.length === 1
        ? 'This asset disposal entry will be removed permanently.'
        : `${ids.length} selected asset disposal entries will be removed permanently.`
    });
  };

  const confirmDeleteRows = () => {
    if (!deleteConfirm) return;
    const ids = deleteConfirm.ids;
    onUpdate((disposals || []).filter((item) => !ids.includes(item.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteConfirm(null);
  };

  const saveDisposal = () => {
    if (!form.disposalDate || !form.assetId || !selectedAsset) {
      window.alert('Please select disposal date and asset ID.');
      return;
    }

    const payload: AssetDisposalItem = {
      id: editingId ?? Date.now(),
      disposalDate: toDDMMYYYY(form.disposalDate),
      assetId: selectedAsset.assetId,
      assetType: selectedAsset.assetType,
      location: selectedAsset.location || '-',
      fundType: selectedAsset.fundType || '-',
      purchaseDate: selectedAsset.dateOfPurchase,
      disposalType: form.disposalType,
      bookValue: String(bookValue),
      accumulatedDepreciation: String(accumulatedDepreciation),
      wdv: String(wdv),
      saleValue: String(effectiveSaleValue),
      profitOrLoss: String(profitOrLoss),
      narration: form.narration || ''
    };

    const next = editingId !== null
      ? (disposals || []).map((item) => (item.id === editingId ? payload : item))
      : [...(disposals || []), payload];

    onUpdate(next);
    resetFormState();
    window.alert(editingId !== null ? 'Asset disposal updated successfully.' : 'Asset disposal saved successfully.');
  };

  if (isFormOpen) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className={`bg-${themeColor} px-10 py-8 text-white flex justify-between items-center`}>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                {editingId !== null ? 'Edit Asset Disposal' : 'Add Asset Disposal'}
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Record sale, scrap, and write-off disposal entries.
              </p>
            </div>
            <button
              onClick={resetFormState}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
            >
              Back to List
            </button>
          </div>

          <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Disposal Date</label>
                <CompactDatePicker
                  value={form.disposalDate}
                  onChange={(value) => setForm((prev) => ({ ...prev, disposalDate: value }))}
                  className="border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset ID</label>
                <select
                  value={form.assetId}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                >
                  <option value="">Select Asset ID</option>
                  {availableAssets.map((item) => (
                    <option key={item.assetId} value={item.assetId}>
                      {item.assetId} - {item.assetType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Disposal Type</label>
                <select
                  value={form.disposalType}
                  onChange={(e) => {
                    const type = e.target.value as FormState['disposalType'];
                    setForm((prev) => ({ ...prev, disposalType: type, saleValue: type === 'Write-off' ? '0' : prev.saleValue }));
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                >
                  <option value="Sale">Sale</option>
                  <option value="Scrap">Scrap</option>
                  <option value="Write-off">Write-off</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Location</label>
                <input
                  value={selectedAsset?.location || '-'}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Fund Type</label>
                <input
                  value={selectedAsset?.fundType || '-'}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Book Value</label>
                <input
                  value={form.bookValue || selectedAsset?.totalInvoiceValue || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, bookValue: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Accumulated Depreciation</label>
                <input
                  value={form.accumulatedDepreciation}
                  onChange={(e) => setForm((prev) => ({ ...prev, accumulatedDepreciation: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">WDV</label>
                <input
                  value={formatIndianAmount(wdv)}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Sale Value</label>
                <input
                  value={form.disposalType === 'Write-off' ? '0' : form.saleValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, saleValue: e.target.value.replace(/[^0-9.]/g, '') }))}
                  disabled={form.disposalType === 'Write-off'}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Profit / Loss</label>
                <input
                  value={formatIndianAmount(profitOrLoss)}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none text-sm text-slate-600"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Narration</label>
                <textarea
                  value={form.narration}
                  onChange={(e) => setForm((prev) => ({ ...prev, narration: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="Optional disposal notes"
                />
              </div>
            </div>

            <div className="pt-6 mt-8 border-t border-slate-200 flex justify-end gap-4">
              <button
                onClick={resetFormState}
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveDisposal}
                className={`px-10 py-3 bg-${themeColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg`}
              >
                {editingId !== null ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500 w-full">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white`}>
          <h1 className="text-2xl font-black tracking-tight uppercase">Asset Disposal Management</h1>
          <p className="text-white/80 text-xs font-medium mt-1">
            Table includes all asset disposal columns. Use add or edit to open the form.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateForm}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
            >
              Add Record
            </button>
            <button
              onClick={() => requestDeleteRows(Array.from(selectedIds))}
              className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
            >
              Delete Record
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg scrollbar-hide">
            <table className="w-full min-w-max text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-300">
                  <th className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectVisible}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-brand-600"
                    />
                  </th>
                  <th className="px-4 py-4">Disposal Date</th>
                  <th className="px-4 py-4">Asset ID</th>
                  <th className="px-4 py-4">Asset Type</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Fund Type</th>
                  <th className="px-4 py-4">Purchase Date</th>
                  <th className="px-4 py-4">Disposal Type</th>
                  <th className="px-4 py-4 text-right">Book Value</th>
                  <th className="px-4 py-4 text-right">Accumulated Depreciation</th>
                  <th className="px-4 py-4 text-right">WDV</th>
                  <th className="px-4 py-4 text-right">Sale Value</th>
                  <th className="px-4 py-4 text-right">Profit / Loss</th>
                  <th className="px-4 py-4">Narration</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-3 py-2"></th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Filter..."
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[9px] font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelectRow(item.id)}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-brand-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs">{item.disposalDate}</td>
                    <td className="px-4 py-3 text-xs font-bold">{item.assetId}</td>
                    <td className="px-4 py-3 text-xs">{item.assetType}</td>
                    <td className="px-4 py-3 text-xs">{item.location}</td>
                    <td className="px-4 py-3 text-xs">{item.fundType || '-'}</td>
                    <td className="px-4 py-3 text-xs">{item.purchaseDate}</td>
                    <td className="px-4 py-3 text-xs">{item.disposalType}</td>
                    <td className="px-4 py-3 text-xs text-right">Rs. {formatIndianAmount(Number(item.bookValue || 0))}</td>
                    <td className="px-4 py-3 text-xs text-right">Rs. {formatIndianAmount(Number(item.accumulatedDepreciation || 0))}</td>
                    <td className="px-4 py-3 text-xs text-right">Rs. {formatIndianAmount(Number(item.wdv || 0))}</td>
                    <td className="px-4 py-3 text-xs text-right">Rs. {formatIndianAmount(Number(item.saleValue || 0))}</td>
                    <td className={`px-4 py-3 text-xs text-right font-black ${Number(item.profitOrLoss || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Rs. {formatIndianAmount(Number(item.profitOrLoss || 0))}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[220px] truncate">{item.narration}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditForm(item)}
                          className="inline-flex items-center justify-center rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 transition"
                          aria-label={`Edit ${item.assetId}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => requestDeleteRows([item.id])}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 transition"
                          aria-label={`Delete ${item.assetId}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-8 text-center text-sm text-slate-500">
                      No asset disposal records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500 font-semibold md:flex-row md:items-center md:justify-between">
            <div>
              Showing <span className="font-black text-brand-600">{pageStart}-{pageEnd}</span> of <span className="font-black">{filteredData.length}</span> entries
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="min-w-[88px] text-center text-xs font-black text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 size={20} />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">{deleteConfirm.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{deleteConfirm.message}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-rose-500">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDeleteRows} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-rose-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};







