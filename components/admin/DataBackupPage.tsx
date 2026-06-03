
import React, { useRef, useState } from 'react';

interface DataFile {
  id: string;
  name: string;
  group: 'Master Data' | 'Operational' | 'Financial';
  icon: string;
  description: string;
}

interface DataBackupPageProps {
  appState: any;
  onImport: (moduleId: string, data: any) => void;
  onReset: () => void;
  themeColor: string;
}

const DATA_FILES: DataFile[] = [
  // Master Data Files
  { id: 'admin_user', name: 'users.json', group: 'Master Data', icon: '👤', description: 'System user accounts and access levels' },
  { id: 'admin_company', name: 'companies.json', group: 'Master Data', icon: '🏢', description: 'Registered legal entities and structures' },
  { id: 'admin_fund', name: 'funds.json', group: 'Master Data', icon: '💰', description: 'Funding source definitions and IDs' },
  { id: 'admin_fy', name: 'financial_years.json', group: 'Master Data', icon: '📅', description: 'Indian Financial Year (April-March) records' },
  { id: 'admin_grant', name: 'grants.json', group: 'Master Data', icon: '📜', description: 'Donor grant codes and status' },
  { id: 'admin_project', name: 'projects.json', group: 'Master Data', icon: '🏗️', description: 'NGO project codes and tracking' },
  { id: 'chart_of_accounts', name: 'chart_of_accounts.json', group: 'Master Data', icon: '📖', description: 'Full Chart of Accounts (COA) records' },
  { id: 'admin_mapping', name: 'mappings.json', group: 'Master Data', icon: '🧩', description: 'Expense-to-Account mapping logic' },
  
  // Operational Files
  { id: 'req_consultants', name: 'consultant_req.json', group: 'Operational', icon: '👨‍💼', description: 'Consultant requisition transaction logs' },
  { id: 'req_it', name: 'it_spend_req.json', group: 'Operational', icon: '💻', description: 'IT hardware and software spend records' },
  { id: 'requisitions/rent/records', name: 'rent_records.json', group: 'Operational', icon: '🏠', description: 'Rent requisition records and agreement metadata' },
  { id: 'requisitions/rent/journal_voucher_master', name: 'journal_voucher_master.json', group: 'Operational', icon: '🧾', description: 'Landlord to Sundry Creditors ledger mappings for journal vouchers' },
  { id: 'requisitions/rent/tds_account', name: 'tds_account.json', group: 'Operational', icon: '🧮', description: 'Selected TDS account mapping used for rent journal entries' },
  { id: 'requisitions/rent/vouchers', name: 'vouchers.json', group: 'Operational', icon: '📒', description: 'Rent voucher snapshots by financial year and landlord' },
  
  // Financial Files
  { id: 'vouchers_expense', name: 'expense_vouchers.json', group: 'Financial', icon: '🧾', description: 'Processed expense voucher batches' },
  { id: 'vouchers_bank', name: 'bank_vouchers.json', group: 'Financial', icon: '🏦', description: 'Bank disbursement voucher data' },
  { id: 'recon_entries', name: 'bank_entries.json', group: 'Financial', icon: '📊', description: 'Bank statement lines and matching' },
  { id: 'cash_flow', name: 'cash_flow.json', group: 'Financial', icon: '📈', description: 'Cash flow transaction history' },
];

export const DataBackupPage: React.FC<DataBackupPageProps> = ({ appState, onImport, onReset, themeColor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFileForImport, setActiveFileForImport] = useState<string | null>(null);

  const handleExport = (fileId: string) => {
    const data = appState[fileId] || [];
    const fileDef = DATA_FILES.find(f => f.id === fileId);
    const fileName = fileDef?.name || `${fileId}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = (fileId: string) => {
    setActiveFileForImport(fileId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFileForImport) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImport(activeFileForImport, json);
        alert(`${DATA_FILES.find(f => f.id === activeFileForImport)?.name} File Imported Successfully!`);
      } catch (err) {
        alert("Invalid JSON file format.");
      } finally {
        setActiveFileForImport(null);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const renderGroup = (groupName: DataFile['group']) => {
    const files = DATA_FILES.filter(f => f.group === groupName);
    return (
      <div key={groupName} className="space-y-6">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
          <span>{groupName} Files</span>
          <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {files.map((file) => (
            <div key={file.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col group hover:border-brand-500 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {file.icon}
                </div>
                <div>
                   <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">{file.name}</h3>
                   <span className="text-[10px] font-bold text-brand-600 mt-1 block">{appState[file.id]?.length || 0} Records Found</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 flex-1 leading-relaxed">
                {file.description}
              </p>
              <div className="flex gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button 
                  onClick={() => handleExport(file.id)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                >
                  Export JSON
                </button>
                <button 
                  onClick={() => handleImportClick(file.id)}
                  className="flex-1 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-brand-600 dark:text-brand-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all shadow-sm"
                >
                  Import JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Granular JSON Management</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Every menu and sub-menu entry is stored as a separate modular file.</p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json"
      />

      <div className="space-y-16">
        {renderGroup('Master Data')}
        {renderGroup('Operational')}
        {renderGroup('Financial')}
      </div>

      <div className="mt-16 p-8 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🪣</span>
            <div>
              <h4 className="text-sm font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest">Factory Reset</h4>
              <p className="text-xs font-medium text-rose-600/70 dark:text-rose-400/50">Wipe all modular JSON files and restore system default demo state.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if(confirm("DANGER: This will wipe ALL your current JSON files. Proceed?")) onReset();
            }}
            className="px-8 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-600 transition"
          >
            Clear All JSON Storage
          </button>
        </div>
      </div>
    </div>
  );
};
