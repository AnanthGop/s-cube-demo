import React, { useMemo, useState } from 'react';

interface EmployeeItem {
  id: number;
  name: string;
  designation: string;
  department: string;
  location: string;
  grossSalaryPerMonth: string;
  annualCTC?: string;
  employeeStatus: 'active' | 'resigned';
}

interface FundTypeItem {
  id: number;
  name: string;
  code?: string;
}

interface PayrollRegisterEntry {
  employeeId: number;
  employeeName: string;
  designation: string;
  department: string;
  location: string;
  fundType?: string;
  grossSalaryPerMonth: string;
  professionTax: string;
  employeeProvidentFund: string;
  employeeEsic: string;
  tds: string;
  netSalary: string;
  companyProvidentFund: string;
  companyEsic: string;
}

interface PayrollRunItem {
  id: number;
  month: string;
  employeeCount: number;
  totalGrossAmount: string;
  generatedOn: string;
  registerEntries?: PayrollRegisterEntry[];
}

interface PayrollPageProps {
  employees: EmployeeItem[];
  payrollRuns: PayrollRunItem[];
  fundTypes: FundTypeItem[];
  onUpdate: (data: PayrollRunItem[]) => void;
  themeColor?: string;
}

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const getCurrentMonthValue = () => {
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, '0');
};

const getCurrentYear = () => String(new Date().getFullYear());

const formatIndianAmount = (value: number) => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const roundTo2 = (value: number) => Math.round(value * 100) / 100;

const calcProfessionTax = (gross: number) => {
  // Simple monthly PT slab approximation.
  if (gross >= 25000) return 200;
  if (gross >= 15000) return 150;
  if (gross >= 10000) return 100;
  return 0;
};

const calcEmployeePf = (gross: number) => {
  // PF on basic (assumed 50% of gross) with statutory PF wage cap 15,000.
  const basic = gross * 0.5;
  const pfWage = Math.min(basic, 15000);
  return roundTo2(pfWage * 0.12);
};

const calcCompanyPf = (gross: number) => {
  // Employer PF at same PF wage basis used above.
  const basic = gross * 0.5;
  const pfWage = Math.min(basic, 15000);
  return roundTo2(pfWage * 0.12);
};

const calcEmployeeEsic = (gross: number) => {
  // ESIC applies up to 21,000 gross per month.
  if (gross > 21000) return 0;
  return roundTo2(gross * 0.0075);
};

const calcCompanyEsic = (gross: number) => {
  if (gross > 21000) return 0;
  return roundTo2(gross * 0.0325);
};

const calcTds = (annualCtc: number) => {
  // Basic monthly TDS approximation with 5L annual threshold.
  const taxableAnnual = Math.max(annualCtc - 500000, 0);
  return roundTo2((taxableAnnual * 0.1) / 12);
};

const getDDMMYYYY = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getMonthLabel = (monthValue: string) => {
  return MONTH_OPTIONS.find((m) => m.value === monthValue)?.label || monthValue;
};

const getMonthDisplay = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  return `${getMonthLabel(month)} ${year}`;
};

export const PayrollPage: React.FC<PayrollPageProps> = ({
  employees,
  payrollRuns,
  fundTypes,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const activeEmployees = useMemo(() => {
    return (employees || []).filter((emp) => emp.employeeStatus === 'active');
  }, [employees]);

  const totalGrossAmount = useMemo(() => {
    return activeEmployees.reduce((sum, employee) => {
      const amount = Number(String(employee.grossSalaryPerMonth || '').replace(/,/g, ''));
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [activeEmployees]);

  const fundTypeOptions = useMemo(() => {
    const fromMaster = (fundTypes || [])
      .map((item) => {
        const text = `${item.code || ''} ${item.name || ''}`.toLowerCase();
        if (text.includes('fcra') || /\bfc\b/.test(text)) {
          return { value: 'fcra', label: 'FCRA' };
        }
        if (text.includes('local') || /\blc\b/.test(text)) {
          return { value: 'local', label: 'Local' };
        }
        const fallback = String(item.name || '').trim();
        if (!fallback) return null;
        return { value: fallback.toLowerCase(), label: fallback };
      })
      .filter((item): item is { value: string; label: string } => Boolean(item));

    const deduped = Array.from(new Map(fromMaster.map((item) => [item.value, item])).values());
    if (deduped.length > 0) return deduped;
    return [
      { value: 'local', label: 'Local' },
      { value: 'fcra', label: 'FCRA' }
    ];
  }, [fundTypes]);

  const generatePayroll = () => {
    const monthKey = `${selectedYear}-${selectedMonth}`;

    const existingIndex = (payrollRuns || []).findIndex((run) => run.month === monthKey);
    const defaultFundType = fundTypeOptions[0]?.value || '';
    const registerEntries: PayrollRegisterEntry[] = activeEmployees.map((employee) => ({
      grossSalaryPerMonth: String(employee.grossSalaryPerMonth || '0'),
      fundType: defaultFundType,
      ...(() => {
        const gross = Number(String(employee.grossSalaryPerMonth || '0').replace(/,/g, '')) || 0;
        const annualCtc = Number(String(employee.annualCTC || '0').replace(/,/g, '')) || gross * 12;
        const professionTax = calcProfessionTax(gross);
        const employeeProvidentFund = calcEmployeePf(gross);
        const employeeEsic = calcEmployeeEsic(gross);
        const tds = calcTds(annualCtc);
        const netSalary = roundTo2(gross - professionTax - employeeProvidentFund - employeeEsic - tds);
        const companyProvidentFund = calcCompanyPf(gross);
        const companyEsic = calcCompanyEsic(gross);

        return {
          professionTax: String(professionTax),
          employeeProvidentFund: String(employeeProvidentFund),
          employeeEsic: String(employeeEsic),
          tds: String(tds),
          netSalary: String(netSalary),
          companyProvidentFund: String(companyProvidentFund),
          companyEsic: String(companyEsic)
        };
      })(),
      employeeId: employee.id,
      employeeName: employee.name,
      designation: employee.designation,
      department: employee.department,
      location: employee.location
    }));

    const payload: PayrollRunItem = {
      id: existingIndex === -1 ? Date.now() : payrollRuns[existingIndex].id,
      month: monthKey,
      employeeCount: activeEmployees.length,
      totalGrossAmount: String(totalGrossAmount),
      generatedOn: getDDMMYYYY(),
      registerEntries
    };

    const nextRuns = existingIndex === -1
      ? [payload, ...(payrollRuns || [])]
      : (payrollRuns || []).map((run) => (run.month === monthKey ? payload : run));

    onUpdate(nextRuns);
    setSelectedRunId(payload.id);
    window.alert(`Payroll generated for ${getMonthLabel(selectedMonth)} ${selectedYear}.`);
  };

  const selectedRun = useMemo(() => {
    if (!selectedRunId) return (payrollRuns || [])[0] || null;
    return (payrollRuns || []).find((run) => run.id === selectedRunId) || null;
  }, [payrollRuns, selectedRunId]);

  const downloadRegister = (run: PayrollRunItem) => {
    const [year, month] = run.month.split('-');
    const entries = run.registerEntries || [];
    const csvRows = [
      ['Month', `${getMonthLabel(month)} ${year}`],
      ['Generated On', run.generatedOn],
      ['Employee Count', String(run.employeeCount)],
      ['Total Gross Amount', String(run.totalGrossAmount)],
      [],
      ['Employee Name', 'Designation', 'Department', 'Location', 'Fund Type', 'Gross Salary Per Month', 'Profession Tax', 'Employee PF', 'Employee ESIC', 'TDS', 'Net Salary', 'Company PF', 'Company ESIC'],
      ...entries.map((entry) => [
        entry.employeeName,
        entry.designation,
        entry.department,
        entry.location,
        entry.fundType || '',
        entry.grossSalaryPerMonth,
        entry.professionTax,
        entry.employeeProvidentFund,
        entry.employeeEsic,
        entry.tds,
        entry.netSalary,
        entry.companyProvidentFund,
        entry.companyEsic
      ])
    ];

    const csv = csvRows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payroll_Register_${run.month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateSalaryExpenseVouchers = (run: PayrollRunItem) => {
    window.alert(`Salary expense vouchers generated for ${getMonthDisplay(run.month)}.`);
  };

  const handleSalaryPaymentVouchers = (run: PayrollRunItem) => {
    window.alert(`Salary payment vouchers generated for ${getMonthDisplay(run.month)}.`);
  };

  const handleFundTypeChange = (runId: number, employeeId: number, fundType: string) => {
    const nextRuns = (payrollRuns || []).map((run) => {
      if (run.id !== runId) return run;
      return {
        ...run,
        registerEntries: (run.registerEntries || []).map((entry) => {
          if (entry.employeeId !== employeeId) return entry;
          return { ...entry, fundType };
        })
      };
    });
    onUpdate(nextRuns);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Payroll</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Generate payroll by month</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Year</label>
              <input
                type="text"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                placeholder="YYYY"
              />
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300">
              Active Employees: <span className="font-bold">{activeEmployees.length}</span>
            </div>

            <button
              onClick={generatePayroll}
              className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
            >
              Generate Payroll
            </button>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-300">
            Current Gross Payout: <span className="font-bold">Rs. {formatIndianAmount(totalGrossAmount)}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Employee Count</th>
                  <th className="px-4 py-3 text-right">Total Gross Amount</th>
                  <th className="px-4 py-3">Generated On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {(payrollRuns || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No payroll generated yet.
                    </td>
                  </tr>
                )}
                {(payrollRuns || []).map((run) => {
                  const [year, month] = run.month.split('-');
                  return (
                    <tr key={run.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedRun?.id === run.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{getMonthLabel(month)} {year}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">{run.employeeCount}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(run.totalGrossAmount || 0))}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{run.generatedOn}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRunId(run.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-extrabold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          >
                            View Register
                          </button>
                          <button
                            onClick={() => downloadRegister(run)}
                            className={`px-3 py-1.5 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleGenerateSalaryExpenseVouchers(run)}
                            className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                          >
                            Generate Salary Expense Vouchers
                          </button>
                          <button
                            onClick={() => handleSalaryPaymentVouchers(run)}
                            className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
                          >
                            Salary Payment Vouchers
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedRun && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Payroll Register: {(() => {
                    const [year, month] = selectedRun.month.split('-');
                    return `${getMonthLabel(month)} ${year}`;
                  })()}
                </h3>
                <button
                  onClick={() => downloadRegister(selectedRun)}
                  className={`px-3 py-1.5 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}
                >
                  Download Register
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Fund Type</th>
                      <th className="px-4 py-3 text-right">Gross Salary / Month</th>
                      <th className="px-4 py-3 text-right">Profession Tax</th>
                      <th className="px-4 py-3 text-right">Employee PF</th>
                      <th className="px-4 py-3 text-right">Employee ESIC</th>
                      <th className="px-4 py-3 text-right">TDS</th>
                      <th className="px-4 py-3 text-right">Net Salary</th>
                      <th className="px-4 py-3 text-right">Company PF</th>
                      <th className="px-4 py-3 text-right">Company ESIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(selectedRun.registerEntries || []).length === 0 && (
                      <tr>
                        <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">
                          No employee register entries found for this payroll run.
                        </td>
                      </tr>
                    )}
                    {(selectedRun.registerEntries || []).map((entry) => (
                      <tr key={entry.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{entry.designation}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{entry.department}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{entry.location}</td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={entry.fundType || ''}
                            onChange={(e) => handleFundTypeChange(selectedRun.id, entry.employeeId, e.target.value)}
                            className="w-32 px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          >
                            <option value="">Select</option>
                            {fundTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.grossSalaryPerMonth || 0))}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.professionTax || 0))}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.employeeProvidentFund || 0))}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.employeeEsic || 0))}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.tds || 0))}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.netSalary || 0))}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.companyProvidentFund || 0))}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-200">Rs. {formatIndianAmount(Number(entry.companyEsic || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
