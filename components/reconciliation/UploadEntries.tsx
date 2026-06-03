import React, { useState } from "react";
import { CompactDatePicker } from "../shared/CompactDatePicker";

interface UploadEntriesProps {
  themeColor: string;
}

const BANK_OPTIONS = ["Bank Account Local", "Bank Account FCRA"] as const;

export const UploadEntries: React.FC<UploadEntriesProps> = ({ themeColor }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [statementDate, setStatementDate] = useState<string>("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-10 py-8 text-white`}>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Upload Bank Entries
          </h2>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
            Import bank statements for reconciliation
          </p>
        </div>

        <div className="p-10">
          <div className="mb-6 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Select Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
                <option value="">Select Bank Account</option>
                {BANK_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Enter Bank Statement Date
              </label>
              <CompactDatePicker
                value={statementDate}
                onChange={setStatementDate}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div
            className={`relative group border-4 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center transition-all ${dragActive ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/20" : "border-slate-200 dark:border-slate-700 hover:border-brand-400"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}>
            <input
              type="file"
              multiple
              accept=".pdf,.xlsx,.csv"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">
              📄
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
              Drop Statement Files Here
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center max-w-sm mb-8 leading-relaxed">
              Supports Excel (.xlsx), CSV, and PDF bank statements. Drag and
              drop or click to browse.
            </p>
            <button
              className={`px-8 py-3 bg-${themeColor} text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-brand-500/30 transition-shadow`}>
              Browse Records
            </button>
          </div>

          {files.length > 0 && (
            <div className="mt-10 space-y-4 animate-in fade-in duration-300">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Selected Files ({files.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📑</span>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                          {file.name}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-6 flex justify-end">
                <button
                  className={`px-12 py-4 bg-${themeColor} text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] transition transform`}>
                  Process & Sync Records
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
