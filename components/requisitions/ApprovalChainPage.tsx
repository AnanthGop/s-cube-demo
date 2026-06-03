
import React from 'react';

interface ApprovalChainPageProps {
  themeColor?: string;
}

export const ApprovalChainPage: React.FC<ApprovalChainPageProps> = ({ themeColor = 'purple-600' }) => {
  const chainData = [
    { id: 'REQ-101', raisedBy: 'Jane Doe', supervisor: 'Approved', finance: 'Pending', status: 'In Review', hasFile: true },
    { id: 'REQ-102', raisedBy: 'Mike Ross', supervisor: 'Approved', finance: 'Approved', status: 'Authorized', hasFile: true },
    { id: 'REQ-103', raisedBy: 'Jane Doe', supervisor: 'Rejected', finance: 'N/A', status: 'Declined', hasFile: false },
    { id: 'REQ-104', raisedBy: 'Admin', supervisor: 'Pending', finance: 'Pending', status: 'Submitted', hasFile: true },
  ];

  const getStatusBadge = (status: string) => {
    const colors: any = {
      'Approved': 'bg-emerald-100 text-emerald-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Rejected': 'bg-rose-100 text-rose-700',
      'N/A': 'bg-slate-100 text-slate-400',
      'Authorized': 'bg-blue-100 text-blue-700',
      'In Review': 'bg-indigo-100 text-indigo-700',
      'Declined': 'bg-rose-100 text-rose-700',
      'Submitted': 'bg-slate-100 text-slate-700'
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${colors[status] || 'bg-slate-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-5 flex items-center justify-between text-white`}>
          <h2 className="text-xl font-extrabold tracking-tight">Requisition Tracker</h2>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transform hover:scale-105 transition">
              📥 Export to Excel
            </button>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">⛓️</div>
          </div>
        </div>

        <div className="p-8">
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-5">Req ID</th>
                  <th className="px-6 py-5">Requestor</th>
                  <th className="px-6 py-5 text-center">Attachment</th>
                  <th className="px-6 py-5 text-center">Supervisor</th>
                  <th className="px-6 py-5 text-center">Finance</th>
                  <th className="px-6 py-5 text-right">Status</th>
                </tr>
                <tr className="bg-slate-50/30 border-b">
                   <th className="px-6 py-2"><input type="text" placeholder="ID" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none" /></th>
                   <th className="px-6 py-2"><input type="text" placeholder="Name" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none" /></th>
                   <th className="px-6 py-2"></th>
                   <th className="px-6 py-2">
                     <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none">
                       <option value="">All</option>
                       <option value="Approved">Approved</option>
                       <option value="Pending">Pending</option>
                       <option value="Rejected">Rejected</option>
                     </select>
                   </th>
                   <th className="px-6 py-2">
                     <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none">
                       <option value="">All</option>
                       <option value="Approved">Approved</option>
                       <option value="Pending">Pending</option>
                     </select>
                   </th>
                   <th className="px-6 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {chainData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-5 font-mono text-xs font-bold text-indigo-500">{item.id}</td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{item.raisedBy}</td>
                    <td className="px-6 py-5 text-center">
                      {item.hasFile && <button title="View File" className="hover:scale-125 transition">📎</button>}
                    </td>
                    <td className="px-6 py-5 text-center">{getStatusBadge(item.supervisor)}</td>
                    <td className="px-6 py-5 text-center">{getStatusBadge(item.finance)}</td>
                    <td className="px-6 py-5 text-right">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
