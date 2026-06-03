import React, { useState } from "react";

interface ITSpendReqPageProps {
  themeColor?: string;
}

export const ITSpendReqPage: React.FC<ITSpendReqPageProps> = ({
  themeColor = "brand-600",
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("14/03/2024");
  const [dateTo, setDateTo] = useState("21/03/2024");

  const mockHistory = [
    {
      id: "IT-201",
      date: "14/03/2024",
      category: "Software",
      vendor: "Microsoft",
      amount: "$4,200",
      status: "Approved",
      hasFile: true,
    },
    {
      id: "IT-205",
      date: "16/03/2024",
      category: "Hardware",
      vendor: "Dell Global",
      amount: "$8,950",
      status: "Pending",
      hasFile: false,
    },
    {
      id: "IT-209",
      date: "21/03/2024",
      category: "Cloud",
      vendor: "Amazon AWS",
      amount: "$1,200",
      status: "Approved",
      hasFile: true,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map((f: File) => f.name);
      setAttachedFiles((prev) => [...prev, ...files]);
    }
  };

  if (isCreating) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div
            className={`bg-${themeColor} px-10 py-8 text-white flex justify-between items-center`}>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Create IT Requisition
              </h1>
              <p className="text-white/70 text-xs font-medium mt-1">
                Request approval for technology expenditures.
              </p>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
              Back to List
            </button>
          </div>

          <div className="p-10">
            <form
              className="max-w-2xl mx-auto space-y-6"
              onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Category
                    </label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs">
                      <option>Software Licensing</option>
                      <option>Hardware/Equipment</option>
                      <option>Cloud Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Vendor
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                      placeholder="e.g. Amazon AWS"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Req Date
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                    Attach Invoices/Quotes
                  </label>
                  <div className="mt-1 flex justify-center px-4 py-6 border-2 border-slate-200 border-dashed rounded-xl hover:bg-slate-50 transition cursor-pointer relative">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                    />
                    <div className="text-center">
                      <span className="text-2xl">📤</span>
                      <p className="text-[10px] font-black text-brand-600 uppercase mt-1">
                        Upload files
                      </p>
                    </div>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-lg border border-brand-100 flex items-center gap-2">
                          <span>📎</span> {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold h-24 text-xs"
                    placeholder="Describe requirements..."></textarea>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                  Cancel
                </button>
                <button
                  className={`px-10 py-3 bg-${themeColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition`}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div
          className={`bg-${themeColor} px-8 py-5 text-white flex justify-between items-center`}>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">
              Travel Requisitions
            </h1>
            <p className="text-white/70 text-[10px] font-medium mt-1">
              Technology investment history and requests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transform hover:scale-105 transition flex items-center gap-2">
              <span className="text-lg">📥</span> EXPORT TO EXCEL
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2.5 bg-white text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transform hover:scale-105 transition">
              + NEW IT REQUEST
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-end gap-4 mb-6 bg-slate-50 p-4 rounded-xl">
            <div className="flex-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                Period From
              </label>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                Period To
              </label>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <button className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition">
              Filter Period
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-6 py-4">IT ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Files</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
                {/* Column Filters */}
                <tr className="bg-slate-50/50 border-b">
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="ID"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none"
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none"
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Cat"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none"
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Vendor"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none"
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Amount"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none text-right"
                    />
                  </th>
                  <th className="px-6 py-2"></th>
                  <th className="px-6 py-2">
                    <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] outline-none">
                      <option value="">All</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-[10px] font-bold text-brand-600">
                      {item.id}
                    </td>
                    <td className="px-6 py-3 text-[10px] font-medium text-slate-500">
                      {item.date}
                    </td>
                    <td className="px-6 py-3 text-xs font-bold text-slate-700">
                      {item.category}
                    </td>
                    <td className="px-6 py-3 text-xs font-medium text-slate-500">
                      {item.vendor}
                    </td>
                    <td className="px-6 py-3 text-xs text-right font-black text-slate-900">
                      {item.amount}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {item.hasFile && (
                        <button
                          title="View File"
                          className="hover:scale-125 transition">
                          📎
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${item.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {item.status}
                      </span>
                    </td>
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
