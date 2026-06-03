import React, { useState, useMemo } from "react";
import { CompanyDetailsDrawer } from "./CompanyDetailsDrawer";
import { CompactDatePicker } from "../shared/CompactDatePicker";

interface DataItem {
  id: number;
  name: string;
  code?: string;
  status: string;
  creator: string;
  date: string;
  // Specific for User
  email?: string;
  type?: string;
  role?: string;
  fund?: string;
  grant?: string;
  func?: string;
  proj?: string;
  // Specific for Company
  orgType?: string;
  pan?: string;
  tan?: string;
  gst?: string;
  csr1?: string;
  incorpNo?: string;
  registeredUnder?: string;
  eightyGNo?: string;
  eightyGDate?: string;
  twelveANo?: string;
  twelveADate?: string;
  fcraNo?: string;
  fcraDate?: string;
  darpanId?: string;
  contact?: string;
  website?: string;
  address?: string;
  // Specific for Location
  region?: string;
  state?: string;
  city?: string;
  // Specific for Project
  locations?: string[];
  // Specific for FY
  startDate?: string;
  endDate?: string;
}

interface MasterDataPageProps {
  entityName: string;
  onAddNew: () => void;
  data: DataItem[];
  onUpdate?: (newData: DataItem[]) => void;
  onEditItem?: (item: DataItem) => void;
  themeColor?: string;
}

export const MasterDataPage: React.FC<MasterDataPageProps> = ({
  entityName,
  onAddNew,
  data,
  onUpdate,
  onEditItem,
  themeColor = "indigo-800",
}) => {
  const isUserEntity = entityName === "User";
  const isFundTypeEntity = entityName === "Fund Type";
  const isCompanyEntity = entityName === "Company";
  const isLocationEntity = entityName === "Location";
  const isProjectEntity = entityName === "Project";
  const isFinancialYearEntity = entityName === "Financial Year";

  // States
  const [filterName, setFilterName] = useState("");
  const [filterIdentifier, setFilterIdentifier] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<DataItem | null>(null);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((item) => {
      if (!item) return false;

      const itemName = item.name || "";
      const matchesName = itemName
        .toLowerCase()
        .includes((filterName || "").toLowerCase());

      const identifier =
        isUserEntity ? item.email || ""
        : isCompanyEntity ? item.pan || ""
        : item.code || "";
      const matchesIdentifier = identifier
        .toLowerCase()
        .includes((filterIdentifier || "").toLowerCase());

      const itemRole = isLocationEntity ? item.region || "" : item.role || "";
      const matchesRole =
        filterRole === "" ||
        itemRole.toLowerCase().includes((filterRole || "").toLowerCase());

      const matchesStatus = filterStatus === "" || item.status === filterStatus;

      return matchesName && matchesIdentifier && matchesRole && matchesStatus;
    });
  }, [
    data,
    filterName,
    filterIdentifier,
    filterRole,
    filterStatus,
    isUserEntity,
    isCompanyEntity,
    isLocationEntity,
  ]);

  const handleStatusChange = (id: number, newStatus: string) => {
    if (onUpdate) {
      const newData = data.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item,
      );
      onUpdate(newData);
    }
  };

  const handleExport = () => {
    alert(`Exporting ${entityName} data to Excel...`);
  };

  const handleEdit = (item: DataItem) => {
    if (onEditItem) {
      onEditItem(item);
      return;
    }
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    if (
      confirm(
        `Are you sure you want to delete this ${entityName.toLowerCase()}?`,
      )
    ) {
      if (onUpdate) {
        const newData = data.filter((item) => item.id !== id);
        onUpdate(newData);
      }
    }
  };

  const handleSaveEdit = () => {
    if (editingItem && onUpdate) {
      const newData = data.map((item) =>
        item.id === editingItem.id ? editingItem : item,
      );
      onUpdate(newData);
      setShowEditModal(false);
      setEditingItem(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  const safeEntityName = entityName || "Record";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Ribbon Header */}
        <div
          className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white`}>
          <h2 className="text-xl font-extrabold tracking-tight">
            {safeEntityName} Master
          </h2>
          <button className="opacity-60 hover:opacity-100 transition">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div className="p-8">
          <div className="flex flex-wrap gap-4 items-center mb-8">
            <div className="relative flex-1 min-w-[320px]">
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder={`Search ${safeEntityName.toLowerCase()} by name...`}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition dark:text-white font-medium"
              />
              <svg
                className="w-5 h-5 absolute left-4 top-3.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="flex items-center gap-2">
              {!isFundTypeEntity && !isFinancialYearEntity && (
                <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition">
                  ⚙️ Columns
                </button>
              )}
              <button
                onClick={onAddNew}
                className={`flex items-center gap-2 px-8 py-3 bg-${themeColor} text-white rounded-2xl text-sm font-extrabold shadow-lg hover:shadow-xl transition transform hover:scale-105`}>
                <span className="text-lg">+</span> Add
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-md">
                📥 Export to Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                  {!isFundTypeEntity && (
                    <th className="px-6 py-5 w-12">
                      <input
                        type="checkbox"
                        className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  {!isFundTypeEntity &&
                    !isCompanyEntity &&
                    !isLocationEntity &&
                    !isProjectEntity &&
                    !isFinancialYearEntity && (
                      <th className="px-6 py-5">Actions</th>
                    )}

                  <th className="px-6 py-5">
                    {isCompanyEntity ?
                      "Organisation Name"
                    : isLocationEntity ?
                      "Location Name"
                    : isProjectEntity ?
                      "Project Name"
                    : isFinancialYearEntity ?
                      "Financial Year"
                    : isUserEntity ?
                      "Full Name"
                    : "Name"}
                  </th>

                  {isUserEntity && (
                    <>
                      <th className="px-6 py-5">Work Email</th>
                      <th className="px-6 py-5">Type</th>
                      <th className="px-6 py-5">Role</th>
                    </>
                  )}

                  {isCompanyEntity && (
                    <>
                      <th className="px-6 py-5">Type of Organisation</th>
                      <th className="px-6 py-5">PAN</th>
                      <th className="px-6 py-5">TAN</th>
                      <th className="px-6 py-5">GST</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </>
                  )}

                  {isLocationEntity && (
                    <>
                      <th className="px-6 py-5">Region</th>
                      <th className="px-6 py-5">State</th>
                      <th className="px-6 py-5">City / District</th>
                      <th className="px-6 py-5">Address</th>
                    </>
                  )}

                  {isFinancialYearEntity && (
                    <>
                      <th className="px-6 py-5">Start Date</th>
                      <th className="px-6 py-5">End Date</th>
                    </>
                  )}

                  {isProjectEntity && <th className="px-6 py-5">Locations</th>}

                  {!isUserEntity &&
                    !isCompanyEntity &&
                    !isLocationEntity &&
                    !isFinancialYearEntity && (
                      <th className="px-6 py-5">Code ID</th>
                    )}

                  {!isFundTypeEntity && <th className="px-6 py-5">Status</th>}

                  {!isUserEntity &&
                    !isFundTypeEntity &&
                    !isCompanyEntity &&
                    !isLocationEntity &&
                    !isProjectEntity &&
                    !isFinancialYearEntity && (
                      <th className="px-6 py-5">Address</th>
                    )}

                  {(isFundTypeEntity ||
                    isLocationEntity ||
                    isProjectEntity ||
                    isFinancialYearEntity) && (
                    <th className="px-6 py-5 text-right sticky right-0 bg-slate-50 dark:bg-slate-900 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.1)]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.length > 0 ?
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      {!isFundTypeEntity && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                      )}
                      {!isFundTypeEntity &&
                        !isCompanyEntity &&
                        !isLocationEntity &&
                        !isProjectEntity &&
                        !isFinancialYearEntity && (
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-indigo-400 hover:text-indigo-600 transition"
                                title="Edit">
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-rose-400 hover:text-rose-600 transition"
                                title="Delete">
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}

                      <td
                        className={`px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 ${isCompanyEntity ? "cursor-pointer hover:text-brand-600 transition-colors" : ""}`}
                        onClick={() =>
                          isCompanyEntity && setSelectedCompany(item)
                        }>
                        {item.name}
                      </td>

                      {isUserEntity && (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {item.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {item.type}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                              {item.role}
                            </span>
                          </td>
                        </>
                      )}

                      {isCompanyEntity && (
                        <>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">
                            {item.orgType}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-600">
                            {item.pan}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-600">
                            {item.tan}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-600">
                            {item.gst}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-indigo-400 hover:text-indigo-600 transition"
                                title="Edit">
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-rose-400 hover:text-rose-600 transition"
                                title="Delete">
                                🗑️
                              </button>
                            </div>
                          </td>
                        </>
                      )}

                      {isLocationEntity && (
                        <>
                          <td className="px-6 py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                            {item.region}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {item.state}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                            {item.city}
                          </td>
                          <td
                            className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs"
                            title={item.address}>
                            {item.address}
                          </td>
                        </>
                      )}

                      {isFinancialYearEntity && (
                        <>
                          <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                            {item.startDate}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                            {item.endDate}
                          </td>
                        </>
                      )}

                      {isProjectEntity && (
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400 italic">
                          {item.locations?.join(", ") || "--"}
                        </td>
                      )}

                      {!isUserEntity &&
                        !isCompanyEntity &&
                        !isLocationEntity &&
                        !isFinancialYearEntity && (
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">
                            {item.code}
                          </td>
                        )}

                      {!isFundTypeEntity && !isCompanyEntity && (
                        <td className="px-6 py-4">
                          {isFinancialYearEntity ?
                            <select
                              value={item.status}
                              onChange={(e) =>
                                handleStatusChange(item.id, e.target.value)
                              }
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider outline-none border-none cursor-pointer transition-colors shadow-sm ${
                                item.status === "Open" ?
                                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
                                : item.status === "Lock" ?
                                  "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
                              }`}>
                              <option value="Open">Open</option>
                              <option value="Lock">Lock</option>
                              <option value="Close">Close</option>
                            </select>
                          : <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500"}`}>
                              {item.status}
                            </span>
                          }
                        </td>
                      )}

                      {!isUserEntity &&
                        !isFundTypeEntity &&
                        !isCompanyEntity &&
                        !isLocationEntity &&
                        !isProjectEntity &&
                        !isFinancialYearEntity && (
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            123 Primary Avenue, Hub 4, Suite 101
                          </td>
                        )}

                      {(isFundTypeEntity ||
                        isLocationEntity ||
                        isProjectEntity ||
                        isFinancialYearEntity) && (
                        <td className="px-6 py-4 text-right sticky right-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-indigo-400 hover:text-indigo-600 transition"
                              title="Edit">
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-rose-400 hover:text-rose-600 transition"
                              title="Delete">
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                : <tr>
                    <td
                      colSpan={25}
                      className="px-6 py-10 text-center text-slate-400 text-sm font-medium">
                      No records found matching filters.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-8 px-4 gap-4">
            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>
                Showing {filteredData.length} of {data.length} results
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`bg-${themeColor} px-8 py-6 text-white`}>
              <h3 className="text-xl font-black uppercase tracking-tight">
                Edit {entityName}
              </h3>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                Update {entityName.toLowerCase()} details
              </p>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isFundTypeEntity ?
                      "Fund Name"
                    : isProjectEntity ?
                      "Project Name"
                    : isLocationEntity ?
                      "Location Name"
                    : isFinancialYearEntity ?
                      "Financial Year"
                    : "Name"}
                  </label>
                  <input
                    type="text"
                    value={editingItem.name || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold"
                  />
                </div>

                {/* Code Field - for Fund Type and non-FY entities */}
                {!isLocationEntity && !isFinancialYearEntity && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {isFundTypeEntity ? "Fund Code" : "Code"}
                    </label>
                    <input
                      type="text"
                      value={editingItem.code || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, code: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold"
                    />
                  </div>
                )}

                {/* Status Field - for Fund Type */}
                {isFundTypeEntity && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Status
                    </label>
                    <select
                      value={editingItem.status || "Active"}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}

                {/* Location specific fields */}
                {isLocationEntity && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Region
                        </label>
                        <input
                          type="text"
                          value={editingItem.region || ""}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              region: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={editingItem.state || ""}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              state: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={editingItem.city || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Address
                      </label>
                      <textarea
                        value={editingItem.address || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold"
                      />
                    </div>
                  </>
                )}

                {/* Financial Year specific fields */}
                {isFinancialYearEntity && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Start Date
                        </label>
                        <CompactDatePicker
                          value={editingItem.startDate || ""}
                          onChange={(value) =>
                            setEditingItem({
                              ...editingItem,
                              startDate: value,
                            })
                          }
                          className="border border-slate-200 bg-slate-50 px-4 py-3 font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          End Date
                        </label>
                        <CompactDatePicker
                          value={editingItem.endDate || ""}
                          onChange={(value) =>
                            setEditingItem({
                              ...editingItem,
                              endDate: value,
                            })
                          }
                          className="border border-slate-200 bg-slate-50 px-4 py-3 font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Status
                      </label>
                      <select
                        value={editingItem.status || "Open"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold">
                        <option value="Open">Open</option>
                        <option value="Lock">Lock</option>
                        <option value="Close">Close</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4 mt-8 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className={`px-6 py-3 bg-${themeColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition`}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Side Bar for Company Details */}
      <CompanyDetailsDrawer
        company={selectedCompany as any}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
};
