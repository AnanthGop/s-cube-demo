import React, { useMemo, useState } from "react";
import { Search, Filter, CheckCircle2, XCircle, Clock } from "lucide-react";

interface PaymentIntegrationStatusProps {
    themeColor: string;
}

// In a real implementation this would fetch from an API
// For now we simulate the data based on the requirements
const MOCK_DATA = [
    { id: "BPV-FY26-001", date: "2026-03-12", amount: 45000, payee: "John Doe", reqId: "REQ-TRV-001", status: "Success", integrationId: "INT-883921" },
    { id: "BPV-FY26-002", date: "2026-03-14", amount: 12500, payee: "Jane Smith", reqId: "REQ-TRV-002", status: "Success", integrationId: "INT-883922" },
    { id: "BPV-FY26-003", date: "2026-03-15", amount: 8000, payee: "Acme Corp", reqId: "REQ-RNT-001", status: "Unsuccessful", integrationId: "INT-883923", error: "Invalid Bank Account" },
    { id: "BPV-FY26-004", date: "2026-03-16", amount: 35000, payee: "Tech Solutions", reqId: "REQ-CON-001", status: "Success", integrationId: "INT-883924" },
    { id: "BPV-FY26-005", date: "2026-03-18", amount: 22000, payee: "Sarah Jones", reqId: "REQ-TRV-003", status: "Success", integrationId: "INT-883925" },
    { id: "BPV-FY26-006", date: "2026-03-20", amount: 5500, payee: "Mike Brown", reqId: "REQ-TRV-004", status: "Pending", integrationId: "INT-883926" },
    { id: "BPV-FY26-007", date: "2026-03-21", amount: 18000, payee: "Consulting Inc", reqId: "REQ-CON-002", status: "Success", integrationId: "INT-883927" },
    { id: "BPV-FY26-008", date: "2026-03-22", amount: 42000, payee: "Global Travel", reqId: "REQ-TRV-005", status: "Success", integrationId: "INT-883928" },
    { id: "BPV-FY26-009", date: "2026-03-25", amount: 9500, payee: "Office Supplies Co", reqId: "REQ-IT-001", status: "Unsuccessful", integrationId: "INT-883929", error: "Insufficient Funds" },
    { id: "BPV-FY26-010", date: "2026-03-28", amount: 15000, payee: "Alice Williams", reqId: "REQ-TRV-006", status: "Success", integrationId: "INT-883930" },
];

export const PaymentIntegrationStatus: React.FC<PaymentIntegrationStatusProps> = ({
    themeColor,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const filteredData = useMemo(() => {
        return MOCK_DATA.filter(item => {
            const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.reqId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: MOCK_DATA.length,
            success: MOCK_DATA.filter(d => d.status === "Success").length,
            unsuccessful: MOCK_DATA.filter(d => d.status === "Unsuccessful").length,
            pending: MOCK_DATA.filter(d => d.status === "Pending").length,
        };
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-6">
            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`col-span-1 md:col-span-4 bg-${themeColor} rounded-2xl shadow-lg p-6 text-white flex justify-between items-center`}>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Payment Integration Status</h2>
                        <p className="text-white/80 text-sm font-medium mt-1">
                            Real-time synchronization status of Bank Payment Vouchers with the banking API.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Processed</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Successful</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.success}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-800 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Unsuccessful</p>
                        <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{stats.unsuccessful}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <XCircle size={20} />
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-800 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Pending Sync</p>
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.pending}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Clock size={20} />
                    </div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="relative flex-1 min-w-[250px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by Voucher ID, Payee, or Requisition..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex gap-2">
                        {["All", "Success", "Unsuccessful", "Pending"].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${statusFilter === status
                                        ? `bg-${themeColor} text-white shadow-sm`
                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Bank Voucher ID</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Date Issued</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Payee / Beneficiary</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Requisition Ref</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-right">Amount (₹)</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Integration ID</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Filter size={32} className="text-slate-300 dark:text-slate-600" />
                                            <p className="font-medium text-sm">No vouchers match your current filters.</p>
                                            <button
                                                onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                                                className={`text-${themeColor} text-xs font-bold hover:underline`}
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                {row.id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                                            {row.payee}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                {row.reqId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-right text-slate-900 dark:text-white">
                                            {row.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                                                {row.integrationId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {row.status === "Success" && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 w-max">
                                                        <CheckCircle2 size={12} />
                                                        Success
                                                    </span>
                                                )}
                                                {row.status === "Unsuccessful" && (
                                                    <>
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 w-max">
                                                            <XCircle size={12} />
                                                            Failed
                                                        </span>
                                                        <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                                                            {row.error}
                                                        </span>
                                                    </>
                                                )}
                                                {row.status === "Pending" && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 w-max">
                                                        <Clock size={12} />
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
