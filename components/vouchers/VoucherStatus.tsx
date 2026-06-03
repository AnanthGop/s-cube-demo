
import React, { useState, useMemo } from 'react';
import { RequisitionDetailsDrawer } from './RequisitionDetailsDrawer';
import { VoucherDetailsDrawer } from './VoucherDetailsDrawer';

interface VoucherStatusProps {
  type: 'Expense' | 'Bank';
  themeColor: string;
}

export const VoucherStatus: React.FC<VoucherStatusProps> = ({ type, themeColor }) => {
  const [viewingReqId, setViewingReqId] = useState<string | null>(null);
  const [viewingVoucherId, setViewingVoucherId] = useState<string | null>(null);

  // Filter states
  const [filterId, setFilterId] = useState('');
  const [filterBy, setFilterBy] = useState('');

  const statusData = useMemo(() => [
    { 
      id: `${type.charAt(0)}V-2024-001`, 
      creator: 'Admin', 
      supervisor: 'Approved', 
      finance: 'Pending', 
      status: 'In Finance Queue', 
      linkedReq: 'REQ-501',
      linkedVoucher: type === 'Bank' ? 'EV-2024-001' : null
    },
    { 
      id: `${type.charAt(0)}V-2024-002`, 
      creator: 'Sarah Finance', 
      supervisor: 'Approved', 
      finance: 'Approved', 
      status: 'Fully Authorized', 
      linkedReq: 'REQ-502',
      linkedVoucher: type === 'Bank' ? 'EV-2024-002' : null
    },
    { 
      id: `${type.charAt(0)}V-2024-003`, 
      creator: 'John Admin', 
      supervisor: 'Pending', 
      finance: 'N/A', 
      status: 'Under Review', 
      linkedReq: 'REQ-503',
      linkedVoucher: type === 'Bank' ? 'EV-2024-003' : null
    },
  ], [type]);

  const filteredData = useMemo(() => {
    return statusData.filter(item => 
      item.id.toLowerCase().includes(filterId.toLowerCase()) &&
      item.creator.toLowerCase().includes(filterBy.toLowerCase())
    );
  }, [statusData, filterId, filterBy]);

  const getBadge = (status: string) => {
    const map: any = {
      'Approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'N/A': 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
      'In Finance Queue': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      'Fully Authorized': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      'Under Review': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    };
    return <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${map[status] || 'bg-slate-100'}`}>{status}</span>;
  };

  const idLabel = type === 'Bank' ? 'Bank Voucher' : 'Expense Voucher';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white`}>
          <h2 className="text-xl font-extrabold tracking-tight uppercase">{idLabel} Tracker</h2>
          <div className="flex items-center gap-3">
             <button onClick={() => alert("Exporting tracker...")} className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transform hover:scale-105 transition">📥 Export to Excel</button>
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">📊</div>
          </div>
        </div>

        <div className="p-8">
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-5">Voucher ID</th>
                  <th className="px-6 py-5">By</th>
                  <th className="px-6 py-5 text-center">Ref</th>
                  <th className="px-6 py-5 text-center">Supv</th>
                  <th className="px-6 py-5 text-center">Fin</th>
                  <th className="px-6 py-5 text-right">Progress</th>
                </tr>
                <tr className="bg-slate-50/20 border-b dark:border-slate-700">
                   <th className="px-6 py-2"><input type="text" value={filterId} onChange={(e) => setFilterId(e.target.value)} placeholder="ID" className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] outline-none dark:text-white" /></th>
                   <th className="px-6 py-2"><input type="text" value={filterBy} onChange={(e) => setFilterBy(e.target.value)} placeholder="By" className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] outline-none dark:text-white" /></th>
                   <th className="px-6 py-2"></th>
                   <th className="px-6 py-2"></th>
                   <th className="px-6 py-2"></th>
                   <th className="px-6 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-5 font-mono text-xs font-bold text-indigo-500">{item.id}</td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{item.creator}</td>
                    <td className="px-6 py-5 text-center">
                       <button onClick={() => setViewingReqId(item.linkedReq)} className="text-[9px] font-black text-brand-600 uppercase tracking-widest">{item.linkedReq}</button>
                    </td>
                    <td className="px-6 py-5 text-center">{getBadge(item.supervisor)}</td>
                    <td className="px-6 py-5 text-center">{getBadge(item.finance)}</td>
                    <td className="px-6 py-5 text-right">{getBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <RequisitionDetailsDrawer reqId={viewingReqId} onClose={() => setViewingReqId(null)} />
      <VoucherDetailsDrawer voucherId={viewingVoucherId} onClose={() => setViewingVoucherId(null)} />
    </div>
  );
};
