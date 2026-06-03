
import React, { useState } from 'react';

interface MasterDataFormProps {
  entityName: string;
  onCancel: () => void;
  onSave?: (item: any) => void;
  themeColor?: string;
  locationsList?: { id: number; name: string }[];
}

export const MasterDataForm: React.FC<MasterDataFormProps> = ({ entityName, onCancel, onSave, themeColor = 'indigo-600', locationsList = [] }) => {
  const isFundType = entityName === 'Fund Type';
  const isProject = entityName === 'Project';
  const isFinancialYear = entityName === 'Financial Year';
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: isFinancialYear ? 'Open' : 'Active',
    locations: [] as string[],
    startDate: '',
    endDate: ''
  });

  const handleToggleLocation = (locName: string) => {
    setFormData(prev => {
      const exists = prev.locations.includes(locName);
      if (exists) {
        return { ...prev, locations: prev.locations.filter(l => l !== locName) };
      } else {
        return { ...prev, locations: [...prev.locations, locName] };
      }
    });
  };

  const handleFYChange = (yearRange: string) => {
    // Expected format: 2024-2025
    setFormData(prev => {
      const parts = yearRange.split('-');
      if (parts.length === 2) {
        const startYear = parts[0];
        let endYear = parts[1];
        
        // Auto-expand shorthand if provided (e.g., 2024-25 -> 2024-2025)
        if (startYear.length === 4 && endYear.length === 2) {
          endYear = startYear.substring(0, 2) + endYear;
        }

        if (startYear.length === 4 && endYear.length === 4) {
          return { 
            ...prev, 
            name: `${startYear}-${endYear}`, 
            startDate: `01/04/${startYear}`, 
            endDate: `31/03/${endYear}` 
          };
        }
      }
      return { ...prev, name: yearRange };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinancialYear) {
      if (formData.name && formData.startDate && formData.endDate) {
        onSave?.(formData);
        onCancel();
      } else {
        alert("Please provide the Financial Year range (e.g. 2024-2025)");
      }
      return;
    }

    if (formData.name && (isFundType || formData.code)) {
      onSave?.(formData);
      onCancel();
    } else {
      alert("Please fill in all required fields.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Create {isProject ? 'Project' : entityName}</h1>
          <p className="text-slate-500">Define a new {entityName.toLowerCase()} entry in the modular JSON file.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-xl overflow-hidden">
        <div className="p-10">
          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className={`grid grid-cols-1 ${isFundType || isFinancialYear ? 'md:grid-cols-1 max-w-xl' : 'md:grid-cols-2'} gap-8`}>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    {isProject ? 'Project Name' : isFundType ? 'Fund Name' : isFinancialYear ? 'Financial Year (YYYY-YYYY)' : `${entityName} Name`}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => isFinancialYear ? handleFYChange(e.target.value) : setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold" 
                    placeholder={isProject ? "Enter project name" : isFundType ? "Enter fund name" : isFinancialYear ? "e.g. 2024-2025" : `Enter ${entityName.toLowerCase()} name`} 
                  />
                </div>
                
                {!isFinancialYear && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{isFundType ? 'Fund Code' : `${entityName} Code`}</label>
                    <input 
                      type="text" 
                      required={!isFundType}
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold" 
                      placeholder={isFundType ? "e.g. GF-01" : "e.g. CD-001"} 
                    />
                  </div>
                )}

                {isFinancialYear && (
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Start Date (Auto)</label>
                        <input type="text" readOnly value={formData.startDate} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">End Date (Auto)</label>
                        <input type="text" readOnly value={formData.endDate} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white cursor-not-allowed" />
                      </div>
                   </div>
                )}
              </div>
              
              <div className="space-y-6">
                {isProject && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Assign Locations (Multi-select)</label>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 p-2 max-h-48 overflow-y-auto space-y-1">
                      {locationsList.map(loc => (
                        <div 
                          key={loc.id} 
                          onClick={() => handleToggleLocation(loc.name)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${formData.locations.includes(loc.name) ? `bg-${themeColor} text-white` : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${formData.locations.includes(loc.name) ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                             {formData.locations.includes(loc.name) && <span className="text-[10px]">✓</span>}
                          </div>
                          <span className="text-xs font-bold">{loc.name}</span>
                        </div>
                      ))}
                      {locationsList.length === 0 && <div className="p-4 text-center text-[10px] text-slate-400 uppercase font-black tracking-widest">No locations available</div>}
                    </div>
                  </div>
                )}
                
                {!isFundType && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Initial Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold appearance-none cursor-pointer"
                    >
                      {isFinancialYear ? (
                        <>
                          <option value="Open">Open</option>
                          <option value="Lock">Lock</option>
                          <option value="Close">Close</option>
                        </>
                      ) : (
                        <>
                          <option>Active</option>
                          <option>Inactive</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4">
              <button onClick={onCancel} type="button" className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition border border-slate-200 dark:border-slate-700">Discard</button>
              <button type="submit" className={`px-12 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-${themeColor} hover:brightness-110 rounded-2xl transition shadow-xl transform active:scale-95`}>Save entry</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
