
import React, { useState } from 'react';

interface AddLocationPageProps {
  onCancel: () => void;
  onSave?: (item: any) => void;
  themeColor?: string;
}

export const AddLocationPage: React.FC<AddLocationPageProps> = ({ onCancel, onSave, themeColor = 'indigo-600' }) => {
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    state: '',
    city: '',
    address: '',
    status: 'Active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.region && formData.state && formData.city) {
      onSave?.(formData);
      onCancel();
    } else {
      alert("Please fill in Region, State, and City.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Add Location</h1>
          <p className="text-slate-500 font-medium">Define a new physical office or regional hub.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-10">
          <form className="space-y-8" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Location / Office Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold" 
                    placeholder="e.g. Mumbai Main Office" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Region</label>
                  <select 
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-500/10 transition"
                  >
                    <option value="">Select Region</option>
                    <option>North</option>
                    <option>South</option>
                    <option>East</option>
                    <option>West</option>
                    <option>Central</option>
                    <option>North-East</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">State</label>
                  <input 
                    type="text" 
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold" 
                    placeholder="e.g. Maharashtra" 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">City / District</label>
                  <input 
                    type="text" 
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold" 
                    placeholder="e.g. Mumbai" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Registered Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white text-sm outline-none h-32 focus:ring-4 focus:ring-brand-500/10 transition" 
                    placeholder="Full physical office address..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4">
              <button 
                onClick={onCancel} 
                type="button" 
                className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition border border-slate-200 dark:border-slate-700"
              >
                Discard
              </button>
              <button 
                type="submit" 
                className={`px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-${themeColor} hover:brightness-110 rounded-2xl transition shadow-2xl transform active:scale-95`}
              >
                Save Location
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
