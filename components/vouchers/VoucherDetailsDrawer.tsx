
import React from 'react';
import { Printer } from "lucide-react";

interface VoucherDetailsDrawerProps {
  voucherId: string | null;
  onClose: () => void;
}

export const VoucherDetailsDrawer: React.FC<VoucherDetailsDrawerProps> = ({ voucherId, onClose }) => {
  if (!voucherId) return null;

  const handlePrint = () => {
    try {
      if (typeof window !== "undefined") {
        window.print();
      }
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  const details = {
    id: voucherId,
    payee: 'Dr. Sarah Miller',
    amount: '$5,000',
    date: '24/03/2024',
    linkedReq: 'REQ-501',
    description: 'Expense batch for technical audit services including site survey disbursements.',
    status: 'Approved',
    files: ['Expense_Summary.pdf', 'Disbursement_Notice.pdf']
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-[999] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-indigo-600 px-8 py-8 text-white z-10">
          <div className="flex justify-between items-start">
             <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Approved Expense Voucher</span>
                <h2 className="text-3xl font-black font-mono tracking-tighter">{details.id}</h2>
             </div>
             <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/40 flex items-center justify-center text-2xl transition">×</button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-3 py-1 bg-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Finalized</span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{details.date}</span>
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-2 gap-8">
             <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Payee</label>
                <div className="text-sm font-bold text-slate-800 dark:text-white">{details.payee}</div>
             </div>
             <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Voucher total</label>
                <div className="text-xl font-black text-slate-900 dark:text-white">{details.amount}</div>
             </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Linked Origin</label>
             <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-500">{details.linkedReq}</span>
                <span className="text-[9px] font-black text-slate-300 uppercase">Approved Requisition</span>
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Disbursement Summary</label>
             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700">
               {details.description}
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Verified Evidence</label>
             <div className="space-y-3">
                {details.files.map((file, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl group hover:border-indigo-500 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                         <span className="text-xl">📄</span>
                         <span className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider truncate max-w-[180px]">{file}</span>
                      </div>
                      <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-600 group-hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition">View</button>
                   </div>
                ))}
             </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white/80 hover:bg-white hover:border-indigo-500 hover:text-indigo-700 transition rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition"
            >
              Close details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
