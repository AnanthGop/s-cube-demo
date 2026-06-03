
import React from 'react';
import { Printer } from "lucide-react";

interface RequisitionDetailsDrawerProps {
  reqId: string | null;
  onClose: () => void;
}

export const RequisitionDetailsDrawer: React.FC<RequisitionDetailsDrawerProps> = ({ reqId, onClose }) => {
  if (!reqId) return null;

  const handlePrint = () => {
    try {
      if (typeof window !== "undefined") {
        window.print();
      }
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  // Mock lookup for requisition details
  const details = {
    id: reqId,
    consultant: 'Dr. Sarah Miller',
    amount: '$5,000',
    date: '15/03/2024',
    project: 'Solar Grid 1',
    fund: 'General Fund',
    function: 'Administration',
    grant: 'UNESCO Grant',
    remarks: 'Technical audit for Q1 implementation phase. Includes site surveys and resource mapping.',
    status: 'Approved',
    files: ['Consulting_Proposal_V2.pdf', 'Signed_Agreement.jpg']
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-[999] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-brand-600 px-8 py-8 text-white z-10 flex flex-col gap-2">
          <div className="flex justify-between items-start">
             <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Approved Requisition</span>
                <h2 className="text-3xl font-black font-mono tracking-tighter">{details.id}</h2>
             </div>
             <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/40 flex items-center justify-center text-2xl transition"
             >
               ×
             </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-3 py-1 bg-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">Authorized</span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{details.date}</span>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* Section: Core Info */}
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Consultant</label>
                <div className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{details.consultant}</div>
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Disbursement</label>
                <div className="text-xl font-black text-slate-900 dark:text-white">{details.amount}</div>
             </div>
          </div>

          {/* Section: Accounting Context */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 pb-2">Operational Context</h3>
            <div className="grid grid-cols-1 gap-5">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{details.project}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fund</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{details.fund}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Function</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{details.function}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grant</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{details.grant}</span>
              </div>
            </div>
          </div>

          {/* Section: Remarks */}
          <div className="space-y-3">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Audit Justification</label>
             <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border-l-4 border-amber-400 italic text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
               "{details.remarks}"
             </div>
          </div>

          {/* Section: Attachments */}
          <div className="space-y-4">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Verified Evidence ({details.files.length})</label>
             <div className="space-y-3">
                {details.files.map((file, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl group hover:border-brand-500 transition cursor-pointer shadow-sm">
                      <div className="flex items-center gap-3">
                         <span className="text-xl group-hover:scale-110 transition">📄</span>
                         <span className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">{file}</span>
                      </div>
                      <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 group-hover:bg-brand-500 group-hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition">
                         View
                      </button>
                   </div>
                ))}
             </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20 mt-auto">
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white/80 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white transition rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              Close Requisition Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
