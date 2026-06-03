import React, { useMemo, useState } from 'react';

interface FeeRecord {
  id: number;
  location: string;
  feesApplicable: 'Yes' | 'No';
  feeAmount: string;
}

interface LocationItem {
  name: string;
}

interface AllocateFeesPageProps {
  data: FeeRecord[];
  locationsList: LocationItem[];
  onUpdate: (data: FeeRecord[]) => void;
  themeColor?: string;
}

interface FeeForm {
  location: string;
  feesApplicable: 'Yes' | 'No';
  feeAmount: string;
}

const INITIAL_FORM: FeeForm = {
  location: '',
  feesApplicable: 'Yes',
  feeAmount: ''
};

export const AllocateFeesPage: React.FC<AllocateFeesPageProps> = ({
  data,
  locationsList,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FeeForm>(INITIAL_FORM);
  const [searchText, setSearchText] = useState('');

  const locationOptions = useMemo(
    () => Array.from(new Set((locationsList || []).map((l) => l.name).filter(Boolean))),
    [locationsList]
  );

  const filteredData = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter(
      (item) =>
        item.location.toLowerCase().includes(q) ||
        item.feesApplicable.toLowerCase().includes(q)
    );
  }, [data, searchText]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, location: locationOptions[0] || '' });
    setIsFormOpen(true);
  };

  const openEditForm = (item: FeeRecord) => {
    setEditingId(item.id);
    setForm({
      location: item.location,
      feesApplicable: item.feesApplicable,
      feeAmount: item.feeAmount
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Delete this fee allocation?')) return;
    onUpdate((data || []).filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const location = form.location.trim();
    const feeAmount = form.feeAmount.trim();

    if (!location) {
      window.alert('Please select a location.');
      return;
    }

    if (form.feesApplicable === 'Yes' && !feeAmount) {
      window.alert('Please enter a fee amount.');
      return;
    }

    if (form.feesApplicable === 'Yes') {
      const parsed = Number(feeAmount);
      if (!Number.isFinite(parsed) || parsed < 0) {
        window.alert('Fee amount must be a valid non-negative number.');
        return;
      }
    }

    const payload: FeeRecord = {
      id: editingId ?? Date.now(),
      location,
      feesApplicable: form.feesApplicable,
      feeAmount: form.feesApplicable === 'No' ? '' : feeAmount
    };

    if (editingId === null) {
      onUpdate([...(data || []), payload]);
    } else {
      onUpdate((data || []).map((item) => (item.id === editingId ? payload : item)));
    }

    closeForm();
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Fee Master</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Manage fee allocations by location</p>
          </div>
          <button
            onClick={openAddForm}
            className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
          >
            + Add Fee Allocation
          </button>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by location or fees applicable"
              className="w-full max-w-md px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Fees Applicable</th>
                  <th className="px-4 py-3">Fee Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      No fee allocations found.
                    </td>
                  </tr>
                )}
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.location}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${item.feesApplicable === 'Yes' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {item.feesApplicable}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.feesApplicable === 'Yes' && item.feeAmount ? `₹ ${item.feeAmount}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(item)}
                          className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1 rounded-md border border-rose-200 dark:border-rose-600 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingId === null ? 'Add Fee Allocation' : 'Edit Fee Allocation'}
              </h3>
              <button
                onClick={closeForm}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-sm font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Location */}
              <div>
                <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Select Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  className={inputClass}
                  required
                >
                  {locationOptions.length === 0 && <option value="">No locations found in Location Master</option>}
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Fees Applicable */}
              <div>
                <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Fees Applicable</label>
                <select
                  value={form.feesApplicable}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    feesApplicable: e.target.value as 'Yes' | 'No',
                    feeAmount: e.target.value === 'No' ? '' : prev.feeAmount
                  }))}
                  className={inputClass}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Fee Amount — only shown when fees applicable */}
              {form.feesApplicable === 'Yes' && (
                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Add Fee Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.feeAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, feeAmount: e.target.value }))}
                    placeholder="Enter fee amount"
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
                >
                  {editingId === null ? 'Save' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
