import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { CompactDatePicker } from '../shared/CompactDatePicker';

interface AssetPurchaseItem {
  id: number;
  assetId: string;
  dateOfPurchase: string;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  location: string;
  fundType: string;
  assetType: string;
  amountBeforeGst: string;
  gstAmount: string;
  totalInvoiceValue: string;
  quantity: number;
  narration: string;
}

interface AssetPurchasesPageProps {
  data: AssetPurchaseItem[];
  onUpdate: (items: AssetPurchaseItem[]) => void;
  assetTypes?: string[];
  locationsList?: Array<{ id: number; name: string }>;
  fundTypes?: Array<{ id: number; name: string; code?: string }>;
  themeColor?: string;
}

interface FormState {
  dateOfPurchase: string;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  location: string;
  fundType: string;
  assetType: string;
  amountBeforeGst: string;
  gstAmount: string;
  quantity: string;
  narration: string;
}

interface DeleteConfirmState {
  ids: number[];
  title: string;
  message: string;
}

const PAGE_SIZE = 10;

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

const formatIndianAmount = (value: number) => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const parseAmount = (value: string) => {
  const n = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const splitAmount = (total: number, parts: number) => {
  if (parts <= 1) return [round2(total)];
  const unit = round2(total / parts);
  const values = Array.from({ length: parts }, () => unit);
  const allocated = round2(unit * parts);
  const diff = round2(total - allocated);
  values[parts - 1] = round2(values[parts - 1] + diff);
  return values;
};

const getMaxSerial = (items: AssetPurchaseItem[]) => {
  return items.reduce((max, item) => {
    const match = String(item.assetId || '').match(/(\d+)$/);
    if (!match) return max;
    const serial = Number(match[1]);
    return Number.isFinite(serial) ? Math.max(max, serial) : max;
  }, 0);
};

const buildAssetId = (serial: number) => {
  const year = new Date().getFullYear();
  return `AST-${year}-${String(serial).padStart(5, '0')}`;
};

const emptyForm: FormState = {
  dateOfPurchase: '',
  invoiceNumber: '',
  invoiceDate: '',
  partyName: '',
  location: '',
  fundType: '',
  assetType: '',
  amountBeforeGst: '',
  gstAmount: '',
  quantity: '1',
  narration: ''
};

export const AssetPurchasesPage: React.FC<AssetPurchasesPageProps> = ({
  data,
  onUpdate,
  assetTypes = [],
  locationsList = [],
  fundTypes = [],
  themeColor = 'brand-600'
}) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const options = useMemo(() => {
    const cleaned = (assetTypes || []).map((item) => String(item || '').trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
    return ['Office Equipment', 'Computer', 'Furniture', 'Vehicle'];
  }, [assetTypes]);

  const locationOptions = useMemo(() => {
    const cleaned = (locationsList || []).map((item) => String(item?.name || '').trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  }, [locationsList]);

  const fundTypeOptions = useMemo(() => {
    const normalized = (fundTypes || [])
      .map((item) => {
        const text = `${item.code || ''} ${item.name || ''}`.toLowerCase();
        if (text.includes('fcra') || /\bfc\b/.test(text)) return 'FCRA';
        if (text.includes('local') || /\blc\b/.test(text)) return 'Local';
        const fallback = String(item.name || '').trim();
        return fallback || null;
      })
      .filter((value): value is string => Boolean(value));
    const deduped = Array.from(new Set(normalized));
    return deduped.length > 0 ? deduped : ['Local', 'FCRA'];
  }, [fundTypes]);

  const amountBefore = parseAmount(form.amountBeforeGst);
  const gstAmount = parseAmount(form.gstAmount);
  const totalInvoiceValue = round2(amountBefore + gstAmount);

  const filteredData = useMemo(() => {
    const query = filterValue.trim().toLowerCase();
    if (!query) return data || [];
    return (data || []).filter((item) =>
      [
        item.assetId,
        item.invoiceNumber,
        item.partyName,
        item.location,
        item.assetType,
        item.fundType
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [data, filterValue]);

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

  const openEditForm = (item: AssetPurchaseItem) => {
    setEditingId(item.id);
    setForm({
      dateOfPurchase: toIsoDateInput(item.dateOfPurchase),
      invoiceNumber: item.invoiceNumber || '',
      invoiceDate: toIsoDateInput(item.invoiceDate),
      partyName: item.partyName || '',
      location: item.location || '',
      fundType: item.fundType || '',
      assetType: item.assetType || '',
      amountBeforeGst: String(item.amountBeforeGst || ''),
      gstAmount: String(item.gstAmount || ''),
      quantity: String(item.quantity || 1),
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
      title: ids.length === 1 ? 'Delete Asset Addition?' : 'Delete Selected Asset Additions?',
      message: ids.length === 1
        ? 'This asset addition entry will be removed permanently.'
        : `${ids.length} selected asset addition entries will be removed permanently.`
    });
  };

  const confirmDeleteRows = () => {
    if (!deleteConfirm) return;
    const ids = deleteConfirm.ids;
    onUpdate((data || []).filter((item) => !ids.includes(item.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteConfirm(null);
  };

  const savePurchase = () => {
    const quantity = Number(form.quantity || 0);
    if (!form.dateOfPurchase || !form.invoiceNumber || !form.invoiceDate || !form.partyName || !form.location || !form.fundType || !form.assetType || quantity <= 0) {
      window.alert('Please fill all required fields and enter a valid quantity.');
      return;
    }

    const dateOfPurchase = toDDMMYYYY(form.dateOfPurchase);
    const invoiceDate = toDDMMYYYY(form.invoiceDate);

    if (editingId !== null) {
      const next = (data || []).map((item) =>
        item.id === editingId
          ? {
              ...item,
              dateOfPurchase,
              invoiceNumber: form.invoiceNumber,
              invoiceDate,
              partyName: form.partyName,
              location: form.location,
              fundType: form.fundType,
              assetType: form.assetType,
              amountBeforeGst: String(amountBefore),
              gstAmount: String(gstAmount),
              totalInvoiceValue: String(totalInvoiceValue),
              quantity,
              narration: form.narration || ''
            }
          : item
      );
      onUpdate(next);
      resetFormState();
      window.alert('Asset addition updated successfully.');
      return;
    }

    const shouldSplit = quantity > 1
      ? window.confirm('Do you want to split total amount by quantity and create separate asset IDs for each unit?')
      : false;

    const nextSerialStart = getMaxSerial(data || []) + 1;
    const createdItems: AssetPurchaseItem[] = [];

    if (shouldSplit) {
      const beforeParts = splitAmount(amountBefore, quantity);
      const gstParts = splitAmount(gstAmount, quantity);
      const totalParts = splitAmount(totalInvoiceValue, quantity);

      for (let index = 0; index < quantity; index += 1) {
        const serial = nextSerialStart + index;
        createdItems.push({
          id: Date.now() + index,
          assetId: buildAssetId(serial),
          dateOfPurchase,
          invoiceNumber: form.invoiceNumber,
          invoiceDate,
          partyName: form.partyName,
          location: form.location,
          fundType: form.fundType,
          assetType: form.assetType,
          amountBeforeGst: String(beforeParts[index]),
          gstAmount: String(gstParts[index]),
          totalInvoiceValue: String(totalParts[index]),
          quantity: 1,
          narration: form.narration || ''
        });
      }
    } else {
      createdItems.push({
        id: Date.now(),
        assetId: buildAssetId(nextSerialStart),
        dateOfPurchase,
        invoiceNumber: form.invoiceNumber,
        invoiceDate,
        partyName: form.partyName,
        location: form.location,
        fundType: form.fundType,
        assetType: form.assetType,
        amountBeforeGst: String(amountBefore),
        gstAmount: String(gstAmount),
        totalInvoiceValue: String(totalInvoiceValue),
        quantity,
        narration: form.narration || ''
      });
    }

    onUpdate([...(data || []), ...createdItems]);
    resetFormState();
    window.alert(`Saved ${createdItems.length} asset addition ${createdItems.length > 1 ? 'entries' : 'entry'} successfully.`);
  };

  if (isFormOpen) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className={`bg-${themeColor} px-10 py-8 text-white flex justify-between items-center`}>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                {editingId !== null ? 'Edit Asset Addition' : 'Add Asset Addition'}
              </h1>
              <p className="text-white/80 text-xs font-medium mt-1">
                Capture purchase invoice details and maintain individual asset lines.
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
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Date of Purchase</label>
                <CompactDatePicker
                  value={form.dateOfPurchase}
                  onChange={(value) => setForm((prev) => ({ ...prev, dateOfPurchase: value }))}
                  className="border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice Number</label>
                <input
                  value={form.invoiceNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="INV-2026-001"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice Date</label>
                <CompactDatePicker
                  value={form.invoiceDate}
                  onChange={(value) => setForm((prev) => ({ ...prev, invoiceDate: value }))}
                  className="border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Party Name</label>
                <input
                  value={form.partyName}
                  onChange={(e) => setForm((prev) => ({ ...prev, partyName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="Vendor / Supplier"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                >
                  <option value="">Select Location</option>
                  {locationOptions.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Fund Type</label>
                <select
                  value={form.fundType}
                  onChange={(e) => setForm((prev) => ({ ...prev, fundType: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                >
                  <option value="">Select Fund Type</option>
                  {fundTypeOptions.map((fundType) => (
                    <option key={fundType} value={fundType}>{fundType}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Type</label>
                <select
                  value={form.assetType}
                  onChange={(e) => setForm((prev) => ({ ...prev, assetType: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                >
                  <option value="">Select Asset Type</option>
                  {options.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount Before GST</label>
                <input
                  value={form.amountBeforeGst}
                  onChange={(e) => setForm((prev) => ({ ...prev, amountBeforeGst: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">GST Amount</label>
                <input
                  value={form.gstAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, gstAmount: e.target.value.replace(/[^0-9.]/g, '') }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Total Invoice Value</label>
                <input
                  value={formatIndianAmount(totalInvoiceValue)}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Narration</label>
                <textarea
                  value={form.narration}
                  onChange={(e) => setForm((prev) => ({ ...prev, narration: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm"
                  placeholder="Optional notes"
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
                onClick={savePurchase}
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
          <h1 className="text-2xl font-black tracking-tight uppercase">Asset Additions Management</h1>
          <p className="text-white/80 text-xs font-medium mt-1">
            Table includes all asset addition columns. Use add or edit to open the form.
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
                  <th className="px-4 py-4">Asset ID</th>
                  <th className="px-4 py-4">Date of Purchase</th>
                  <th className="px-4 py-4">Invoice Number</th>
                  <th className="px-4 py-4">Invoice Date</th>
                  <th className="px-4 py-4">Party Name</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Fund Type</th>
                  <th className="px-4 py-4">Asset Type</th>
                  <th className="px-4 py-4 text-right">Amount Before GST</th>
                  <th className="px-4 py-4 text-right">GST Amount</th>
                  <th className="px-4 py-4 text-right">Total Invoice Value</th>
                  <th className="px-4 py-4 text-right">Quantity</th>
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
                {paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-brand-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100">{row.assetId}</td>
                    <td className="px-4 py-3 text-xs">{row.dateOfPurchase}</td>
                    <td className="px-4 py-3 text-xs">{row.invoiceNumber}</td>
                    <td className="px-4 py-3 text-xs">{row.invoiceDate}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{row.partyName}</td>
                    <td className="px-4 py-3 text-xs">{row.location || '-'}</td>
                    <td className="px-4 py-3 text-xs">{row.fundType || '-'}</td>
                    <td className="px-4 py-3 text-xs">{row.assetType}</td>
                    <td className="px-4 py-3 text-xs text-right">Rs. {formatIndianAmount(Number(row.amountBeforeGst || 0))}</td>
                    <td className="px-4 py-3 text-xs text-right">Rs. {formatIndianAmount(Number(row.gstAmount || 0))}</td>
                    <td className="px-4 py-3 text-xs text-right font-black">Rs. {formatIndianAmount(Number(row.totalInvoiceValue || 0))}</td>
                    <td className="px-4 py-3 text-xs text-right">{row.quantity}</td>
                    <td className="px-4 py-3 text-xs max-w-[220px] truncate">{row.narration}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditForm(row)}
                          className="inline-flex items-center justify-center rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 transition"
                          aria-label={`Edit ${row.assetId}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => requestDeleteRows([row.id])}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 transition"
                          aria-label={`Delete ${row.assetId}`}
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
                      No asset addition records found.
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







