import React, { useEffect, useMemo, useState } from 'react';

interface EmployeeItem {
  id: number;
  name: string;
  dateOfBirth: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  contactNo: string;
  address: string;
  pan: string;
  designation: string;
  location: string;
  department: string;
  grossSalaryPerMonth: string;
  annualCTC: string;
  employeeStatus: 'active' | 'resigned';
}

interface LocationItem {
  name: string;
}

interface EmployeeDirectoryPageProps {
  data: EmployeeItem[];
  locationsList: LocationItem[];
  onUpdate: (data: EmployeeItem[]) => void;
  themeColor?: string;
}

interface EmployeeForm {
  name: string;
  dateOfBirth: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  contactNo: string;
  address: string;
  pan: string;
  designation: string;
  location: string;
  department: string;
  grossSalaryPerMonth: string;
  annualCTC: string;
  employeeStatus: 'active' | 'resigned';
}

const INITIAL_FORM: EmployeeForm = {
  name: '',
  dateOfBirth: '',
  dateOfJoining: '',
  dateOfLeaving: '',
  contactNo: '',
  address: '',
  pan: '',
  designation: '',
  location: '',
  department: '',
  grossSalaryPerMonth: '',
  annualCTC: '',
  employeeStatus: 'active'
};

const normalizeDateInput = (value: string) => value.replace(/[^0-9/]/g, '').slice(0, 10);

const parseDDMMYYYY = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { day, month, year };
};

const normalizeDateForStorage = (value: string) => {
  if (!value) return '';
  const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) return `${yyyymmdd[3]}/${yyyymmdd[2]}/${yyyymmdd[1]}`;

  const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return value;

  return value;
};

const formatDateForDisplay = (value: string) => normalizeDateForStorage(value || '');

const normalizeAmountValue = (value: string) => {
  const sanitized = (value || '').replace(/,/g, '').trim();
  const amount = Number(sanitized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return String(amount);
};

const formatIndianAmount = (value: string | number) => {
  const amount = Number(String(value || '').replace(/,/g, ''));
  if (!Number.isFinite(amount)) return String(value || '0');
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const EmployeeDirectoryPage: React.FC<EmployeeDirectoryPageProps> = ({
  data,
  locationsList,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [searchText, setSearchText] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(INITIAL_FORM);

  useEffect(() => {
    const normalized = (data || []).map((item) => ({
      ...item,
      dateOfBirth: normalizeDateForStorage(item.dateOfBirth || ''),
      dateOfJoining: normalizeDateForStorage(item.dateOfJoining || ''),
      dateOfLeaving: normalizeDateForStorage(item.dateOfLeaving || '')
    }));

    const hasChanges = (data || []).some((item, index) => {
      return (
        item.dateOfBirth !== normalized[index].dateOfBirth ||
        item.dateOfJoining !== normalized[index].dateOfJoining ||
        item.dateOfLeaving !== normalized[index].dateOfLeaving
      );
    });

    if (hasChanges) {
      onUpdate(normalized);
    }
  }, [data, onUpdate]);

  const locationOptions = useMemo(() => {
    return Array.from(new Set((locationsList || []).map((location) => location.name).filter(Boolean)));
  }, [locationsList]);

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return data || [];

    return (data || []).filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.contactNo.toLowerCase().includes(query) ||
        item.designation.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      );
    });
  }, [data, searchText]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, location: locationOptions[0] || '' });
    setIsFormOpen(true);
  };

  const openEditForm = (item: EmployeeItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      dateOfBirth: item.dateOfBirth,
      dateOfJoining: item.dateOfJoining,
      dateOfLeaving: item.dateOfLeaving,
      contactNo: item.contactNo,
      address: item.address,
      pan: item.pan,
      designation: item.designation,
      location: item.location,
      department: item.department,
      grossSalaryPerMonth: item.grossSalaryPerMonth,
      annualCTC: item.annualCTC,
      employeeStatus: item.employeeStatus
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Delete this employee?')) return;
    onUpdate((data || []).filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      form.name.trim(),
      form.dateOfBirth,
      form.dateOfJoining,
      form.contactNo.trim(),
      form.address.trim(),
      form.pan.trim(),
      form.designation.trim(),
      form.location.trim(),
      form.department.trim(),
      form.grossSalaryPerMonth.trim(),
      form.annualCTC.trim()
    ];

    if (requiredFields.some((field) => !field)) {
      window.alert('Please fill all required fields.');
      return;
    }

    const dob = normalizeDateForStorage(form.dateOfBirth.trim());
    const doj = normalizeDateForStorage(form.dateOfJoining.trim());
    const dol = normalizeDateForStorage(form.dateOfLeaving.trim());

    if (!parseDDMMYYYY(dob) || !parseDDMMYYYY(doj) || (dol && !parseDDMMYYYY(dol))) {
      window.alert('Please enter dates in DD/MM/YYYY format.');
      return;
    }

    const grossSalary = normalizeAmountValue(form.grossSalaryPerMonth);
    const annualCtc = normalizeAmountValue(form.annualCTC);
    if (grossSalary === null || annualCtc === null) {
      window.alert('Please enter valid non-negative amounts for salary and CTC.');
      return;
    }

    const payload: EmployeeItem = {
      id: editingId ?? Date.now(),
      name: form.name.trim(),
      dateOfBirth: dob,
      dateOfJoining: doj,
      dateOfLeaving: dol,
      contactNo: form.contactNo.trim(),
      address: form.address.trim(),
      pan: form.pan.trim().toUpperCase(),
      designation: form.designation.trim(),
      location: form.location.trim(),
      department: form.department.trim(),
      grossSalaryPerMonth: grossSalary,
      annualCTC: annualCtc,
      employeeStatus: form.employeeStatus
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
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Employee Directory</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Manage employee master records</p>
          </div>
          <button
            onClick={openAddForm}
            className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
          >
            + Add Employee
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, contact, department, designation or location"
              className="w-full max-w-md px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">DOB</th>
                  <th className="px-4 py-3">DOJ</th>
                  <th className="px-4 py-3">DOL</th>
                  <th className="px-4 py-3">Contact No</th>
                  <th className="px-4 py-3">PAN</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Gross Salary / Month</th>
                  <th className="px-4 py-3 text-right">Annual CTC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">
                      No employees found.
                    </td>
                  </tr>
                )}
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateForDisplay(item.dateOfBirth) || '--'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateForDisplay(item.dateOfJoining) || '--'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateForDisplay(item.dateOfLeaving) || '--'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.contactNo}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-300">{item.pan}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.designation}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.location}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.department}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">{formatIndianAmount(item.grossSalaryPerMonth)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">{formatIndianAmount(item.annualCTC)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 capitalize">{item.employeeStatus}</td>
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
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{editingId === null ? 'Add Employee' : 'Edit Employee'}</h3>
              <button
                onClick={closeForm}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-sm font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Name of Employee</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Date of Birth</label>
                  <input type="text" value={form.dateOfBirth} onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: normalizeDateInput(e.target.value) }))} placeholder="DD/MM/YYYY" className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Date of Joining</label>
                  <input type="text" value={form.dateOfJoining} onChange={(e) => setForm((prev) => ({ ...prev, dateOfJoining: normalizeDateInput(e.target.value) }))} placeholder="DD/MM/YYYY" className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Date of Leaving</label>
                  <input type="text" value={form.dateOfLeaving} onChange={(e) => setForm((prev) => ({ ...prev, dateOfLeaving: normalizeDateInput(e.target.value) }))} placeholder="DD/MM/YYYY" className={inputClass} />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Contact No</label>
                  <input type="text" value={form.contactNo} onChange={(e) => setForm((prev) => ({ ...prev, contactNo: e.target.value }))} className={inputClass} required />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">PAN</label>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-600 underline underline-offset-2"
                    >
                      Verify PAN
                    </a>
                  </div>
                  <input type="text" value={form.pan} onChange={(e) => setForm((prev) => ({ ...prev, pan: e.target.value.toUpperCase() }))} className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Name as per PAN</label>
                  <input type="text" value={form.name} readOnly className={`${inputClass} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300`} placeholder="Name as per PAN" />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Designation</label>
                  <input type="text" value={form.designation} onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))} className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Location</label>
                  <select value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className={inputClass} required>
                    {locationOptions.length === 0 && <option value="">No locations found in Location Master</option>}
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Department</label>
                  <input type="text" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Gross Salary per Month</label>
                  <input type="number" min={0} step="0.01" value={form.grossSalaryPerMonth} onChange={(e) => setForm((prev) => ({ ...prev, grossSalaryPerMonth: e.target.value }))} className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Annual CTC</label>
                  <input type="number" min={0} step="0.01" value={form.annualCTC} onChange={(e) => setForm((prev) => ({ ...prev, annualCTC: e.target.value }))} className={inputClass} required />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Employee Status</label>
                  <select value={form.employeeStatus} onChange={(e) => setForm((prev) => ({ ...prev, employeeStatus: e.target.value as 'active' | 'resigned' }))} className={inputClass} required>
                    <option value="active">active</option>
                    <option value="resigned">resigned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Address</label>
                <textarea value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className={inputClass} rows={3} required />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}>{editingId === null ? 'Save Employee' : 'Update Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
