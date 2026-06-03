import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note13GrantFundsFixedAssetsPageProps {
  onBack?: () => void;
}

const Note13GrantFundsFixedAssetsPage: React.FC<
  Note13GrantFundsFixedAssetsPageProps
> = ({ onBack }) => {
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
        additions: 100000,
        deletions: 0,
        closingBal: 550000,
        depOpeningBal: 100000,
        depFY: 50000,
        depDeletions: 0,
        depTotal: 150000,
        depClosingBal: 150000,
        wdvCurrent: 400000,
        wdvPrevious: 350000,
      },
    },
    {
      id: "furniture",
      type: "data",
      data: {
        sn: "2",
        description: "Furniture & Fixtures",
        openingBal: 330000,
        additions: 50000,
        deletions: 0,
        closingBal: 380000,
        depOpeningBal: 60000,
        depFY: 20000,
        depDeletions: 0,
        depTotal: 80000,
        depClosingBal: 80000,
        wdvCurrent: 300000,
        wdvPrevious: 270000,
      },
    },
    {
      id: "office-equipment",
      type: "data",
      data: {
        sn: "3",
        description: "Office Equipment",
        openingBal: 470000,
        additions: 150000,
        deletions: 0,
        closingBal: 620000,
        depOpeningBal: 90000,
        depFY: 30000,
        depDeletions: 0,
        depTotal: 120000,
        depClosingBal: 120000,
        wdvCurrent: 500000,
        wdvPrevious: 315000,
      },
    },
    {
      id: "grand-total",
      type: "grandtotal",
      data: {
        sn: "",
        description: "Grand Total",
        openingBal: 950000,
        additions: 300000,
        deletions: "-",
        closingBal: 1250000,
        depOpeningBal: 200000,
        depFY: 100000,
        depDeletions: "-",
        depTotal: "-",
        depClosingBal: 300000,
        wdvCurrent: 1200000,
        wdvPrevious: 1050000,
      },
      bold: true,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <FinancialReport
        title="Note 13   FIXED ASSETS: GRANT FUNDS 2024 2025"
        subtitle=""
        columns={columns}
        rows={rows}
        showExport={true}
        onExport={handleExport}
        onBack={onBack}
        backLabel="Back to Balance Sheet"
      />
    </div>
  );
};

export default Note13GrantFundsFixedAssetsPage;
