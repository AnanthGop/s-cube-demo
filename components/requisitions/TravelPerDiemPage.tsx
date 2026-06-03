import React, { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface PerDiemPolicy {
  id: string;
  employeeCategory: string;
  perDiemPerDay: number;
  perDiemLimit: number;
}

interface TravelPerDiemPageProps {
  themeColor?: string;
  data: PerDiemPolicy[];
  onUpdate: (next: PerDiemPolicy[]) => void | Promise<void>;
  onBackToLanding?: () => void;
}

const nextPolicyId = (entries: PerDiemPolicy[]) => {
  const max = entries.reduce((acc, entry) => {
    const n = Number(String(entry.id || "").replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `PD-${String(max + 1).padStart(3, "0")}`;
};

const emptyForm = (id: string): PerDiemPolicy => ({
  id,
  employeeCategory: "",
  perDiemPerDay: 0,
  perDiemLimit: 0,
});

export const TravelPerDiemPage: React.FC<TravelPerDiemPageProps> = ({
  themeColor = "purple-600",
  data = [],
  onUpdate,
  onBackToLanding,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPerDiemFilter, setMinPerDiemFilter] = useState("");
  const [minLimitFilter, setMinLimitFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<PerDiemPolicy>(
    emptyForm(nextPolicyId(data)),
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesCategory =
        !categoryFilter ||
        String(item.employeeCategory || "")
          .toLowerCase()
          .includes(categoryFilter.toLowerCase());
      const min = Number(minPerDiemFilter);
      const matchesMinPerDiem =
        !minPerDiemFilter || (Number.isFinite(min) && item.perDiemPerDay >= min);
      const minLimit = Number(minLimitFilter);
      const matchesMinLimit =
        !minLimitFilter ||
        (Number.isFinite(minLimit) && item.perDiemLimit >= minLimit);
      return matchesCategory && matchesMinPerDiem && matchesMinLimit;
    });
  }, [data, categoryFilter, minPerDiemFilter, minLimitFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm(nextPolicyId(data)));
    setIsFormOpen(true);
  };

  const openEditForm = (entry: PerDiemPolicy) => {
    setEditingId(entry.id);
    setFormData({ ...entry });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm(nextPolicyId(data)));
  };

  const handleSave = async () => {
    const employeeCategory = String(formData.employeeCategory || "").trim();
    if (!employeeCategory) {
      alert("Employee category is required.");
      return;
    }
    if (formData.perDiemPerDay <= 0 || formData.perDiemLimit <= 0) {
      alert("Per diem per day and annual limit - per diem must be greater than 0.");
      return;
    }

    const categoryConflict = data.some((item) => {
      if (editingId && item.id === editingId) return false;
      return (
        String(item.employeeCategory || "").trim().toLowerCase() ===
        employeeCategory.toLowerCase()
      );
    });
    if (categoryConflict) {
      alert("This employee category already exists.");
      return;
    }

    const normalized: PerDiemPolicy = {
      ...formData,
      id: editingId || formData.id,
      employeeCategory,
      perDiemPerDay: Number(formData.perDiemPerDay || 0),
      perDiemLimit: Number(formData.perDiemLimit || 0),
    };

    const nextData =
      editingId ?
        data.map((item) => (item.id === editingId ? normalized : item))
      : [...data, normalized];

    await onUpdate(nextData);
    closeForm();
  };

  const handleDelete = async (id: string) => {
    const target = data.find((item) => item.id === id);
    const label = target?.employeeCategory || id;
    const confirmed = window.confirm(`Delete per diem policy "${label}"?`);
    if (!confirmed) return;
    await onUpdate(data.filter((item) => item.id !== id));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredData.length === 0) return;
    const allFilteredIds = filteredData.map((row) => row.id);
    const isAllSelected =
      allFilteredIds.length > 0 &&
      allFilteredIds.every((id) => selectedRows.has(id));
    if (isAllSelected) {
      const next = new Set(selectedRows);
      allFilteredIds.forEach((id) => next.delete(id));
      setSelectedRows(next);
      return;
    }
    const next = new Set(selectedRows);
    allFilteredIds.forEach((id) => next.add(id));
    setSelectedRows(next);
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedRows.size} selected per diem record(s)?`,
    );
    if (!confirmed) return;
    const nextData = data.filter((item) => !selectedRows.has(item.id));
    await onUpdate(nextData);
    setSelectedRows(new Set());
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className={`bg-${themeColor} px-10 py-8 rounded-3xl text-white mb-8 flex justify-between items-center shadow-2xl`}>
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">
            Per Diem Policy
          </h1>
          <p className="text-white/80 text-sm font-medium mt-1">
            Employee category wise per diem rate and upper limit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="px-6 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">
              Back to Travel Landing Page
            </button>
          )}
          <button
            onClick={openCreateForm}
            className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">
            + Add Entry
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Employee Category
              </label>
              <input
                type="text"
                value={formData.employeeCategory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeCategory: e.target.value,
                  }))
                }
                placeholder="e.g. Manager"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Per Diem Per Day
              </label>
              <input
                type="number"
                min={0}
                value={formData.perDiemPerDay}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    perDiemPerDay: Number(e.target.value || 0),
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Annual Limit - Per Diem
              </label>
              <input
                type="number"
                min={0}
                value={formData.perDiemLimit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    perDiemLimit: Number(e.target.value || 0),
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={closeForm}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 bg-${themeColor} hover:brightness-110 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition`}>
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {selectedRows.size > 0 && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900 flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 dark:text-red-300">
              {selectedRows.size} row(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-black uppercase tracking-widest transition">
              Delete All
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredData.length > 0 &&
                      filteredData.every((item) => selectedRows.has(item.id))
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Employee Category
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Per Diem Per Day
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Annual Limit - Per Diem
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
              <tr className="bg-slate-50/70 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3" />
                <th className="px-6 py-3">
                  <input
                    type="text"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    placeholder="Filter category..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </th>
                <th className="px-6 py-3">
                  <input
                    type="number"
                    min={0}
                    value={minPerDiemFilter}
                    onChange={(e) => setMinPerDiemFilter(e.target.value)}
                    placeholder="Min/day"
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
                  />
                </th>
                <th className="px-6 py-3">
                  <input
                    type="number"
                    min={0}
                    value={minLimitFilter}
                    onChange={(e) => setMinLimitFilter(e.target.value)}
                    placeholder="Min limit"
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
                  />
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => {
                      setCategoryFilter("");
                      setMinPerDiemFilter("");
                      setMinLimitFilter("");
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-[10px] font-black uppercase tracking-widest transition">
                    Clear
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredData.length > 0 ?
                filteredData.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(entry.id)}
                        onChange={() => toggleRowSelection(entry.id)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                      {entry.employeeCategory}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100 text-right">
                      {entry.perDiemPerDay.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-100 text-right">
                      {entry.perDiemLimit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-4">
                        <button
                          onClick={() => openEditForm(entry)}
                          title="Edit"
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-sm text-center text-slate-500 dark:text-slate-400">
                    No records found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
