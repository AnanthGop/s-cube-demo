import React, { useState, useEffect } from "react";
import {
  Upload,
  Plus,
  Trash2,
  Download,
  ChevronLeft,
  Save,
} from "lucide-react";
import { CompactDatePicker } from "../shared/CompactDatePicker";

interface PayrollBudgetPageProps {
  themeColor: string;
  financialYear?: any;
  onBack?: () => void;
  existingPayrollData?: any[];
  onSavePayroll?: (data: any[]) => void;
}

interface PayrollEntry {
  id: number;
  name: string;
  designation: string;
  location: string;
  joiningDate: string;
  currentGrossSalary: number;
  incrementMonth: string;
  incrementAmount: number;
  newSalary: number;
}

export const PayrollBudgetPage: React.FC<PayrollBudgetPageProps> = ({
  themeColor,
  financialYear,
  onBack,
  existingPayrollData,
  onSavePayroll,
}) => {
  const [payrollData, setPayrollData] = useState<PayrollEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data for the current financial year
  useEffect(() => {
    if (existingPayrollData && financialYear) {
      const fyData = existingPayrollData.find(
        (d: any) => d.financialYear === financialYear.name,
      );
      if (fyData && fyData.employees) {
        setPayrollData(fyData.employees);
      } else {
        // Initialize with sample data if none exists
        setPayrollData([
          {
            id: 1,
            name: "John Doe",
            designation: "Senior Manager",
            location: "Mumbai Office",
            joiningDate: "2023-04-15",
            currentGrossSalary: 75000,
            incrementMonth: "2025-04",
            incrementAmount: 7500,
            newSalary: 82500,
          },
          {
            id: 2,
            name: "Sarah Smith",
            designation: "Finance Officer",
            location: "Delhi Hub",
            joiningDate: "2024-01-10",
            currentGrossSalary: 55000,
            incrementMonth: "2026-01",
            incrementAmount: 5000,
            newSalary: 60000,
          },
          {
            id: 3,
            name: "Michael Johnson",
            designation: "Project Coordinator",
            location: "Bengaluru Center",
            joiningDate: "2023-09-01",
            currentGrossSalary: 45000,
            incrementMonth: "2025-09",
            incrementAmount: 4500,
            newSalary: 49500,
          },
        ]);
      }
    }
  }, [existingPayrollData, financialYear]);

  const [newEntry, setNewEntry] = useState<Partial<PayrollEntry>>({
    name: "",
    designation: "",
    location: "",
    joiningDate: "",
    currentGrossSalary: 0,
    incrementMonth: "",
    incrementAmount: 0,
    newSalary: 0,
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddEntry = () => {
    if (
      newEntry.name &&
      newEntry.designation &&
      newEntry.location &&
      newEntry.joiningDate &&
      newEntry.currentGrossSalary
    ) {
      const entry: PayrollEntry = {
        id: Date.now(),
        name: newEntry.name,
        designation: newEntry.designation,
        location: newEntry.location,
        joiningDate: newEntry.joiningDate,
        currentGrossSalary: newEntry.currentGrossSalary || 0,
        incrementMonth: newEntry.incrementMonth || "",
        incrementAmount: newEntry.incrementAmount || 0,
        newSalary:
          (newEntry.currentGrossSalary || 0) + (newEntry.incrementAmount || 0),
      };
      setPayrollData([...payrollData, entry]);
      setNewEntry({
        name: "",
        designation: "",
        location: "",
        joiningDate: "",
        currentGrossSalary: 0,
        incrementMonth: "",
        incrementAmount: 0,
        newSalary: 0,
      });
      setShowAddForm(false);
    }
  };

  const handleDeleteEntry = (id: number) => {
    setPayrollData(payrollData.filter((entry) => entry.id !== id));
  };

  const handleImportPayroll = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.json";
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        // TODO: Implement file parsing logic
        alert(`Importing payroll from: ${file.name}`);
      }
    };
    input.click();
  };

  const handleExportPayroll = () => {
    const csvContent = [
      [
        "Name",
        "Designation",
        "Location",
        "Joining Date",
        "Current Gross Salary",
        "Increment Month",
        "Increment Amount",
        "New Salary",
      ],
      ...payrollData.map((entry) => [
        entry.name,
        entry.designation,
        entry.location,
        entry.joiningDate,
        entry.currentGrossSalary.toString(),
        entry.incrementMonth,
        entry.incrementAmount.toString(),
        entry.newSalary.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll_budget.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    if (!monthStr) return "";
    const date = new Date(monthStr + "-01");
    return date.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
  };

  const handleFieldUpdate = (field: keyof PayrollEntry) => (value: any) => {
    const updated = { ...newEntry, [field]: value };

    // Auto-calculate new salary when current salary or increment amount changes
    if (field === "currentGrossSalary" || field === "incrementAmount") {
      const current =
        field === "currentGrossSalary" ?
          parseFloat(value) || 0
        : newEntry.currentGrossSalary || 0;
      const increment =
        field === "incrementAmount" ?
          parseFloat(value) || 0
        : newEntry.incrementAmount || 0;
      updated.newSalary = current + increment;
    }

    setNewEntry(updated);
  };

  const handleInlineUpdate = (
    id: number,
    field: keyof PayrollEntry,
    value: any,
  ) => {
    setPayrollData(
      payrollData.map((entry) => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: value };

          // Auto-calculate new salary
          if (field === "currentGrossSalary" || field === "incrementAmount") {
            const current =
              field === "currentGrossSalary" ?
                parseFloat(value) || 0
              : entry.currentGrossSalary;
            const increment =
              field === "incrementAmount" ?
                parseFloat(value) || 0
              : entry.incrementAmount;
            updated.newSalary = current + increment;
          }

          return updated;
        }
        return entry;
      }),
    );
  };

  const handleSavePayroll = () => {
    if (!onSavePayroll || !financialYear) return;

    setIsSaving(true);

    // Get existing data for other financial years
    const otherFYData = (existingPayrollData || []).filter(
      (d: any) => d.financialYear !== financialYear.name,
    );

    // Create new entry for this financial year
    const newData = [
      ...otherFYData,
      {
        financialYear: financialYear.name,
        employees: payrollData,
        lastUpdated: new Date().toISOString(),
      },
    ];

    onSavePayroll(newData);

    setTimeout(() => {
      setIsSaving(false);
      alert("Payroll data saved successfully!");
    }, 500);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
          <ChevronLeft size={20} />
          <span className="font-medium">Back to Budget Selection</span>
        </button>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
          Payroll Budget
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          {financialYear ? `FY ${financialYear.name} • Manage` : "Manage"}{" "}
          employee payroll budget allocations and increments
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSavePayroll}
          disabled={isSaving || !onSavePayroll}
          className={`flex items-center gap-2 px-6 py-3 bg-${themeColor} text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed`}>
          <Save size={18} />
          {isSaving ? "Saving..." : "Save Payroll Data"}
        </button>

        <button
          onClick={handleImportPayroll}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition">
          <Upload size={18} />
          Import Payroll
        </button>

        <button
          onClick={handleExportPayroll}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition">
          <Download size={18} />
          Export
        </button>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition">
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Add New Entry Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-6 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            Add New Employee
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Employee Name *
              </label>
              <input
                type="text"
                value={newEntry.name || ""}
                onChange={(e) => handleFieldUpdate("name")(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Designation *
              </label>
              <input
                type="text"
                value={newEntry.designation || ""}
                onChange={(e) =>
                  handleFieldUpdate("designation")(e.target.value)
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter designation"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Location *
              </label>
              <input
                type="text"
                value={newEntry.location || ""}
                onChange={(e) => handleFieldUpdate("location")(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Joining Date *
              </label>
              <CompactDatePicker
                value={newEntry.joiningDate || ""}
                onChange={(value) => handleFieldUpdate("joiningDate")(value)}
                className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Current Gross Salary *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={newEntry.currentGrossSalary || ""}
                onChange={(e) =>
                  handleFieldUpdate("currentGrossSalary")(e.target.value)
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Increment Month
              </label>
              <input
                type="month"
                value={newEntry.incrementMonth || ""}
                onChange={(e) =>
                  handleFieldUpdate("incrementMonth")(e.target.value)
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Increment Amount
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={newEntry.incrementAmount || ""}
                onChange={(e) =>
                  handleFieldUpdate("incrementAmount")(e.target.value)
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                New Salary
              </label>
              <input
                type="number"
                value={newEntry.newSalary || 0}
                readOnly
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 cursor-not-allowed"
                placeholder="Auto-calculated"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddEntry}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:brightness-110 transition">
              Add Employee
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewEntry({
                  name: "",
                  designation: "",
                  location: "",
                  joiningDate: "",
                  currentGrossSalary: 0,
                  incrementMonth: "",
                  incrementAmount: 0,
                  newSalary: 0,
                });
              }}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-200 dark:border-slate-700">
                <th className="py-4 px-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  #
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[180px]">
                  Name of Person
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[150px]">
                  Designation
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[150px]">
                  Location
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[120px]">
                  Joining Date
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[140px]">
                  Current Gross Salary
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[130px]">
                  Increment Month
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[140px]">
                  Increment Amount
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider min-w-[130px]">
                  New Salary
                </th>
                <th className="py-4 px-6 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky right-0 bg-slate-50 dark:bg-slate-900/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payrollData.length === 0 ?
                <tr>
                  <td
                    colSpan={10}
                    className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No payroll data available. Click "Add Employee" or "Import
                    Payroll" to get started.
                  </td>
                </tr>
              : payrollData.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-white">
                      {entry.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                      {entry.designation}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                      {entry.location}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                      {formatDate(entry.joiningDate)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={entry.currentGrossSalary}
                        onChange={(e) =>
                          handleInlineUpdate(
                            entry.id,
                            "currentGrossSalary",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full px-3 py-1.5 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm font-mono text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="month"
                        value={entry.incrementMonth}
                        onChange={(e) =>
                          handleInlineUpdate(
                            entry.id,
                            "incrementMonth",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={entry.incrementAmount}
                        onChange={(e) =>
                          handleInlineUpdate(
                            entry.id,
                            "incrementAmount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full px-3 py-1.5 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm font-mono text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-block px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded text-sm font-bold font-mono">
                        {formatCurrency(entry.newSalary)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center sticky right-0 bg-white dark:bg-slate-800">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total Employees:{" "}
          <span className="font-bold text-slate-800 dark:text-white">
            {payrollData.length}
          </span>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total Current Salary:{" "}
          <span className="font-bold text-slate-800 dark:text-white">
            {formatCurrency(
              payrollData.reduce(
                (sum, entry) => sum + entry.currentGrossSalary,
                0,
              ),
            )}
          </span>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total New Salary:{" "}
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(
              payrollData.reduce((sum, entry) => sum + entry.newSalary, 0),
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
