import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note2ReservesPageProps {
  onBack?: () => void;
}

const Note2ReservesPage: React.FC<Note2ReservesPageProps> = ({ onBack }) => {
  const columns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "60%",
    },
    {
      key: "currentYear",
      label: "As at 31 March, 2025",
      align: "right",
      format: "currency",
      width: "20%",
    },
    {
      key: "previousYear",
      label: "As at 31 March, 2024",
      align: "right",
      format: "currency",
      width: "20%",
    },
  ];

  const rows: FinancialReportRow[] = [
    // (a) Surplus / (Deficit) in Statement of Income & Expenditure
    {
      id: "surplus-deficit",
      type: "section",
      collapsible: true,
      data: {
        particulars:
          "(a) Surplus / (Deficit) in Statement of Income & Expenditure",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "surplus-opening",
      type: "data",
      parentId: "surplus-deficit",
      data: {
        particulars: "Opening balance",
        currentYear: 2500000,
        previousYear: 2000000,
      },
      indent: 1,
    },
    {
      id: "surplus-year",
      type: "data",
      parentId: "surplus-deficit",
      data: {
        particulars: "Add: Surplus / (Deficit) for the year",
        currentYear: 1000000,
        previousYear: 500000,
      },
      indent: 1,
    },
    {
      id: "general-fund-closing",
      type: "total",
      parentId: "surplus-deficit",
      data: {
        particulars: "Closing General Fund Balance",
        currentYear: 3500000,
        previousYear: 2500000,
      },
      bold: true,
      indent: 1,
    },

    // (b) Corpus Fund
    {
      id: "corpus-fund",
      type: "section",
      collapsible: true,
      data: {
        particulars: "(b) Corpus Fund",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "corpus-opening",
      type: "data",
      parentId: "corpus-fund",
      data: {
        particulars: "Opening Balance",
        currentYear: 5000000,
        previousYear: 4500000,
      },
      indent: 1,
    },
    {
      id: "corpus-additions",
      type: "data",
      parentId: "corpus-fund",
      data: {
        particulars: "Add: Additions during the year",
        currentYear: 500000,
        previousYear: 500000,
      },
      indent: 1,
    },
    {
      id: "corpus-withdrawn",
      type: "data",
      parentId: "corpus-fund",
      data: {
        particulars: "Less: Withdrawn during the year",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 1,
    },
    {
      id: "corpus-closing",
      type: "total",
      parentId: "corpus-fund",
      data: {
        particulars: "Closing Corpus Fund Balance",
        currentYear: 5500000,
        previousYear: 5000000,
      },
      bold: true,
      indent: 1,
    },

    // (c) Deffered Grant for Fixed Assets
    {
      id: "deferred-grant",
      type: "data",
      data: {
        particulars: "(c) Deffered Grant for Fixed Assets",
        currentYear: 1790000,
        previousYear: 1405000,
      },
      bold: true,
    },

    // Total Reserves and Surplus
    {
      id: "total",
      type: "grandtotal",
      data: {
        particulars: "Total Reserves and Surplus",
        currentYear: 10790000,
        previousYear: 8905000,
      },
      bold: true,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <FinancialReport
      title="Note 2 Reserves and surplus"
      subtitle="As at 31 March, 2025 and As at 31 March, 2024"
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
      onBack={onBack}
      backLabel="Back to Balance Sheet"
    />
  );
};

export default Note2ReservesPage;
