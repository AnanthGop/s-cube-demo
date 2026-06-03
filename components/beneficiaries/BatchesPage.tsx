import React, { useEffect, useMemo, useState } from 'react';

interface BatchItem {
  id: number;
  location: string;
  batchNumber: string;
  batchStartDate: string;
  batchEndDate: string;
  batchStatus: 'active' | 'completed' | 'dropped';
}

interface LocationItem {
  name: string;
}

interface BeneficiaryItem {
  location: string;
  batchNumber: string;
}

interface BatchesPageProps {
  data: BatchItem[];
  locationsList: LocationItem[];
  beneficiariesList: BeneficiaryItem[];
  onUpdate: (data: BatchItem[]) => void;
  themeColor?: string;
}

interface BatchForm {
  location: string;
  batchNumber: string;
  batchStartDate: string;
  batchEndDate: string;
  batchStatus: 'active' | 'completed' | 'dropped';
}

const INITIAL_FORM: BatchForm = {
  location: '',
  batchNumber: '',
  batchStartDate: '',
  batchEndDate: '',
  batchStatus: 'active'
};

const BATCH_STATUS_OPTIONS: Array<'active' | 'completed' | 'dropped'> = ['active', 'completed', 'dropped'];

const normalizeDateInput = (value: string) => value.replace(/[^0-9/]/g, '').slice(0, 10);

const parseDDMMYYYY = (value: string): { day: number; month: number; year: number } | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return { day, month, year };
};

const formatLegacyDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const formatDateForDisplay = (value: string) => {
  if (!value) return '';

  const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return value;

  const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) return `${yyyymmdd[3]}/${yyyymmdd[2]}/${yyyymmdd[1]}`;

  return value;
};

const normalizeDateForStorage = (value: string) => {
  const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) return `${yyyymmdd[3]}/${yyyymmdd[2]}/${yyyymmdd[1]}`;

  const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return value;

  return value;
};

export const BatchesPage: React.FC<BatchesPageProps> = ({
  data,
  locationsList,
  beneficiariesList,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [activeView, setActiveView] = useState<'batches' | 'summary'>('batches');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BatchForm>(INITIAL_FORM);

  useEffect(() => {
    const migrated = (data || []).map((item) => {
      const normalizedStart = normalizeDateForStorage(item.batchStartDate || '');
      const normalizedEnd = normalizeDateForStorage(item.batchEndDate || '');
      return {
        ...item,
        batchStartDate: normalizedStart,
        batchEndDate: normalizedEnd
      };
    });

    const hasChanges = (data || []).some((item, index) => {
      return (
        item.batchStartDate !== migrated[index].batchStartDate ||
        item.batchEndDate !== migrated[index].batchEndDate
      );
    });

    if (hasChanges) {
      onUpdate(migrated);
    }
  }, [data, onUpdate]);

  const locationOptions = useMemo(
    () => Array.from(new Set((locationsList || []).map((item) => item.name).filter(Boolean))),
    [locationsList]
  );

  const filterLocationOptions = useMemo(() => {
    const fromBatches = (data || []).map((item) => item.location);
    const fromMaster = locationOptions;
    return Array.from(new Set([...fromBatches, ...fromMaster].filter(Boolean)));
  }, [data, locationOptions]);

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (data || []).filter((item) => {
      const matchesLocation = selectedLocation === 'ALL' || item.location === selectedLocation;
      const matchesQuery =
        query === '' ||
        item.batchNumber.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.batchStatus.toLowerCase().includes(query);

      return matchesLocation && matchesQuery;
    });
  }, [data, searchText, selectedLocation]);

  const summaryRows = useMemo(() => {
    return filteredData.map((batch) => {
      const beneficiaryCount = (beneficiariesList || []).filter(
        (beneficiary) =>
          (beneficiary.location || '').toLowerCase() === (batch.location || '').toLowerCase() &&
          (beneficiary.batchNumber || '').toLowerCase() === (batch.batchNumber || '').toLowerCase()
      ).length;

      return {
        id: batch.id,
        location: batch.location,
        batchNumber: batch.batchNumber,
        beneficiaryCount
      };
    });
  }, [filteredData, beneficiariesList]);

  const totalBeneficiaryCount = useMemo(() => {
    return summaryRows.reduce((sum, row) => sum + row.beneficiaryCount, 0);
  }, [summaryRows]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, location: locationOptions[0] || '' });
    setIsFormOpen(true);
  };

  const openEditForm = (item: BatchItem) => {
    setEditingId(item.id);
    setForm({
      location: item.location,
      batchNumber: item.batchNumber,
      batchStartDate: formatLegacyDate(item.batchStartDate),
      batchEndDate: formatLegacyDate(item.batchEndDate),
      batchStatus: item.batchStatus || 'active'
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleDelete = (id: number) => {
    const shouldDelete = window.confirm('Delete this batch?');
    if (!shouldDelete) return;
    onUpdate((data || []).filter((item) => item.id !== id));
  };

  const handleStatusChange = (id: number, newStatus: 'active' | 'completed' | 'dropped') => {
    onUpdate((data || []).map((item) => (item.id === id ? { ...item, batchStatus: newStatus } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const location = form.location.trim();
    const batchNumber = form.batchNumber.trim();
    const batchStartDate = form.batchStartDate.trim();
    const batchEndDate = form.batchEndDate.trim();
    const parsedStart = parseDDMMYYYY(batchStartDate);
    const parsedEnd = parseDDMMYYYY(batchEndDate);

    if (!location || !batchNumber || !batchStartDate || !batchEndDate) {
      window.alert('Please fill all required fields.');
      return;
    }

    if (!parsedStart || !parsedEnd) {
      window.alert('Please enter dates in DD/MM/YYYY format.');
      return;
    }

    const startScore = parsedStart.year * 10000 + parsedStart.month * 100 + parsedStart.day;
    const endScore = parsedEnd.year * 10000 + parsedEnd.month * 100 + parsedEnd.day;

    if (endScore < startScore) {
      window.alert('Batch end date cannot be before start date.');
      return;
    }

    const payload: BatchItem = {
      id: editingId ?? Date.now(),
      location,
      batchNumber,
      batchStartDate,
      batchEndDate,
      batchStatus: form.batchStatus
    };

    if (editingId === null) {
      onUpdate([...(data || []), payload]);
    } else {
      onUpdate((data || []).map((item) => (item.id === editingId ? payload : item)));
    }

    closeForm();
  };

  const formInputClass =
    'w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Batches</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Manage beneficiary batches</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('batches')}
              className={`px-3 py-2 rounded-lg text-xs font-extrabold transition ${activeView === 'batches' ? `bg-${themeColor} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}
            >
              Batches
            </button>
            <button
              onClick={() => setActiveView('summary')}
              className={`px-3 py-2 rounded-lg text-xs font-extrabold transition ${activeView === 'summary' ? `bg-${themeColor} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}
            >
              Summary
            </button>
            {activeView === 'batches' && (
              <button
                onClick={openAddForm}
                className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
              >
                + Add Batch
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={activeView === 'summary' ? 'Search by batch number or location in summary' : 'Search by batch number or location'}
              className="w-full max-w-md px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Locations</option>
              {filterLocationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {activeView === 'batches' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3">Select Location</th>
                    <th className="px-4 py-3">Batch Number</th>
                    <th className="px-4 py-3">Batch Start Date</th>
                    <th className="px-4 py-3">Batch End Date</th>
                    <th className="px-4 py-3">Batch Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                        No batches found.
                      </td>
                    </tr>
                  )}
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{item.location}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.batchNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateForDisplay(item.batchStartDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateForDisplay(item.batchEndDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        <select
                          value={item.batchStatus || 'active'}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as 'active' | 'completed' | 'dropped')}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-xs font-bold capitalize"
                        >
                          {BATCH_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
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
          )}

          {activeView === 'summary' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="px-4 py-2 rounded-lg bg-brand-600/10 text-brand-700 dark:text-brand-300 text-sm font-extrabold">
                  Total Beneficiaries: {totalBeneficiaryCount}
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Batch Number</th>
                      <th className="px-4 py-3 text-right">Count of Beneficiaries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {summaryRows.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                          No summary rows found.
                        </td>
                      </tr>
                    )}
                    {summaryRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{row.location}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{row.batchNumber}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-slate-700 dark:text-slate-200">{row.beneficiaryCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingId === null ? 'Add Batch' : 'Edit Batch'}
              </h3>
              <button
                onClick={closeForm}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-sm font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Select Location</label>
                  <select
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className={formInputClass}
                    required
                  >
                    {locationOptions.length === 0 && <option value="">No locations found in Location Master</option>}
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Batch Number</label>
                  <input
                    type="text"
                    value={form.batchNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, batchNumber: e.target.value }))}
                    className={formInputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Batch Start Date</label>
                  <input
                    type="text"
                    value={form.batchStartDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, batchStartDate: normalizeDateInput(e.target.value) }))}
                    placeholder="DD/MM/YYYY"
                    className={formInputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Batch End Date</label>
                  <input
                    type="text"
                    value={form.batchEndDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, batchEndDate: normalizeDateInput(e.target.value) }))}
                    placeholder="DD/MM/YYYY"
                    className={formInputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Batch Status</label>
                  <select
                    value={form.batchStatus}
                    onChange={(e) => setForm((prev) => ({ ...prev, batchStatus: e.target.value as 'active' | 'completed' | 'dropped' }))}
                    className={formInputClass}
                    required
                  >
                    {BATCH_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button type="submit" className={`px-5 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}>
                  {editingId === null ? 'Save Batch' : 'Update Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
