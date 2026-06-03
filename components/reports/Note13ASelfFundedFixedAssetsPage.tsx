import React from "react";
import { ArrowLeft } from "lucide-react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note13ASelfFundedFixedAssetsPageProps {
  onBack?: () => void;
  onNavigateToBalanceSheet?: () => void;
  onNavigateToIncomeStatement?: () => void;
}

const Note13ASelfFundedFixedAssetsPage: React.FC<
  Note13ASelfFundedFixedAssetsPageProps
> = ({ onBack, onNavigateToBalanceSheet, onNavigateToIncomeStatement }) => {
  const columns: FinancialReportColumn[] = [
    {
      key: "sn",
      label: "SN",
      align: "center",
      width: "4%",
    },
    {
      key: "description",
      label: "Description",
      align: "left",
      width: "12%",
    },
    {
      key: "openingBal",
      label: "Op. Bal 01.04.2024",
      align: "right",
      format: "currency",
      width: "10%",
    },
    {
      key: "additions",
      label: "Additions",
      align: "right",
      format: "currency",
      width: "10%",
    },
    {
      key: "deletions",
      label: "Deletions",
      align: "right",
      format: "currency",
      width: "10%",
    },
    {
      key: "closingBal",
      label: "Cl. Bal 31.03.2025",
      align: "right",
      format: "currency",
      width: "10%",
    },
    {
      key: "depOpeningBal",
      label: "Op Bal 01.04.2024",
      align: "right",
      format: "currency",
      width: "9%",
    },
    {
      key: "depFY",
      label: "FY 2024 2025",
      align: "right",
      format: "currency",
      width: "9%",
    },
    {
      key: "depDeletions",
      label: "Depreciation on deletions reversed",
      align: "right",
      format: "currency",
      width: "9%",
    },
    {
      key: "depTotal",
      label: "Total Depreciation for the year",
      align: "right",
      format: "currency",
      width: "9%",
    },
    {
      key: "depClosingBal",
      label: "Cl. Bal 31.03.2025",
      align: "right",
      format: "currency",
      width: "9%",
    },
    {
      key: "wdvCurrent",
      label: "WDV 31.03.2025",
      align: "right",
      format: "currency",
      width: "9%",
    },
    {
      key: "wdvPrevious",
      label: "WDV 31.03.2024",
      align: "right",
      format: "currency",
      width: "9%",
    },
  ];

  const rows: FinancialReportRow[] = [
    {
      id: "computers",
      type: "data",
      data: {
        sn: "1",
        description: "Computers",
        openingBal: 450000,
        additions: 50000,
        deletions: 0,
        closingBal: 500000,
        depOpeningBal: 80000,
        depFY: 20000,
        depDeletions: 0,
        depTotal: 100000,
        depClosingBal: 100000,
        wdvCurrent: 400000,
        wdvPrevious: 370000,
      },
    },
    {
      id: "furniture",
      type: "data",
      data: {
        sn: "2",
        description: "Furniture & Fixtures",
        openingBal: 550000,
        additions: 50000,
        deletions: 0,
        closingBal: 600000,
        depOpeningBal: 80000,
        depFY: 20000,
        depDeletions: 0,
        depTotal: 100000,
        depClosingBal: 100000,
        wdvCurrent: 500000,
        wdvPrevious: 470000,
      },
    },
    {
      id: "land",
      type: "data",
      data: {
        sn: "3",
        description: "Land",
        openingBal: 600000,
        additions: 0,
        deletions: 0,
        closingBal: 600000,
        depOpeningBal: 0,
        depFY: 0,
        depDeletions: 0,
        depTotal: 0,
        depClosingBal: 0,
        wdvCurrent: 600000,
        wdvPrevious: 600000,
      },
    },
    {
      id: "office-equipment",
      type: "data",
      data: {
        sn: "4",
        description: "Office Equipment",
        openingBal: 600000,
        additions: 50000,
        deletions: 0,
        closingBal: 650000,
        depOpeningBal: 120000,
        depFY: 30000,
        depDeletions: 0,
        depTotal: 150000,
        depClosingBal: 150000,
        wdvCurrent: 500000,
        wdvPrevious: 480000,
      },
    },
    {
      id: "grand-total",
      type: "grandtotal",
      data: {
        sn: "",
        description: "Grand Total",
        openingBal: 2200000,
        additions: 150000,
        deletions: "-",
        closingBal: 2350000,
        depOpeningBal: 280000,
        depFY: 70000,
        depDeletions: "-",
        depTotal: "-",
        depClosingBal: 350000,
        wdvCurrent: 2000000,
        wdvPrevious: 1920000,
      },
      bold: true,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Custom navigation header with two back buttons */}
      <div className="flex-none border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 px-8 py-4">
        <div className="flex items-center gap-3">
          {(onNavigateToBalanceSheet || onNavigateToIncomeStatement) && (
            <>
              {onNavigateToBalanceSheet && (
                <button
                  onClick={onNavigateToBalanceSheet}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                  title="Back to Balance Sheet">
                  <ArrowLeft size={16} />
                  Balance Sheet
                </button>
              )}
              {onNavigateToIncomeStatement && (
                <button
                  onClick={onNavigateToIncomeStatement}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                  title="Back to Income & Expenditure">
                  <ArrowLeft size={16} />
                  Income & Expenditure
                </button>
              )}
            </>
          )}
          {!onNavigateToBalanceSheet &&
            !onNavigateToIncomeStatement &&
            onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition shadow-sm"
                title="Back">
                <ArrowLeft size={16} />
                Back
              </button>
            )}
        </div>
      </div>
      <FinancialReport
        title="Note 13A FIXED ASSETS: SELF FUNDED 2024 2025"
        subtitle=""
        columns={columns}
        rows={rows}
        showExport={true}
        onExport={handleExport}
      />
    </div>
  );
};

export default Note13ASelfFundedFixedAssetsPage;
