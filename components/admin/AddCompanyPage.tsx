
import React, { useState } from 'react';

interface MasterItem {
  id: number;
  name: string;
  code: string;
}

interface AddCompanyPageProps {
  onCancel: () => void;
  masterLists: {
    funds: MasterItem[];
    grants: MasterItem[];
    functions: MasterItem[];
    projects: MasterItem[];
  };
  themeColor?: string;
}

export const AddCompanyPage: React.FC<AddCompanyPageProps> = ({ onCancel, themeColor = 'indigo-600' }) => {
  const [formData, setFormData] = useState({
    orgName: '',
    orgType: '',
    pan: '',
    tan: '',
    gst: '',
    csr1: '',
    incorpNo: '',
    registeredUnder: '',
    eightyGNo: '',
    eightyGDate: '',
    twelveANo: '',
    twelveADate: '',
    fcraNo: '',
    fcraDate: '',
    darpanId: '',
    contact: '',
    email: '',
    website: '',
    address: ''
  });

  const handleAttach = (fieldName: string) => {
    // This would trigger a file picker in a real implementation
    console.log(`Triggering attachment for: ${fieldName}`);
    alert(`Upload document for ${fieldName.toUpperCase()}`);
  };

  const renderInputWithAttachment = (label: string, field: keyof typeof formData, placeholder: string, hasAttachment: boolean = false, type: string = "text") => (
    <div className="space-y-1">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative flex items-center">
        <input 
          type={type} 
          value={formData[field]}
          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
          className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold text-sm ${hasAttachment ? 'pr-12' : ''}`}
          placeholder={placeholder}
        />
        {hasAttachment && (
          <button 
            type="button"
            onClick={() => handleAttach(label)}
            className="absolute right-2 p-2 text-slate-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
            title={`Attach ${label} Document`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Add Company</h1>
          <p className="text-slate-500 font-medium">Register a new legal entity with full compliance documentation.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-10">
          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            
            {/* Section: Basic Identity */}
            <div className="space-y-6">
              <h2 className="text-[11px] font-black text-brand-600 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 pb-2">1. Identity & Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderInputWithAttachment('Organisation Name', 'orgName', 'Legal Name of Entity')}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type of Organisation</label>
                  <select 
                    value={formData.orgType}
                    onChange={(e) => setFormData(prev => ({ ...prev, orgType: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-500/10 transition"
                  >
                    <option value="">Select Type</option>
                    <option value="Trust">Trust</option>
                    <option value="Section 8 Company">Section 8 Company</option>
                    <option value="Society">Society</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                {renderInputWithAttachment('Entity Registered Under', 'registeredUnder', 'Act / Authority Name')}
              </div>
            </div>

            {/* Section: Tax & Registration IDs */}
            <div className="space-y-6">
              <h2 className="text-[11px] font-black text-brand-600 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 pb-2">2. Tax & Legal Registrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">PAN</label>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-600 underline underline-offset-2"
                    >
                      Verify PAN
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formData.pan}
                      onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/10 outline-none transition dark:text-white font-bold text-sm"
                      placeholder="Enter PAN Number"
                    />
                    <button
                      type="button"
                      onClick={() => handleAttach('PAN')}
                      className="absolute right-2 p-2 text-slate-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                      title="Attach PAN Document"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Name as per PAN</label>
                  <input
                    type="text"
                    value={formData.orgName}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none transition dark:text-white font-bold text-sm text-slate-600 dark:text-slate-300"
                    placeholder="Name as per PAN"
                  />
                </div>
                {renderInputWithAttachment('TAN', 'tan', 'Enter TAN Number', true)}
                {renderInputWithAttachment('GST', 'gst', 'Enter GST Number', true)}
                {renderInputWithAttachment('CSR 1 Number', 'csr1', 'Enter CSR 1 Registration', true)}
                {renderInputWithAttachment('Incorporation / Trust Registration Number', 'incorpNo', 'Reg No.', true)}
                {renderInputWithAttachment('Darpan ID', 'darpanId', 'NGO Darpan ID', true)}
              </div>
            </div>

            {/* Section: Regulatory Approvals */}
            <div className="space-y-6">
              <h2 className="text-[11px] font-black text-brand-600 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 pb-2">3. Statutory Approvals & Validity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderInputWithAttachment('80G Approval Number', 'eightyGNo', '80G No.', true)}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">80G Validity Date (DD/MM/YYYY)</label>
                  <input type="text" placeholder="DD/MM/YYYY" value={formData.eightyGDate} onChange={e => setFormData(prev => ({...prev, eightyGDate: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition" />
                </div>
                {renderInputWithAttachment('12A Approval Number', 'twelveANo', '12A No.', true)}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">12A Validity Date (DD/MM/YYYY)</label>
                  <input type="text" placeholder="DD/MM/YYYY" value={formData.twelveADate} onChange={e => setFormData(prev => ({...prev, twelveADate: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition" />
                </div>
                {renderInputWithAttachment('FCRA Registration Number', 'fcraNo', 'FCRA No.', true)}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">FCRA Validity Date (DD/MM/YYYY)</label>
                  <input type="text" placeholder="DD/MM/YYYY" value={formData.fcraDate} onChange={e => setFormData(prev => ({...prev, fcraDate: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition" />
                </div>
              </div>
            </div>

            {/* Section: Contact Details */}
            <div className="space-y-6">
              <h2 className="text-[11px] font-black text-brand-600 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 pb-2">4. Communication Channels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                  <input type="tel" value={formData.contact} onChange={e => setFormData(prev => ({...prev, contact: e.target.value}))} placeholder="+91 00000 00000" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email ID</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(prev => ({...prev, email: e.target.value}))} placeholder="office@organisation.org" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Website</label>
                  <input type="url" value={formData.website} onChange={e => setFormData(prev => ({...prev, website: e.target.value}))} placeholder="https://www.organisation.org" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition" />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Registered Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={e => setFormData(prev => ({...prev, address: e.target.value}))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white h-24 outline-none focus:ring-4 focus:ring-brand-500/10 transition" 
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
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-${themeColor} hover:brightness-110 rounded-2xl transition shadow-2xl transform active:scale-95`}
              >
                Register Company
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
