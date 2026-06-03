
import React from 'react';

interface Company {
  id: number;
  name: string;
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
  email?: string;
  website?: string;
  address?: string;
  status: string;
}

interface CompanyDetailsDrawerProps {
  company: Company | null;
  onClose: () => void;
}

export const CompanyDetailsDrawer: React.FC<CompanyDetailsDrawerProps> = ({ company, onClose }) => {
  if (!company) return null;

  const renderField = (label: string, value?: string, isMono: boolean = false) => (
    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
      <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-1">{label}</label>
      <div className={`text-xs font-bold text-slate-800 dark:text-slate-200 truncate ${isMono ? 'font-mono' : ''}`}>
        {value || '--'}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 lg:p-12 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Main View Container */}
      <div className="relative w-full max-w-7xl bg-white dark:bg-slate-950 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800 animate-in zoom-in duration-500 max-h-[90vh]">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 px-10 py-8 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-white/20">
                🏢
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Comprehensive Entity Profile</span>
                  <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${company.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'}`}>
                    {company.status}
                  </span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mt-1">{company.name}</h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-3xl transition-all group"
            >
              <span className="group-hover:rotate-90 transition-transform">×</span>
            </button>
          </div>
        </div>

        {/* Content Grid - Structured for 0-scroll visibility */}
        <div className="p-10 flex-1 grid grid-cols-12 gap-10 overflow-hidden">
          
          {/* Left Column: Data Grid */}
          <div className="col-span-12 lg:col-span-8 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
            
            {/* Identity & Tax Section */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                Identity & Taxation
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {renderField('Org Type', company.orgType)}
                {renderField('Registered Under', company.registeredUnder)}
                {renderField('Incorp / Reg No.', company.incorpNo, true)}
                {renderField('NGO Darpan ID', company.darpanId, true)}
                {renderField('PAN', company.pan, true)}
                {renderField('TAN', company.tan, true)}
                {renderField('GST Number', company.gst, true)}
                {renderField('CSR 1 Number', company.csr1, true)}
              </div>
            </div>

            {/* Regulatory Approvals Section */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Compliance & Approvals
              </h3>
              <div className="grid grid-cols-3 gap-4 p-5 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30">
                <div className="space-y-4">
                  {renderField('80G Approval', company.eightyGNo, true)}
                  {renderField('80G Validity', company.eightyGDate)}
                </div>
                <div className="space-y-4">
                  {renderField('12A Approval', company.twelveANo, true)}
                  {renderField('12A Validity', company.twelveADate)}
                </div>
                <div className="space-y-4">
                  {renderField('FCRA Number', company.fcraNo, true)}
                  {renderField('FCRA Validity', company.fcraDate)}
                </div>
              </div>
            </div>

            {/* Channels Section */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Communication Channels
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField('Contact Number', company.contact)}
                {renderField('Email Address', company.email)}
                {renderField('Official Website', company.website)}
              </div>
            </div>
          </div>

          {/* Right Column: Address & Audit */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 flex flex-col">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Registered Head Office</label>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-3xl mb-6 opacity-20">📍</div>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-300 leading-tight tracking-tight">
                  {company.address}
                </p>
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Entity</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400">Audit Timestamp: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full py-5 bg-slate-950 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-600 transition-all shadow-xl shadow-slate-900/20"
            >
              Dismiss Profile View
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
