import React, { useState } from 'react';
import { ChevronRight, TrendingDown, Calculator } from 'lucide-react';
import DepreciationMastersPage from './DepreciationMastersPage';
import DepreciationCalculationPage from './DepreciationCalculationPage';

interface DepreciationHubProps {
  fyList: any[];
  assetTypes: any[];
  purchases: any[];
  depreciationRatesIT: any[];
  depreciationRatesCA: any[];
  depreciationRegister: any[];
  onUpdateIT: (data: any[]) => void;
  onUpdateCA: (data: any[]) => void;
  onUpdateRegister: (data: any[]) => void;
  themeColor: string;
}

export default function DepreciationHub({
  fyList,
  assetTypes,
  purchases,
  depreciationRatesIT,
  depreciationRatesCA,
  depreciationRegister,
  onUpdateIT,
  onUpdateCA,
  onUpdateRegister,
  themeColor,
}: DepreciationHubProps) {
  const [activeSection, setActiveSection] = useState<'hub' | 'masters' | 'calculation'>('hub');

  if (activeSection === 'masters') {
    return (
      <DepreciationMastersPage
        fyList={fyList}
        assetTypes={assetTypes}
        depreciationRatesIT={depreciationRatesIT}
        depreciationRatesCA={depreciationRatesCA}
        onUpdateIT={onUpdateIT}
        onUpdateCA={onUpdateCA}
        themeColor={themeColor}
        onBack={() => setActiveSection('hub')}
      />
    );
  }

  if (activeSection === 'calculation') {
    return (
      <DepreciationCalculationPage
        fyList={fyList}
        purchases={purchases}
        depreciationRatesIT={depreciationRatesIT}
        depreciationRatesCA={depreciationRatesCA}
        depreciationRegister={depreciationRegister}
        onUpdateRegister={onUpdateRegister}
        themeColor={themeColor}
        onBack={() => setActiveSection('hub')}
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">Depreciation Management</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Select an option below to manage depreciation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Depreciation Masters Card */}
        <button
          onClick={() => setActiveSection('masters')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600 text-white">
                  <TrendingDown size={24} />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Depreciation Masters</h2>
              </div>
              <ChevronRight size={24} className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              Maintain depreciation rates as per Income Tax Act and Companies Act, 2013. Define and manage depreciation parameters for your fixed assets.
            </p>

            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
              <span>View Masters</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
        </button>

        {/* Depreciation Calculation Card */}
        <button
          onClick={() => setActiveSection('calculation')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-600 text-white">
                  <Calculator size={24} />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Depreciation Calculation</h2>
              </div>
              <ChevronRight size={24} className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              Calculate and apply depreciation to assets based on the depreciation masters. View depreciation schedules and amortization details.
            </p>

            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              <span>View Calculations</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
        </button>
      </div>
    </div>
  );
}
