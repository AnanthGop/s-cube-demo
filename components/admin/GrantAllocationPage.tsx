import React, { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  MapPin,
  Calendar,
  Percent,
  DollarSign,
  ChevronDown,
  AlertCircle,
  Search,
} from "lucide-react";
import { CompactDatePicker } from "../shared/CompactDatePicker";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GrantAllocationLine {
  grantId: string;
  grantorName: string;
  grantName: string;
  value: number;
}

export interface GrantAllocationPeriod {
  id: string;
  startDate: string;
  endDate: string;
  lines: GrantAllocationLine[];
}

export interface GrantAllocationRecord {
  id: string;
  locationId: string | number;
  locationName: string;
  allocationType: "percentage" | "absolute";
  periods: GrantAllocationPeriod[];
  status: "Active" | "Inactive";
  creator: string;
  createdDate: string;
}

interface LocationItem {
  id: string | number;
  name: string;
}

interface GrantItem {
  id: string;
  nameOfGrantor?: string;
  name?: string;
  code?: string;
  status?: string;
}

interface GrantAllocationPageProps {
  allocations: GrantAllocationRecord[];
  locations: LocationItem[];
  grants: GrantItem[];
  onUpdate: (allocations: GrantAllocationRecord[]) => void;
  themeColor?: string;
  currentUser?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getDDMMYYYY = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const fmtCurr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const EMPTY_LINE: GrantAllocationLine = {
  grantId: "",
  grantorName: "",
  grantName: "",
  value: 0,
};

const formatDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const newPeriod = (): GrantAllocationPeriod => ({
  id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  startDate: "",
  endDate: "",
  lines: [{ ...EMPTY_LINE }],
});

const EMPTY_FORM = {
  locationId: "" as string | number,
  locationName: "",
  allocationType: "percentage" as "percentage" | "absolute",
  periods: [] as GrantAllocationPeriod[],
  status: "Active" as "Active" | "Inactive",
};

// ─── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls =
    status === "Active" ?
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400";
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const GrantAllocationPage: React.FC<GrantAllocationPageProps> = ({
  allocations,
  locations,
  grants,
  onUpdate,
  themeColor = "indigo-600",
  currentUser = "Admin",
}) => {
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, periods: [newPeriod()] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (allocations || []).filter((a) => {
      const matchSearch =
        !q ||
        a.locationName.toLowerCase().includes(q) ||
        (a.periods || []).some((p) =>
          p.lines.some(
            (l) =>
              l.grantorName.toLowerCase().includes(q) ||
              l.grantName.toLowerCase().includes(q),
          ),
        );
      const matchLoc =
        !filterLocation ||
        a.locationId === filterLocation ||
        a.locationName === filterLocation;
      const matchStatus = !filterStatus || a.status === filterStatus;
      return matchSearch && matchLoc && matchStatus;
    });
  }, [allocations, search, filterLocation, filterStatus]);

  // ── Unique location options for filter ────────────────────────────────────────

  const locationOpts = useMemo(() => {
    const seen = new Set<string>();
    return (allocations || [])
      .map((a) => ({ id: a.locationId, name: a.locationName }))
      .filter((l) => {
        if (seen.has(l.name)) return false;
        seen.add(l.name);
        return true;
      });
  }, [allocations]);

  // ── Open form ───────────────────────────────────────────────────────────────

  const openAddForm = () => {
    setForm({ ...EMPTY_FORM, periods: [newPeriod()] });
    setEditingId(null);
    setErrors({});
    setIsEditing(true);
  };

  const openEditForm = (rec: GrantAllocationRecord) => {
    setForm({
      locationId: rec.locationId,
      locationName: rec.locationName,
      allocationType: rec.allocationType,
      periods:
        rec.periods && rec.periods.length > 0 ?
          rec.periods.map((p) => ({
            ...p,
            lines:
              p.lines.length > 0 ?
                p.lines.map((l) => ({ ...l }))
              : [{ ...EMPTY_LINE }],
          }))
        : [newPeriod()],
      status: rec.status,
    });
    setEditingId(rec.id);
    setErrors({});
    setIsEditing(true);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    if (!confirm("Delete this grant allocation record?")) return;
    onUpdate((allocations || []).filter((a) => a.id !== id));
  };

  // ── Form field helpers ───────────────────────────────────────────────────────

  const setField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const loc = locations.find((l) => l.name === name);
    setForm((prev) => ({
      ...prev,
      locationId: loc ? loc.id : "",
      locationName: name,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.locationName;
      return next;
    });
  };

  // ── Period helpers ──────────────────────────────────────────────────────────

  const addPeriod = () =>
    setForm((prev) => ({ ...prev, periods: [...prev.periods, newPeriod()] }));

  const removePeriod = (pid: string) =>
    setForm((prev) => ({
      ...prev,
      periods: prev.periods.filter((p) => p.id !== pid),
    }));

  const setPeriodField = (
    pid: string,
    key: "startDate" | "endDate",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      periods: prev.periods.map((p) =>
        p.id === pid ? { ...p, [key]: value } : p,
      ),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${pid}_${key}`];
      return next;
    });
  };

  // ── Grant line helpers (per period) ────────────────────────────────────────

  const addLine = (pid: string) =>
    setForm((prev) => ({
      ...prev,
      periods: prev.periods.map((p) =>
        p.id === pid ? { ...p, lines: [...p.lines, { ...EMPTY_LINE }] } : p,
      ),
    }));

  const removeLine = (pid: string, idx: number) =>
    setForm((prev) => ({
      ...prev,
      periods: prev.periods.map((p) =>
        p.id === pid ? { ...p, lines: p.lines.filter((_, i) => i !== idx) } : p,
      ),
    }));

  const setLineField = (
    pid: string,
    idx: number,
    key: keyof GrantAllocationLine,
    value: any,
  ) => {
    setForm((prev) => ({
      ...prev,
      periods: prev.periods.map((p) => {
        if (p.id !== pid) return p;
        const lines = p.lines.map((l, i) => {
          if (i !== idx) return l;
          if (key === "grantId") {
            const g = grants.find((gr) => gr.id === value);
            return {
              ...l,
              grantId: value,
              grantorName: g?.nameOfGrantor || "",
              grantName: g?.name || "",
            };
          }
          return { ...l, [key]: value };
        });
        return { ...p, lines };
      }),
    }));
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.locationName) errs.locationName = "Location is required";

    form.periods.forEach((p) => {
      if (!p.startDate) errs[`${p.id}_startDate`] = "Required";
      if (!p.endDate) errs[`${p.id}_endDate`] = "Required";
      if (p.startDate && p.endDate && p.startDate > p.endDate)
        errs[`${p.id}_endDate`] = "End must be after start";
      const validLines = p.lines.filter((l) => l.grantId);
      if (validLines.length === 0)
        errs[`${p.id}_lines`] = "At least one grant is required";
      if (form.allocationType === "percentage") {
        const total = validLines.reduce((s, l) => s + Number(l.value || 0), 0);
        if (Math.abs(total - 100) > 0.01)
          errs[`${p.id}_lines`] =
            `Must sum to 100% (currently ${total.toFixed(2)}%)`;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!validate()) return;

    const cleanPeriods = form.periods.map((p) => ({
      ...p,
      lines: p.lines.filter((l) => l.grantId),
    }));

    if (editingId) {
      onUpdate(
        (allocations || []).map((a) =>
          a.id === editingId ?
            {
              ...a,
              locationId: form.locationId,
              locationName: form.locationName,
              allocationType: form.allocationType,
              periods: cleanPeriods,
              status: form.status,
            }
          : a,
        ),
      );
    } else {
      const newRec: GrantAllocationRecord = {
        id: `GA-${Date.now()}`,
        locationId: form.locationId,
        locationName: form.locationName,
        allocationType: form.allocationType,
        periods: cleanPeriods,
        status: form.status,
        creator: currentUser,
        createdDate: getDDMMYYYY(),
      };
      onUpdate([...(allocations || []), newRec]);
    }

    setIsEditing(false);
    setEditingId(null);
  };

  const activeGrants = useMemo(
    () => (grants || []).filter((g) => !g.status || g.status === "Active"),
    [grants],
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Render: Form
  // ────────────────────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Ribbon Header */}
          <div
            className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white`}>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {editingId ? "Edit Grant Allocation" : "New Grant Allocation"}
              </h2>
              <p className="text-xs opacity-75 mt-0.5">
                Configure how expenses for a location are allocated to grants
                across periods
              </p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="opacity-60 hover:opacity-100 transition p-1 rounded-lg hover:bg-white/10">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {/* Section 1 – Location */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`w-6 h-6 rounded-full bg-${themeColor} text-white flex items-center justify-center text-[10px] font-black`}>
                  1
                </span>
                <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                  Location
                </h2>
              </div>
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Location <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={form.locationName}
                    onChange={handleLocationSelect}
                    className={`pl-8 pr-4 py-2.5 w-full text-sm rounded-xl border bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none ${
                      errors.locationName ? "border-rose-400" : (
                        "border-slate-200 dark:border-slate-600"
                      )
                    }`}>
                    <option value="">Select location…</option>
                    {(locations || []).map((l) => (
                      <option
                        key={l.id}
                        value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.locationName && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.locationName}
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* Section 2 – Allocation Type & Status */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`w-6 h-6 rounded-full bg-${themeColor} text-white flex items-center justify-center text-[10px] font-black`}>
                  2
                </span>
                <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                  Allocation Type & Status
                </h2>
              </div>
              <div className="flex items-center gap-4">
                {(["percentage", "absolute"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("allocationType", type)}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      form.allocationType === type ?
                        "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                    }`}>
                    {type === "percentage" ?
                      <Percent size={15} />
                    : <DollarSign size={15} />}
                    {type === "percentage" ? "Percentage (%)" : "Absolute (₹)"}
                    {type === "percentage" && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                        Default
                      </span>
                    )}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Status:
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                    className="text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* Section 3 – Periods & Grant Allocation Lines */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`w-6 h-6 rounded-full bg-${themeColor} text-white flex items-center justify-center text-[10px] font-black`}>
                  3
                </span>
                <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                  Periods &amp; Grant Allocation Lines
                </h2>
              </div>

              <div className="space-y-4">
                {form.periods.map((period, pIdx) => {
                  const pctTotal =
                    form.allocationType === "percentage" ?
                      period.lines.reduce((s, l) => s + Number(l.value || 0), 0)
                    : 0;

                  return (
                    <div
                      key={period.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                      {/* Period header bar */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-600">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black shrink-0">
                          {pIdx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                          Period {pIdx + 1}
                        </span>

                        {/* Date range */}
                        <div className="flex items-center gap-2 ml-4">
                          <div className="relative">
                            <Calendar
                              size={12}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <CompactDatePicker
                              value={period.startDate}
                              onChange={(value) =>
                                setPeriodField(
                                  period.id,
                                  "startDate",
                                  value,
                                )
                              }
                              className={`pl-7 pr-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 dark:text-slate-100 ${
                                errors[`${period.id}_startDate`] ?
                                  "border-rose-400"
                                : "border-slate-200 dark:border-slate-600"
                              }`}
                            />
                          </div>
                          <span className="text-slate-400 text-xs">→</span>
                          <div className="relative">
                            <Calendar
                              size={12}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <CompactDatePicker
                              value={period.endDate}
                              onChange={(value) =>
                                setPeriodField(
                                  period.id,
                                  "endDate",
                                  value,
                                )
                              }
                              className={`pl-7 pr-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 dark:text-slate-100 ${
                                errors[`${period.id}_endDate`] ?
                                  "border-rose-400"
                                : "border-slate-200 dark:border-slate-600"
                              }`}
                            />
                          </div>
                        </div>

                        {/* % total badge */}
                        {form.allocationType === "percentage" && (
                          <div
                            className={`ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${
                              Math.abs(pctTotal - 100) <= 0.01 ?
                                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}>
                            <Percent size={10} />
                            {pctTotal.toFixed(2)}%
                            {Math.abs(pctTotal - 100) <= 0.01 && (
                              <CheckCircle2 size={10} />
                            )}
                          </div>
                        )}

                        {/* Remove period */}
                        {form.periods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePeriod(period.id)}
                            className="ml-auto p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Remove period">
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Date errors */}
                      {(errors[`${period.id}_startDate`] ||
                        errors[`${period.id}_endDate`]) && (
                        <div className="px-4 pt-2 flex gap-4">
                          {errors[`${period.id}_startDate`] && (
                            <p className="text-xs text-rose-500">
                              Start: {errors[`${period.id}_startDate`]}
                            </p>
                          )}
                          {errors[`${period.id}_endDate`] && (
                            <p className="text-xs text-rose-500">
                              End: {errors[`${period.id}_endDate`]}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Grant lines */}
                      <div className="p-4 space-y-2">
                        {errors[`${period.id}_lines`] && (
                          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                            <AlertCircle size={13} />
                            {errors[`${period.id}_lines`]}
                          </div>
                        )}

                        {/* Grant lines header */}
                        <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-2 mb-1 px-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Grantor
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Grant Name
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {form.allocationType === "percentage" ?
                              "%"
                            : "₹ Amount"}
                          </span>
                          <span className="w-7" />
                        </div>

                        {period.lines.map((line, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[2fr_2fr_1fr_auto] gap-2 items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                            <select
                              value={line.grantId}
                              onChange={(e) =>
                                setLineField(
                                  period.id,
                                  idx,
                                  "grantId",
                                  e.target.value,
                                )
                              }
                              className="text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full">
                              <option value="">Select grantor…</option>
                              {activeGrants.map((g) => (
                                <option
                                  key={g.id}
                                  value={g.id}>
                                  {g.nameOfGrantor || g.name || g.id}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={line.grantName}
                              readOnly
                              placeholder="Auto-filled from grant…"
                              className="text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 w-full cursor-default"
                            />

                            <input
                              type="number"
                              min={0}
                              max={
                                form.allocationType === "percentage" ?
                                  100
                                : undefined
                              }
                              step={
                                form.allocationType === "percentage" ? 0.01 : 1
                              }
                              value={line.value || ""}
                              onChange={(e) =>
                                setLineField(
                                  period.id,
                                  idx,
                                  "value",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder={
                                form.allocationType === "percentage" ? "%" : "₹"
                              }
                              className="text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-right"
                            />

                            <button
                              type="button"
                              onClick={() => removeLine(period.id, idx)}
                              disabled={period.lines.length === 1}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addLine(period.id)}
                          className="mt-1 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                          <Plus size={13} />
                          Add Grantor
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add another period */}
              <button
                type="button"
                onClick={addPeriod}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <Plus size={14} />
                Add Another Period
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-8 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`px-8 py-3 rounded-2xl text-sm font-extrabold text-white bg-${themeColor} shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2`}>
                <CheckCircle2 size={15} />
                Save Allocation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Render: List
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Ribbon Header */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white`}>
          <h2 className="text-xl font-extrabold tracking-tight">
            Grant Allocation Master
          </h2>
          <button className="opacity-60 hover:opacity-100 transition">
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Search + Filters + Action Buttons */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="relative flex-1 min-w-[320px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by location, grantor or grant..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition dark:text-white font-medium"
              />
              <Search
                size={18}
                className="absolute left-4 top-3.5 text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600">
                <option value="">All Locations</option>
                {locationOpts.map((l) => (
                  <option
                    key={String(l.id)}
                    value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button
                onClick={openAddForm}
                className={`flex items-center gap-2 px-8 py-3 bg-${themeColor} text-white rounded-2xl text-sm font-extrabold shadow-lg hover:shadow-xl transition transform hover:scale-105`}>
                <Plus size={15} />
                New Allocation
              </button>
              <button
                onClick={() =>
                  alert("Exporting Grant Allocation data to Excel...")
                }
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-md">
                📥 Export to Excel
              </button>
            </div>
          </div>

          {/* Summary chips */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              {
                label: "Total Allocations",
                value: (allocations || []).length,
                color:
                  "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300",
              },
              {
                label: "Active",
                value: (allocations || []).filter((a) => a.status === "Active")
                  .length,
                color:
                  "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
              },
              {
                label: "Inactive",
                value: (allocations || []).filter(
                  (a) => a.status === "Inactive",
                ).length,
                color:
                  "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
              },
            ].map((chip) => (
              <div
                key={chip.label}
                className={`px-4 py-2 rounded-xl text-xs font-black ${chip.color}`}>
                {chip.value} {chip.label}
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-5 w-12">
                    <input
                      type="checkbox"
                      className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-5">Actions</th>
                  <th className="px-6 py-5">Location</th>
                  <th className="px-6 py-5">Periods</th>
                  <th className="px-6 py-5">Allocation Type</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right sticky right-0 bg-slate-50 dark:bg-slate-900 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.1)]">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.length > 0 ?
                  filtered.map((rec) => (
                    <AllocationRow
                      key={rec.id}
                      rec={rec}
                      onEdit={() => openEditForm(rec)}
                      onDelete={() => handleDelete(rec.id)}
                    />
                  ))
                : <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-slate-400 text-sm font-medium">
                      No grant allocations found.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-8 px-4 gap-4">
            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>
                Showing {filtered.length} of {(allocations || []).length}{" "}
                results
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Allocation Row ─────────────────────────────────────────────────────────────

const AllocationRow: React.FC<{
  rec: GrantAllocationRecord;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ rec, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(),
  );

  const togglePeriod = (pid: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const periods = rec.periods || [];

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="text-indigo-400 hover:text-indigo-600 transition"
              title="Edit">
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="text-rose-400 hover:text-rose-600 transition"
              title="Delete">
              🗑️
            </button>
          </div>
        </td>
        <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">
          {rec.locationName}
        </td>
        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {periods.length} period{periods.length !== 1 ? "s" : ""}
        </td>
        <td className="px-6 py-4">
          <span
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
              rec.allocationType === "percentage" ?
                "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            }`}>
            {rec.allocationType === "percentage" ?
              "% Percentage"
            : "₹ Absolute"}
          </span>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={rec.status} />
        </td>
        <td className="px-6 py-4 text-right sticky right-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            title={expanded ? "Collapse" : "Expand"}>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </td>
      </tr>

      {/* Expanded: periods */}
      {expanded && (
        <tr className="bg-slate-50/50 dark:bg-slate-900/30">
          <td
            colSpan={7}
            className="px-8 py-4">
            <div className="space-y-3">
              {periods.map((period, pIdx) => {
                const isOpen = expandedPeriods.has(period.id);
                const pctTotal =
                  rec.allocationType === "percentage" ?
                    period.lines.reduce((s, l) => s + Number(l.value || 0), 0)
                  : 0;

                return (
                  <div
                    key={period.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => togglePeriod(period.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black shrink-0">
                        {pIdx + 1}
                      </span>
                      <Calendar
                        size={13}
                        className="text-slate-400 shrink-0"
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatDate(period.startDate)} –{" "}
                        {formatDate(period.endDate)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        · {period.lines.length} grant
                        {period.lines.length !== 1 ? "s" : ""}
                      </span>
                      {rec.allocationType === "percentage" && (
                        <span
                          className={`ml-auto mr-2 text-[10px] font-black px-2 py-0.5 rounded-lg ${
                            Math.abs(pctTotal - 100) <= 0.01 ?
                              "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                          }`}>
                          {pctTotal.toFixed(2)}%
                        </span>
                      )}
                      <ChevronDown
                        size={13}
                        className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${rec.allocationType !== "percentage" ? "ml-auto" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="grid grid-cols-[2fr_2fr_1fr] gap-2 mb-2 px-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Grantor
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Grant Name
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                            {rec.allocationType === "percentage" ?
                              "Allocation %"
                            : "Amount (₹)"}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {period.lines.map((line, i) => (
                            <div
                              key={i}
                              className="grid grid-cols-[2fr_2fr_1fr] gap-2 items-center bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-100 dark:border-slate-700">
                              <span className="text-sm text-slate-700 dark:text-slate-200 font-semibold truncate">
                                {line.grantorName || "—"}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                {line.grantName || "—"}
                              </span>
                              <span className="text-sm font-black text-indigo-700 dark:text-indigo-300 text-right">
                                {rec.allocationType === "percentage" ?
                                  `${Number(line.value).toFixed(2)}%`
                                : fmtCurr(line.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
