import React, { useMemo, useState } from 'react';

interface Beneficiary {
  id: number;
  name: string;
  age: number;
  education: string;
  gender: 'male' | 'female' | 'others';
  caste: 'SC' | 'ST' | 'OBC' | 'General' | 'EWS';
  contactDetails: string;
  address: string;
  financialStatus: 'BPL' | 'APL';
  location: string;
  batchNumber: string;
  referredBy: 'self' | 'employee' | 'non-employee';
  referrerName?: string;
}

interface LocationItem {
  name: string;
}

interface BatchItem {
  location: string;
  batchNumber: string;
  batchStartDate: string;
  batchStatus?: string;
}

interface BeneficiaryDirectoryPageProps {
  data: Beneficiary[];
  locationsList: LocationItem[];
  batchesList: BatchItem[];
  onUpdate: (data: Beneficiary[]) => void;
  themeColor?: string;
}

interface BeneficiaryForm {
  name: string;
  age: string;
  education: string;
  gender: 'male' | 'female' | 'others';
  caste: 'SC' | 'ST' | 'OBC' | 'General' | 'EWS';
  contactDetails: string;
  address: string;
  financialStatus: 'BPL' | 'APL';
  location: string;
  batchNumber: string;
  referredBy: 'self' | 'employee' | 'non-employee';
  referrerName: string;
}

const INITIAL_FORM: BeneficiaryForm = {
  name: '',
  age: '',
  education: 'below 10th Pass',
  gender: 'male',
  caste: 'SC',
  contactDetails: '',
  address: '',
  financialStatus: 'BPL',
  location: '',
  batchNumber: '',
  referredBy: 'self',
  referrerName: ''
};

const EDUCATION_OPTIONS = [
  'below 10th Pass',
  '10th pass',
  'below 12th pass',
  '12th pass',
  'under graduate',
  'graduate',
  'post graduate'
];

const GENDER_OPTIONS: Array<'male' | 'female' | 'others'> = ['male', 'female', 'others'];

const CASTE_OPTIONS: Array<'SC' | 'ST' | 'OBC' | 'General' | 'EWS'> = ['SC', 'ST', 'OBC', 'General', 'EWS'];

export const BeneficiaryDirectoryPage: React.FC<BeneficiaryDirectoryPageProps> = ({
  data,
  locationsList,
  batchesList,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [searchText, setSearchText] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BeneficiaryForm>(INITIAL_FORM);

  const locationOptions = useMemo(
    () => Array.from(new Set((locationsList || []).map((item) => item.name).filter(Boolean))),
    [locationsList]
  );

  const parseBatchDateForSort = (value: string) => {
    const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return Number(`${ddmmyyyy[3]}${ddmmyyyy[2]}${ddmmyyyy[1]}`);
    }

    const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (yyyymmdd) {
      return Number(`${yyyymmdd[1]}${yyyymmdd[2]}${yyyymmdd[3]}`);
    }

    return 0;
  };

  const getLatestActiveBatchNumber = (location: string) => {
    const activeBatches = (batchesList || []).filter(
      (batch) =>
        (batch.location || '').toLowerCase() === location.toLowerCase() &&
        (batch.batchStatus || 'active').toLowerCase() === 'active'
    );

    if (activeBatches.length === 0) return '';

    const sorted = [...activeBatches].sort(
      (a, b) => parseBatchDateForSort(b.batchStartDate || '') - parseBatchDateForSort(a.batchStartDate || '')
    );

    return sorted[0]?.batchNumber || '';
  };

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return data || [];

    return (data || []).filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.contactDetails.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.batchNumber.toLowerCase().includes(query)
      );
    });
  }, [data, searchText]);

  const openAddForm = () => {
    const defaultLocation = locationOptions[0] || '';
    setEditingId(null);
    setForm({
      ...INITIAL_FORM,
      location: defaultLocation,
      batchNumber: defaultLocation ? getLatestActiveBatchNumber(defaultLocation) : ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item: Beneficiary) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      age: String(item.age),
      education: item.education,
      gender: item.gender,
      caste: item.caste,
      contactDetails: item.contactDetails,
      address: item.address,
      financialStatus: item.financialStatus,
      location: item.location,
      batchNumber: item.batchNumber,
      referredBy: item.referredBy,
      referrerName: item.referrerName || ''
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleLocationChange = (location: string) => {
    setForm((prev) => ({
      ...prev,
      location,
      // For new entries, always auto-populate batch number from latest active batch.
      batchNumber: editingId === null ? getLatestActiveBatchNumber(location) : prev.batchNumber
    }));
  };

  const handleDelete = (id: number) => {
    const shouldDelete = window.confirm('Delete this beneficiary?');
    if (!shouldDelete) return;

    onUpdate((data || []).filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedContact = form.contactDetails.trim();
    const trimmedAddress = form.address.trim();
    const trimmedBatch = form.batchNumber.trim();
    const trimmedEducation = form.education.trim();
    const trimmedCaste = form.caste.trim();
    const trimmedReferrerName = form.referrerName.trim();
    const parsedAge = Number(form.age);

    if (!trimmedName || !trimmedEducation || !trimmedCaste || !trimmedContact || !trimmedAddress || !trimmedBatch || !form.location) {
      window.alert('Please fill all required fields.');
      return;
    }

    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      window.alert('Please enter a valid age.');
      return;
    }

    if (form.referredBy !== 'self' && !trimmedReferrerName) {
      window.alert('Please enter employee/referrer name.');
      return;
    }

    const payload: Beneficiary = {
      id: editingId ?? Date.now(),
      name: trimmedName,
      age: parsedAge,
      education: trimmedEducation,
      gender: form.gender,
      caste: form.caste,
      contactDetails: trimmedContact,
      address: trimmedAddress,
      financialStatus: form.financialStatus,
      location: form.location,
      batchNumber: trimmedBatch,
      referredBy: form.referredBy,
      referrerName: form.referredBy === 'self' ? '' : trimmedReferrerName
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
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Beneficiary Directory</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Manage beneficiary records</p>
          </div>
          <button
            onClick={openAddForm}
            className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
          >
            + Add Beneficiary
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, contact, location or batch"
              className="w-full max-w-md px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3">Name of Beneficiary</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Education</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Caste</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Financial Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Referred By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-sm text-slate-500">
                      No beneficiaries found.
                    </td>
                  </tr>
                )}
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.age}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 capitalize">{item.education}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 capitalize">{item.gender}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.caste}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.contactDetails}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 max-w-[220px] truncate" title={item.address}>
                      {item.address}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.financialStatus}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.location}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 capitalize">{item.referredBy}</td>
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingId === null ? 'Add Beneficiary' : 'Edit Beneficiary'}
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
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Name of Beneficiary</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={formInputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Age</label>
                  <input
                    type="number"
                    min={1}
                    value={form.age}
                    onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                    className={formInputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Education</label>
                  <select
                    value={form.education}
                    onChange={(e) => setForm((prev) => ({ ...prev, education: e.target.value }))}
                    className={formInputClass}
                    required
                  >
                    {EDUCATION_OPTIONS.map((education) => (
                      <option key={education} value={education}>
                        {education}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'others' }))}
                    className={formInputClass}
                    required
                  >
                    {GENDER_OPTIONS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Caste</label>
                  <select
                    value={form.caste}
                    onChange={(e) => setForm((prev) => ({ ...prev, caste: e.target.value as 'SC' | 'ST' | 'OBC' | 'General' | 'EWS' }))}
                    className={formInputClass}
                    required
                  >
                    {CASTE_OPTIONS.map((caste) => (
                      <option key={caste} value={caste}>
                        {caste}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Contact Details</label>
                  <input
                    type="text"
                    value={form.contactDetails}
                    onChange={(e) => setForm((prev) => ({ ...prev, contactDetails: e.target.value }))}
                    className={formInputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Batch Number</label>
                  <input
                    type="text"
                    value={form.batchNumber}
                    readOnly
                    className={formInputClass}
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide font-bold">
                    Auto-selected from latest active batch of chosen location
                  </p>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Financial Status</label>
                  <select
                    value={form.financialStatus}
                    onChange={(e) => setForm((prev) => ({ ...prev, financialStatus: e.target.value as 'BPL' | 'APL' }))}
                    className={formInputClass}
                    required
                  >
                    <option value="BPL">BPL</option>
                    <option value="APL">APL</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Location</label>
                  <select
                    value={form.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
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
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Referred By</label>
                  <select
                    value={form.referredBy}
                    onChange={(e) => {
                      const referredBy = e.target.value as 'self' | 'employee' | 'non-employee';
                      setForm((prev) => ({
                        ...prev,
                        referredBy,
                        referrerName: referredBy === 'self' ? '' : prev.referrerName
                      }));
                    }}
                    className={formInputClass}
                    required
                  >
                    <option value="self">self</option>
                    <option value="employee">employee</option>
                    <option value="non-employee">non-employee</option>
                  </select>
                </div>

                {form.referredBy !== 'self' && (
                  <div>
                    <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                      {form.referredBy === 'employee' ? 'Employee Name' : "Referror's Name"}
                    </label>
                    <input
                      type="text"
                      value={form.referrerName}
                      onChange={(e) => setForm((prev) => ({ ...prev, referrerName: e.target.value }))}
                      className={formInputClass}
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className={formInputClass}
                  rows={3}
                  required
                />
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
                  {editingId === null ? 'Save Beneficiary' : 'Update Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
