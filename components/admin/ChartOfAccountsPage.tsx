import React, { useState, useMemo } from "react";

interface PartyAccountDetails {
  panNo: string;
  address: string;
  contactNo: string;
  gstNo: string;
  nameAsPerBank: string;
  bankDetails: string;
  ifscCode: string;
  tdsCode: string;
  attachments: string[];
}

interface LedgerItem {
  name: string;
  isPartyAccount?: boolean;
  partyDetails?: PartyAccountDetails;
}

type LedgerEntry = string | LedgerItem;

interface Group {
  name: string;
  ledgers: LedgerEntry[];
}

interface MasterCategory {
  master: string;
  groups: Group[];
}

interface ChartOfAccountsPageProps {
  data: MasterCategory[];
  onUpdate: (newData: MasterCategory[]) => void;
  themeColor: string;
}

type COASubMenu = "Add Group" | "Add Ledgers";
type MasterTab = "All" | "Assets" | "Liabilities" | "Income" | "Expenditure";

export const ChartOfAccountsPage: React.FC<ChartOfAccountsPageProps> = ({
  data,
  onUpdate,
  themeColor,
}) => {
  const [activeSubMenu, setActiveSubMenu] = useState<COASubMenu>("Add Group");
  const [activeMasterTab, setActiveMasterTab] = useState<MasterTab>("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: "group" | "ledger";
    master: string;
    groupName: string;
    originalName: string;
  } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter states
  const [filterMaster, setFilterMaster] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterLedger, setFilterLedger] = useState("");

  // Form states
  const [groupFormData, setGroupFormData] = useState({
    master: "Assets",
    groupName: "",
  });
  const [ledgerFormData, setLedgerFormData] = useState({
    master: "",
    groupName: "",
    ledgerName: "",
    isPartyAccount: "No",
    panNo: "",
    address: "",
    contactNo: "",
    gstNo: "",
    nameAsPerBank: "",
    bankDetails: "",
    ifscCode: "",
    tdsCode: "",
    attachments: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({ name: "" });

  const tabs: MasterTab[] = [
    "All",
    "Assets",
    "Liabilities",
    "Income",
    "Expenditure",
  ];

  const toggleGroupExpansion = (master: string, groupName: string) => {
    const key = `${master}-${groupName}`;
    const next = new Set(expandedGroups);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedGroups(next);
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.groupName) return;

    const masterIdx = data.findIndex((m) => m.master === groupFormData.master);
    if (
      data[masterIdx].groups.some(
        (g) =>
          (g.name || "").toLowerCase() ===
          groupFormData.groupName.toLowerCase(),
      )
    ) {
      alert("Group already exists in this Master category.");
      return;
    }

    const newData = data.map((m) => {
      if (m.master === groupFormData.master) {
        return {
          ...m,
          groups: [...m.groups, { name: groupFormData.groupName, ledgers: [] }],
        };
      }
      return m;
    });

    onUpdate(newData);
    setGroupFormData({ ...groupFormData, groupName: "" });
    setIsAdding(false);
  };

  const handleAddLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerFormData.groupName || !ledgerFormData.ledgerName) return;

    const newData = data.map((m) => {
      return {
        ...m,
        groups: m.groups.map((g) => {
          if (g.name === ledgerFormData.groupName) {
            const ledgerName = ledgerFormData.ledgerName.toLowerCase();
            const exists = g.ledgers.some((l) => {
              const name = typeof l === "string" ? l : l.name;
              return (name || "").toLowerCase() === ledgerName;
            });
            if (exists) {
              alert("Ledger already exists in this group.");
              return g;
            }

            const newLedger: LedgerEntry =
              ledgerFormData.isPartyAccount === "Yes" ?
                {
                  name: ledgerFormData.ledgerName,
                  isPartyAccount: true,
                  partyDetails: {
                    panNo: ledgerFormData.panNo,
                    address: ledgerFormData.address,
                    contactNo: ledgerFormData.contactNo,
                    gstNo: ledgerFormData.gstNo,
                    nameAsPerBank: ledgerFormData.nameAsPerBank,
                    bankDetails: ledgerFormData.bankDetails,
                    ifscCode: ledgerFormData.ifscCode,
                    tdsCode: ledgerFormData.tdsCode,
                    attachments: ledgerFormData.attachments,
                  },
                }
              : ledgerFormData.ledgerName;

            return { ...g, ledgers: [...g.ledgers, newLedger] };
          }
          return g;
        }),
      };
    });

    onUpdate(newData);
    setLedgerFormData({
      master: "",
      groupName: "",
      ledgerName: "",
      isPartyAccount: "No",
      panNo: "",
      address: "",
      contactNo: "",
      gstNo: "",
      nameAsPerBank: "",
      bankDetails: "",
      ifscCode: "",
      tdsCode: "",
      attachments: [],
    });
    setIsAdding(false);
  };

  const handleDeleteGroup = (master: string, groupName: string) => {
    const confirm = window.confirm(
      `Delete group "${groupName}" and all its ledgers?`,
    );
    if (!confirm) return;

    const newData = data.map((m) => {
      if (m.master === master) {
        return { ...m, groups: m.groups.filter((g) => g.name !== groupName) };
      }
      return m;
    });
    onUpdate(newData);
  };

  const handleDeleteLedger = (
    master: string,
    groupName: string,
    ledgerName: string,
  ) => {
    const confirm = window.confirm(`Delete ledger "${ledgerName}"?`);
    if (!confirm) return;

    const newData = data.map((m) => {
      if (m.master === master) {
        return {
          ...m,
          groups: m.groups.map((g) => {
            if (g.name === groupName) {
              return {
                ...g,
                ledgers: g.ledgers.filter((l) => {
                  const name = typeof l === "string" ? l : l.name;
                  return name !== ledgerName;
                }),
              };
            }
            return g;
          }),
        };
      }
      return m;
    });
    onUpdate(newData);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editFormData.name) return;

    const newData = data.map((m) => {
      if (m.master === editingItem.master) {
        return {
          ...m,
          groups: m.groups.map((g) => {
            if (
              editingItem.type === "group" &&
              g.name === editingItem.originalName
            ) {
              return { ...g, name: editFormData.name };
            }
            if (
              editingItem.type === "ledger" &&
              g.name === editingItem.groupName
            ) {
              return {
                ...g,
                ledgers: g.ledgers.map((l) => {
                  const name = typeof l === "string" ? l : l.name;
                  if (name === editingItem.originalName) {
                    return typeof l === "string" ?
                        editFormData.name
                      : { ...l, name: editFormData.name };
                  }
                  return l;
                }),
              };
            }
            return g;
          }),
        };
      }
      return m;
    });

    onUpdate(newData);
    setEditingItem(null);
    setEditFormData({ name: "" });
  };

  const flattenedLedgers = useMemo(() => {
    const list: { master: string; group: string; ledger: string }[] = [];
    data.forEach((m) => {
      m.groups.forEach((g) => {
        g.ledgers.forEach((l) => {
          const ledgerName = typeof l === "string" ? l : l.name;
          list.push({
            master: m.master || "",
            group: g.name || "",
            ledger: ledgerName || "",
          });
        });
      });
    });
    return list;
  }, [data]);

  const flattenedGroups = useMemo(() => {
    const list: {
      master: string;
      group: string;
      ledgerCount: number;
      ledgers: string[];
    }[] = [];
    data.forEach((m) => {
      m.groups.forEach((g) => {
        const ledgerNames = g.ledgers.map((l) =>
          typeof l === "string" ? l : l.name,
        );
        list.push({
          master: m.master || "",
          group: g.name || "",
          ledgerCount: (g.ledgers || []).length,
          ledgers: ledgerNames || [],
        });
      });
    });
    return list;
  }, [data]);

  const filteredGroups = useMemo(() => {
    let list = [...flattenedGroups];
    if (activeMasterTab !== "All")
      list = list.filter((g) => g.master === activeMasterTab);
    if (filterMaster)
      list = list.filter((g) =>
        g.master.toLowerCase().includes(filterMaster.toLowerCase()),
      );
    if (filterGroup)
      list = list.filter((g) =>
        g.group.toLowerCase().includes(filterGroup.toLowerCase()),
      );
    return list;
  }, [flattenedGroups, activeMasterTab, filterMaster, filterGroup]);

  const filteredLedgers = useMemo(() => {
    let list = [...flattenedLedgers];
    if (activeMasterTab !== "All")
      list = list.filter((l) => l.master === activeMasterTab);
    if (filterMaster)
      list = list.filter((l) =>
        l.master.toLowerCase().includes(filterMaster.toLowerCase()),
      );
    if (filterGroup)
      list = list.filter((l) =>
        l.group.toLowerCase().includes(filterGroup.toLowerCase()),
      );
    if (filterLedger)
      list = list.filter((l) =>
        l.ledger.toLowerCase().includes(filterLedger.toLowerCase()),
      );
    return list;
  }, [
    flattenedLedgers,
    activeMasterTab,
    filterMaster,
    filterGroup,
    filterLedger,
  ]);

  const allAvailableGroups = useMemo(() => {
    return data.flatMap((m) =>
      (m.groups || []).map((g) => ({
        master: m.master || "",
        groupName: g.name || "",
      })),
    );
  }, [data]);

  const filteredGroupsForAddLedger = useMemo(() => {
    if (!ledgerFormData.master) return [];
    return allAvailableGroups.filter((g) => g.master === ledgerFormData.master);
  }, [allAvailableGroups, ledgerFormData.master]);

  const renderEditModal = () => {
    if (!editingItem) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-10 max-w-lg w-full border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Modify {editingItem.type}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                Classification: {editingItem.master}
              </p>
            </div>
            <button
              onClick={() => setEditingItem(null)}
              className="text-2xl text-slate-400 hover:text-slate-600 transition-colors">
              ×
            </button>
          </div>
          <form
            onSubmit={handleEditSave}
            className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                Updated Name
              </label>
              <input
                type="text"
                required
                autoFocus
                value={editFormData.name}
                onChange={(e) => setEditFormData({ name: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white focus:ring-4 focus:ring-brand-500/10 outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition">
                Dismiss
              </button>
              <button
                type="submit"
                className={`flex-1 py-4 bg-${themeColor} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition`}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderAllMasterCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {["Assets", "Liabilities", "Income", "Expenditure"].map((m) => {
        const masterData = data.find((cat) => cat.master === m);
        const groupCount = masterData?.groups.length || 0;
        const ledgerCount =
          masterData?.groups.reduce(
            (acc, g) => acc + (g.ledgers || []).length,
            0,
          ) || 0;

        const colors: any = {
          Assets: "emerald",
          Liabilities: "rose",
          Income: "indigo",
          Expenditure: "amber",
        };
        const color = colors[m];

        return (
          <button
            key={m}
            onClick={() => setActiveMasterTab(m as MasterTab)}
            className={`group bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all text-left transform hover:-translate-y-2 border-b-8 border-b-${color}-500`}>
            <div
              className={`w-16 h-16 bg-${color}-50 dark:bg-${color}-900/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
              {m === "Assets" ?
                "💰"
              : m === "Liabilities" ?
                "⚖️"
              : m === "Income" ?
                "📈"
              : "📉"}
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-4">
              {m}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Account Groups</span>
                <span className={`text-${color}-600`}>{groupCount}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Ledger Records</span>
                <span className={`text-${color}-600`}>{ledgerCount}</span>
              </div>
            </div>
            <div
              className={`mt-8 text-[10px] font-black text-${color}-600 uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all`}>
              View Directory <span>→</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      {renderEditModal()}

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
            Chart of Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Hierarchical Master Records
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(["Add Group", "Add Ledgers"] as COASubMenu[]).map((menu) => (
            <button
              key={menu}
              onClick={() => {
                setActiveSubMenu(menu);
                setIsAdding(false);
                setFilterGroup("");
                setFilterMaster("");
                setFilterLedger("");
              }}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubMenu === menu ? `bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700` : "text-slate-500 hover:text-slate-800"}`}>
              {menu}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMasterTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeMasterTab === tab ? `bg-${themeColor} text-white shadow-lg` : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}>
              {tab}
            </button>
          ))}
        </div>
        {activeMasterTab !== "All" && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`px-10 py-3 bg-${themeColor} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition transform active:scale-95`}>
            {isAdding ?
              "✕ Cancel"
            : `+ New ${activeSubMenu === "Add Group" ? "Group" : "Ledger"}`}
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-10 bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border-2 border-brand-500 shadow-2xl animate-in zoom-in duration-300">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 border-b pb-4 border-slate-100 dark:border-slate-700">
            {activeSubMenu === "Add Group" ?
              "Create Account Group"
            : "Create Account Ledger"}
          </h3>
          {activeSubMenu === "Add Group" ?
            <form
              onSubmit={handleAddGroup}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Master Category
                </label>
                <select
                  value={groupFormData.master}
                  onChange={(e) =>
                    setGroupFormData({
                      ...groupFormData,
                      master: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition">
                  {["Assets", "Liabilities", "Income", "Expenditure"].map(
                    (m) => (
                      <option
                        key={m}
                        value={m}>
                        {m}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Group Description
                </label>
                <input
                  type="text"
                  required
                  value={groupFormData.groupName}
                  onChange={(e) =>
                    setGroupFormData({
                      ...groupFormData,
                      groupName: e.target.value,
                    })
                  }
                  placeholder="e.g. Current Assets"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                />
              </div>
              <button
                type="submit"
                className="py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition">
                Create Group
              </button>
            </form>
          : <form
              onSubmit={handleAddLedger}
              className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Parent Category
                  </label>
                  <select
                    required
                    value={ledgerFormData.master}
                    onChange={(e) =>
                      setLedgerFormData({
                        ...ledgerFormData,
                        master: e.target.value,
                        groupName: "",
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition">
                    <option value="">-- Select Parent --</option>
                    {["Assets", "Liabilities", "Income", "Expenditure"].map(
                      (m) => (
                        <option
                          key={m}
                          value={m}>
                          {m}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Assign to Group
                  </label>
                  <select
                    required
                    disabled={!ledgerFormData.master}
                    value={ledgerFormData.groupName}
                    onChange={(e) =>
                      setLedgerFormData({
                        ...ledgerFormData,
                        groupName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition disabled:opacity-50">
                    <option value="">-- Select Group --</option>
                    {filteredGroupsForAddLedger.map((g) => (
                      <option
                        key={g.groupName}
                        value={g.groupName}>
                        {g.groupName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Ledger / Account Name
                  </label>
                  <input
                    type="text"
                    required
                    value={ledgerFormData.ledgerName}
                    onChange={(e) =>
                      setLedgerFormData({
                        ...ledgerFormData,
                        ledgerName: e.target.value,
                      })
                    }
                    placeholder="e.g. Petty Cash"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Whether Party Account
                  </label>
                  <select
                    value={ledgerFormData.isPartyAccount}
                    onChange={(e) =>
                      setLedgerFormData({
                        ...ledgerFormData,
                        isPartyAccount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {ledgerFormData.isPartyAccount === "Yes" && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest mb-4">
                    Party Account Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        PAN No
                      </label>
                      <input
                        type="text"
                        value={ledgerFormData.panNo}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            panNo: e.target.value,
                          })
                        }
                        placeholder="e.g. ABCDE1234F"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Contact No
                      </label>
                      <input
                        type="text"
                        value={ledgerFormData.contactNo}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            contactNo: e.target.value,
                          })
                        }
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        GST No
                      </label>
                      <input
                        type="text"
                        value={ledgerFormData.gstNo}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            gstNo: e.target.value,
                          })
                        }
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Name as per Bank
                      </label>
                      <input
                        type="text"
                        value={ledgerFormData.nameAsPerBank}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            nameAsPerBank: e.target.value,
                          })
                        }
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={ledgerFormData.ifscCode}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            ifscCode: e.target.value,
                          })
                        }
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        TDS Code
                      </label>
                      <input
                        type="text"
                        value={ledgerFormData.tdsCode}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            tdsCode: e.target.value,
                          })
                        }
                        placeholder="e.g. 194J"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Address
                      </label>
                      <textarea
                        value={ledgerFormData.address}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            address: e.target.value,
                          })
                        }
                        placeholder="Full address"
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Bank Details
                      </label>
                      <textarea
                        value={ledgerFormData.bankDetails}
                        onChange={(e) =>
                          setLedgerFormData({
                            ...ledgerFormData,
                            bankDetails: e.target.value,
                          })
                        }
                        placeholder="Account number, branch, etc."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition resize-none"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Attachments
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []).map(
                              (f: File) => f.name,
                            );
                            setLedgerFormData({
                              ...ledgerFormData,
                              attachments: [
                                ...ledgerFormData.attachments,
                                ...files,
                              ],
                            });
                          }}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                        />
                        {ledgerFormData.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ledgerFormData.attachments.map((file, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold">
                                📎 {file}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLedgerFormData({
                                      ...ledgerFormData,
                                      attachments:
                                        ledgerFormData.attachments.filter(
                                          (_, i) => i !== idx,
                                        ),
                                    })
                                  }
                                  className="text-red-600 hover:text-red-700">
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-10 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition">
                  Create Ledger
                </button>
              </div>
            </form>
          }
        </div>
      )}

      {activeMasterTab === "All" ?
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 py-10">
          {renderAllMasterCards()}
        </div>
      : <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-300">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-700">
                  <th className="px-10 py-5">Master</th>
                  <th className="px-10 py-5">Group</th>
                  {activeSubMenu === "Add Ledgers" && (
                    <th className="px-10 py-5">Ledger Account</th>
                  )}
                  <th className="px-10 py-5 text-right">Tools</th>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-100 dark:border-slate-700">
                  <th className="px-10 py-2">
                    <input
                      type="text"
                      value={filterMaster}
                      onChange={(e) => setFilterMaster(e.target.value)}
                      placeholder="Filter Master"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </th>
                  <th className="px-10 py-2">
                    <input
                      type="text"
                      value={filterGroup}
                      onChange={(e) => setFilterGroup(e.target.value)}
                      placeholder="Filter Group"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </th>
                  {activeSubMenu === "Add Ledgers" && (
                    <th className="px-10 py-2">
                      <input
                        type="text"
                        value={filterLedger}
                        onChange={(e) => setFilterLedger(e.target.value)}
                        placeholder="Filter Ledger"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </th>
                  )}
                  <th className="px-10 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {activeSubMenu === "Add Group" ?
                  filteredGroups.length > 0 ?
                    filteredGroups.map((item, idx) => {
                      const isExpanded = expandedGroups.has(
                        `${item.master}-${item.group}`,
                      );
                      return (
                        <React.Fragment
                          key={`${item.master}-${item.group}-${idx}`}>
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="px-10 py-5">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  item.master === "Assets" ?
                                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : item.master === "Liabilities" ?
                                    "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                                  : item.master === "Income" ?
                                    "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                }`}>
                                {item.master}
                              </span>
                            </td>
                            <td className="px-10 py-5">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    toggleGroupExpansion(
                                      item.master,
                                      item.group,
                                    )
                                  }
                                  className={`w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 font-black text-xs transition-all ${isExpanded ? "bg-brand-500 text-white border-brand-500" : "bg-white dark:bg-slate-900 text-slate-400 hover:border-brand-500"}`}>
                                  {isExpanded ? "−" : "+"}
                                </button>
                                <div className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase group-hover:text-brand-600 transition-colors">
                                  {item.group}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-auto">
                                  {item.ledgerCount}{" "}
                                  {item.ledgerCount === 1 ?
                                    "ledger"
                                  : "ledgers"}
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-5 text-right">
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => {
                                    setEditingItem({
                                      type: "group",
                                      master: item.master,
                                      originalName: item.group,
                                      groupName: item.group,
                                    });
                                    setEditFormData({ name: item.group });
                                  }}
                                  className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-900 hover:bg-brand-500 hover:text-white rounded-xl transition shadow-sm text-sm border border-slate-100 dark:border-slate-700"
                                  title="Edit Group">
                                  ✏️
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteGroup(item.master, item.group)
                                  }
                                  className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-900 hover:bg-rose-500 hover:text-white rounded-xl transition shadow-sm text-sm border border-slate-100 dark:border-slate-700"
                                  title="Delete Group">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded &&
                            ((item.ledgers || []).length > 0 ?
                              item.ledgers.map((ledger, lIdx) => (
                                <tr
                                  key={`${item.group}-${ledger}-${lIdx}`}
                                  className="bg-slate-50/30 dark:bg-slate-900/10 border-l-4 border-brand-500 animate-in slide-in-from-left-2 duration-200">
                                  <td className="px-10 py-3"></td>
                                  <td className="px-10 py-3 pl-20">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-300 opacity-50">
                                        ↳
                                      </span>
                                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                                        {ledger}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-10 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingItem({
                                            type: "ledger",
                                            master: item.master,
                                            originalName: ledger,
                                            groupName: item.group,
                                          });
                                          setEditFormData({ name: ledger });
                                        }}
                                        className="p-1.5 text-[14px] hover:text-brand-600 transition hover:scale-125"
                                        title="Edit Ledger">
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteLedger(
                                            item.master,
                                            item.group,
                                            ledger,
                                          )
                                        }
                                        className="p-1.5 text-[14px] hover:text-rose-600 transition hover:scale-125"
                                        title="Delete Ledger">
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            : <tr className="bg-slate-50/20 dark:bg-slate-900/5 italic text-slate-400 text-[10px]">
                                <td className="px-10 py-3"></td>
                                <td
                                  className="px-10 py-3 pl-20"
                                  colSpan={2}>
                                  No active ledger accounts.
                                </td>
                              </tr>)}
                        </React.Fragment>
                      );
                    })
                  : <tr>
                      <td
                        colSpan={3}
                        className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
                        No records found.
                      </td>
                    </tr>

                : filteredLedgers.length > 0 ?
                  filteredLedgers.map((item, idx) => (
                    <tr
                      key={`${item.master}-${item.group}-${item.ledger}-${idx}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="px-10 py-5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            item.master === "Assets" ?
                              "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : item.master === "Liabilities" ?
                              "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                            : item.master === "Income" ?
                              "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          }`}>
                          {item.master}
                        </span>
                      </td>
                      <td className="px-10 py-5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          {item.group}
                        </div>
                      </td>
                      <td className="px-10 py-5">
                        <div className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase group-hover:text-brand-600 transition-colors">
                          {item.ledger}
                        </div>
                      </td>
                      <td className="px-10 py-5 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setEditingItem({
                                type: "ledger",
                                master: item.master,
                                originalName: item.ledger,
                                groupName: item.group,
                              });
                              setEditFormData({ name: item.ledger });
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-900 hover:bg-brand-500 hover:text-white rounded-xl transition shadow-sm text-sm border border-slate-100 dark:border-slate-700"
                            title="Edit Ledger">
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteLedger(
                                item.master,
                                item.group,
                                item.ledger,
                              )
                            }
                            className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-900 hover:bg-rose-500 hover:text-white rounded-xl transition shadow-sm text-sm border border-slate-100 dark:border-slate-700"
                            title="Delete Ledger">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : <tr>
                    <td
                      colSpan={4}
                      className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
                      No results match filters.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 px-10 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Count:{" "}
              {activeSubMenu === "Add Group" ?
                filteredGroups.length
              : filteredLedgers.length}{" "}
              Records
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveMasterTab("All")}
                className="text-[9px] font-black text-brand-600 uppercase tracking-widest hover:underline transition-all group">
                <span className="group-hover:-translate-x-1 transition-transform inline-block">
                  ←
                </span>{" "}
                Back to Directory
              </button>
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  Live Sync Status: Online
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
};
