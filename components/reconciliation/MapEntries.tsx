
import React, { useState, useMemo } from 'react';

interface MapEntriesProps {
  themeColor: string;
}

export const MapEntries: React.FC<MapEntriesProps> = ({ themeColor }) => {
  const [filterRef, setFilterRef] = useState('');

  const mockEntries = [
    { ref: 'BANK-X-9921', date: '2024-03-20', amount: 5000, status: 'Auto', type: 'Expense' },
    { ref: 'WIRE-8812-IN', date: '2024-03-21', amount: 15000, status: 'Manual', type: 'Income' },
    { ref: 'BANK-CHG-001', date: '2024-03-21', amount: 15.50, status: 'Auto', type: 'Expense' },
    { ref: 'TRSF-5501-OUT', date: '2024-03-22', amount: 2400, status: 'Manual', type: 'Expense' },
  ];

  const filteredEntries = useMemo(() => {
    return mockEntries.filter(e => e.ref.toLowerCase().includes(filterRef.toLowerCase()));
  }, [filterRef]);

  const handleExport = () => {
    alert("Exporting Bank Reconciliation mapping to Excel...");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-10 py-8 text-white flex justify-between items-center`}>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Map Bank Entries</h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Reconcile statement lines with ERP records</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExport}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition"
            >
              📥 Export to Excel
            </button>
            <div className="bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {filteredEntries.length} Records Pending
            </div>
          </div>
        </div>

        <div className="p-10">
          <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-700">
                  <th className="px-8 py-5">Bank Reference</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5 text-right">Amount</th>
                  <th className="px-8 py-5 text-center">Match Status</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
                {/* Filter Row */}
                <tr className="bg-slate-50/20 dark:bg-slate-900/20 border-b dark:border-slate-700">
                   <th className="px-8 py-2">
                     <input 
                      type="text" 
                      value={filterRef}
                      onChange={(e) => setFilterRef(e.target.value)}
                      placeholder="Filter Reference" 
                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] outline-none" 
                    />
                   </th>
                   <th className="px-8 py-2"></th>
                   <th className="px-8 py-2"></th>
                   <th className="px-8 py-2"></th>
                   <th className="px-8 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredEntries.length > 0 ? filteredEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-8 py-5">
                       <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">{entry.ref}</div>
                    </td>
                    <td className="px-8 py-5 text-xs font-medium text-slate-500">{entry.date}</td>
                    <td className={`px-8 py-5 text-right text-sm font-black ${entry.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {entry.type === 'Income' ? '+' : '-'}${entry.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${entry.status === 'Auto' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'}`}>
                          {entry.status} Match
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-2">
                          <button className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-600 hover:text-white transition transform active:scale-95">
                             Map Expense
                          </button>
                          <button className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 hover:text-white transition transform active:scale-95">
                             Map Income
                          </button>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-400 text-xs font-medium">No matching bank records.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
