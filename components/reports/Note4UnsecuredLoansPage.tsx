import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

const Note4UnsecuredLoansPage: React.FC = () => {
  const columns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "60%",
    },
    {
      key: "currentYear",
      label: "As at 31.03.2025",
      align: "right",
      format: "currency",
      width: "20%",
    },
    {
      key: "previousYear",
      label: "As at 31.03.2024",
      align: "right",
      format: "currency",
      width: "20%",
    },
  ];

  const rows: FinancialReportRow[] = [
    {
      id: "from-directors",
      type: "data",
      data: {
        particulars: "Loans from Directors",
        currentYear: 1200000,
        previousYear: 1500000,
      },
      indent: 1,
    },
    {
      id: "from-related",
      type: "data",
      data: {
        particulars: "Loans from Related Parties",
        currentYear: 750000,
        previousYear: 500000,
      },
      indent: 1,
    },
    {
      id: "from-others",
      type: "data",
      data: {
        particulars: "Loans from Others",
        currentYear: 450000,
        previousYear: 300000,
      },
      indent: 1,
    },
    {
      id: "grand-total",
      type: "grandtotal",
      data: {
        particulars: "Total Unsecured Loans",
        currentYear: 2400000,
        previousYear: 2300000,
      },
      bold: true,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <FinancialReport
      title="Note 4 - Unsecured Loans"
      subtitle="For the Financial Year 2024-2025"
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
    />
  );
};

export default Note4UnsecuredLoansPage;
