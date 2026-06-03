import React, { useState } from "react";
import { BudgetEntryPage } from "./BudgetEntryPage";
import { PayrollBudgetPage } from "./PayrollBudgetPage";

interface BudgetsPageProps {
  fyList: any[];
  chartOfAccounts: any[];
  themeColor: string;
  locationsList: any[];
  payrollBudget: any[];
  users?: any[];
  onSavePayroll: (data: any[]) => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  fyList,
  chartOfAccounts,
  themeColor,
  locationsList,
  payrollBudget,
  users = [],
  onSavePayroll,
}) => {
  const [selectedFY, setSelectedFY] = useState("");
  const [selectedBudgetType, setSelectedBudgetType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showEntryPage, setShowEntryPage] = useState(false);

  const budgetTypes = [
    { value: "organisation", label: "Organisation Budget" },
    { value: "grantor", label: "Grantor Budget" },
    { value: "region", label: "Region Budget" },
    { value: "location", label: "Location Budget" },
    { value: "payroll", label: "Payroll Budget" },
  ];

  const selectedFYObject = fyList.find((fy) => fy.name === selectedFY);

  const handleSaveBudgetConfig = () => {
    if (selectedFY && selectedBudgetType) {
      setShowEntryPage(true);
    }
  };

  const handleBackToSelection = () => {
    setShowEntryPage(false);
  };

  if (showEntryPage && selectedFYObject) {
    if (selectedBudgetType === "payroll") {
      return (
        <PayrollBudgetPage
          financialYear={selectedFYObject}
          themeColor={themeColor}
          onBack={handleBackToSelection}
          existingPayrollData={payrollBudget}
          onSavePayroll={onSavePayroll}
        />
      );
    }

    return (
      <BudgetEntryPage
        financialYear={selectedFYObject}
        budgetType={selectedBudgetType}
        chartOfAccounts={chartOfAccounts}
        themeColor={themeColor}
        onBack={handleBackToSelection}
        selectedLocation={selectedLocation}
        payrollBudget={payrollBudget}
        locationsList={locationsList}
        users={users}
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
          Budgets
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Add and manage budget allocations by financial year and type
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Financial Year Box */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Add Financial Year
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select budget period
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Financial Year
            </label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition">
              <option value="">Select Financial Year</option>
              {fyList.map((fy) => (
                <option
                  key={fy.id}
                  value={fy.name}>
                  {fy.name} ({fy.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget Type Box */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Add Budget Type
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose budget category
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Budget Type
            </label>
            <select
              value={selectedBudgetType}
              onChange={(e) => setSelectedBudgetType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
              <option value="">Select Budget Type</option>
              {budgetTypes.map((type) => (
                <option
                  key={type.value}
                  value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Box */}
        {selectedBudgetType === "location" && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-xl">📍</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Select Location
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose location from master
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition">
                <option value="">Select Location</option>
                {locationsList.map((location) => (
                  <option
                    key={location.id}
                    value={location.name}>
                    {location.name} - {location.city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFY &&
        selectedBudgetType &&
        (selectedBudgetType !== "location" || selectedLocation) && (
          <div className="mt-8 flex gap-4 max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={handleSaveBudgetConfig}
              className={`px-6 py-3 bg-${themeColor} text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition`}>
              💾 Save Budget Configuration
            </button>
            <button
              onClick={() => {
                setSelectedFY("");
                setSelectedBudgetType("");
                setSelectedLocation("");
              }}
              className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Reset
            </button>
          </div>
        )}
    </div>
  );
};
