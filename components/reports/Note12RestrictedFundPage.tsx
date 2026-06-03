import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note12RestrictedFundPageProps {
  onBack?: () => void;
}

const Note12RestrictedFundPage: React.FC<Note12RestrictedFundPageProps> = ({
  onBack,
}) => {
  const columns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "15%",
    },
    {
      key: "openingBalance",
      label: "Balance as on 01.04.2024",
      align: "right",
      format: "currency",
      width: "12%",
    },
    {
      key: "fundsReceived",
      label: "Funds Recd during FY 2024 2025",
      align: "right",
      format: "currency",
      width: "12%",
    },
    {
      key: "totalFunds",
      label: "Total Funds for FY 2024-2025",
      align: "right",
      format: "currency",
      width: "13%",
    },
    {
      key: "utilisedExpenses",
      label: "Utilised for Expenses",
      align: "right",
      format: "currency",
      width: "12%",
    },
    {
      key: "utilisedAssets",
      label: "Utilised for Asset Purchases",
      align: "right",
      format: "currency",
      width: "12%",
    },
    {
      key: "totalUtilisation",
      label: "Utilisation for Expenses/Purchase of assets for FY 2024 2025",
      align: "right",
      format: "currency",
      width: "12%",
    },
    {
      key: "closingBalance",
      label: "Balance as on 31.03.2025",
      align: "right",
      format: "currency",
      width: "12%",
    },
  ];

  const rows: FinancialReportRow[] = [
    {
      id: "abc-company",
      type: "data",
      data: {
        particulars: "ABC Company",
        openingBalance: 500000,
        fundsReceived: 1000000,
        totalFunds: 1500000,
        utilisedExpenses: 750000,
        utilisedAssets: 250000,
        totalUtilisation: 1000000,
        closingBalance: 500000,
      },
    },
    {
      id: "xyz-trust",
      type: "data",
      data: {
        particulars: "XYZ Trust",
        openingBalance: 750000,
        fundsReceived: 500000,
        totalFunds: 1250000,
        utilisedExpenses: 600000,
        utilisedAssets: 150000,
        totalUtilisation: 750000,
        closingBalance: 500000,
      },
    },
    {
      id: "pqr-ltd",
      type: "data",
      data: {
        particulars: "PQR Ltd",
        openingBalance: 400000,
        fundsReceived: 1500000,
        totalFunds: 1900000,
        utilisedExpenses: 850000,
        utilisedAssets: 200000,
        totalUtilisation: 1050000,
        closingBalance: 850000,
      },
    },
    {
      id: "total",
      type: "grandtotal",
      data: {
        particulars: "Total",
        openingBalance: 1650000,
        fundsReceived: 3000000,
        totalFunds: 4650000,
        utilisedExpenses: 2200000,
        utilisedAssets: 600000,
        totalUtilisation: 2800000,
        closingBalance: 1850000,
      },
      bold: true,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <FinancialReport
      title="Note 12: Restricted Fund Movement for the year and balance as on 31st March 2025"
      subtitle=""
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
      onBack={onBack}
      backLabel="Back"
    />
  );
};

export default Note12RestrictedFundPage;
