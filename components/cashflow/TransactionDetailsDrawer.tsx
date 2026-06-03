
import React from 'react';

interface TransactionDetailsDrawerProps {
  reference: string | null;
  onClose: () => void;
}

export const TransactionDetailsDrawer: React.FC<TransactionDetailsDrawerProps> = ({ reference, onClose }) => {
  if (!reference) return null;

  // Mock lookup logic for the transaction details based on the reference
  const mockDetails = {
    ref: reference,
    date: '2024-03-12',
    description: 'Quarterly Project Implementation Fees & Logistics',
    amount: '₹12,000',
    type: reference.startsWith('CR') ? 'Income' : 'Expense',
    linkedVoucherId: reference.startsWith('CR') ? 'BV-2024-099' : 'EV-2024-441',
    linkedRequisitionId: 'REQ-99012',
    attachments: [
      { name: 'Signed_Invoice_Mar.pdf', size: '1.2 MB' },
      { name: 'Implementation_Report_Q1.pdf', size: '4.5 MB' },
      { name: 'Site_Photos_Archive.zip', size: '12.8 MB' }
    ]
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Floating Sidebar */}
      <div className="fixed top-0 right-0 h-full w-[480px] bg-white dark:bg-slate-900 shadow-2xl z-[1001] animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-brand-600 px-8 py-10 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl transition-all"
          >
            ×
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 block mb-2">Transaction Detail Audit</span>
          <h2 className="text-4xl font-black font-mono tracking-tighter">{mockDetails.ref}</h2>
          <div className="mt-6 flex gap-3">
             <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${mockDetails.type === 'Income' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-rose-500 shadow-lg shadow-rose-500/30'}`}>
               {mockDetails.type} Record
             </span>
             <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/80">
               {mockDetails.date}
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          
          {/* Summary Section */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Entry Overview</label>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
               <div className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed mb-4 italic">
                 "{mockDetails.description}"
               </div>
               <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700 pt-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Settlement Value</span>
                  <span className={`text-3xl font-black tracking-tighter ${mockDetails.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {mockDetails.amount}
                  </span>
               </div>
            </div>
          </div>

          {/* Linked Identifiers Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-brand-50 dark:border-brand-900/30 pb-3">Audit Traceability</h3>
            <div className="grid grid-cols-1 gap-4">
               
               <div className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-brand-500 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🧾</div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Linked Voucher</div>
                      <div className="text-sm font-black text-indigo-600 font-mono">{mockDetails.linkedVoucherId}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">Open Record →</span>
               </div>

               <div className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-brand-500 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📄</div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Linked Requisition</div>
                      <div className="text-sm font-black text-brand-600 font-mono">{mockDetails.linkedRequisitionId}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 group-hover:text-brand-600 transition-colors uppercase tracking-widest">Open Record →</span>
               </div>

            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Associated Evidence ({mockDetails.attachments.length})</label>
             <div className="space-y-3">
                {mockDetails.attachments.map((file, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-2xl group hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                         <span className="text-2xl group-hover:scale-110 transition-transform">📂</span>
                         <div>
                            <div className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider truncate max-w-[200px]">{file.name}</div>
                            <div className="text-[9px] font-bold text-slate-400">{file.size}</div>
                         </div>
                      </div>
                      <button className="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all">
                        Download
                      </button>
                   </div>
                ))}
             </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
           <button 
             onClick={onClose}
             className="w-full py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:border-brand-600 transition-all rounded-3xl text-xs font-black uppercase tracking-widest shadow-sm"
           >
             Dismiss Audit View
           </button>
        </div>
      </div>
    </>
  );
};
