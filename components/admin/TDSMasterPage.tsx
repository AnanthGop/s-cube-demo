
import React, { useState, useMemo } from 'react';

interface TDSItem {
  id: number;
  fy: string;
  type: string;
  section: string;
  rate: number;
  threshold: number;
  status: string;
}

interface FYItem {
  name: string;
}

interface TDSMasterPageProps {
  data: TDSItem[];
  fyList: FYItem[];
  onUpdate: (newData: TDSItem[]) => void;
  themeColor: string;
}

export const TDSMasterPage: React.FC<TDSMasterPageProps> = ({ data, fyList, onUpdate, themeColor }) => {
  const [selectedFY, setSelectedFY] = useState(fyList[fyList.length - 1]?.name || '2024-2025');
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '',
    section: '',
    rate: 0,
    threshold: 0
  });

  const filteredData = useMemo(() => {
    return (data || []).filter(item => item.fy === selectedFY);
  }, [data, selectedFY]);

  const handleImport = () => {
    const sortedFY = [...fyList].sort((a, b) => a.name.localeCompare(b.name));
    const currentIndex = sortedFY.findIndex(f => f.name === selectedFY);
    
    if (currentIndex <= 0) {
      alert("No previous financial year found to import from.");
      return;
    }

    const prevFYName = sortedFY[currentIndex - 1].name;
    const prevData = data.filter(item => item.fy === prevFYName);

    if (prevData.length === 0) {
      alert(`No TDS data found for ${prevFYName}.`);
      return;
    }

    if (!confirm(`Import ${prevData.length} TDS rules from ${prevFYName} to ${selectedFY}?`)) return;

    const importedRules = prevData.map(item => ({
      ...item,
      id: Date.now() + Math.random(),
      fy: selectedFY
    }));

    onUpdate([...data, ...importedRules]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: TDSItem = {
      id: Date.now(),
      fy: selectedFY,
      ...formData,
      status: 'Active'
    };
    onUpdate([...(data || []), newItem]);
    setIsAdding(false);
    setFormData({ type: '', section: '', rate: 0, threshold: 0 });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this TDS rule?")) {
      onUpdate(data.filter(item => item.id !== id));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white flex justify-between items-center`}>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">TDS Master</h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Indian TDS Sections & Rates</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={selectedFY} 
              onChange={(e) => setSelectedFY(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              {fyList.map(fy => <option key={fy.name} value={fy.name} className="text-slate-900">{fy.name}</option>)}
            </select>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition"
            >
              + Add Rule
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8 flex justify-between items-center">
             <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
               Managing TDS rules for Financial Year: <span className="text-brand-600">{selectedFY}</span>
             </div>
             {filteredData.length === 0 && (
               <button 
                onClick={handleImport}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-md"
               >
                 📥 Import from Previous FY
               </button>
             )}
          </div>

          {isAdding && (
            <div className="mb-10 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border-2 border-brand-500 animate-in zoom-in duration-300">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TDS Nature of Payment (Type)</label>
                  <input required type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 border rounded-xl font-bold text-xs" placeholder="e.g. Professional Fees" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Section</label>
                  <input required type="text" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full px-4 py-3 border rounded-xl font-bold text-xs" placeholder="e.g. 194J" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rate (%)</label>
                  <input required type="number" step="0.01" value={formData.rate} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})} className="w-full px-4 py-3 border rounded-xl font-bold text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Threshold Limit (₹)</label>
                  <input required type="number" value={formData.threshold} onChange={e => setFormData({...formData, threshold: parseFloat(e.target.value)})} className="w-full px-4 py-3 border rounded-xl font-bold text-xs" />
                </div>
                <div className="md:col-start-4 flex gap-2">
                   <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                   <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Save</button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-6 py-5">Nature of Payment</th>
                  <th className="px-6 py-5">Section</th>
                  <th className="px-6 py-5 text-right">TDS Rate (%)</th>
                  <th className="px-6 py-5 text-right">Threshold Limit (₹)</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.length > 0 ? filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">{item.type}</td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{item.section}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">{item.rate}%</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">₹{item.threshold.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-widest">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:text-rose-600 transition" title="Delete Rule">🗑️</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No TDS rules defined for this FY.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
