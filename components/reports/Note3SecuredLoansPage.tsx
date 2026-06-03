import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note3CurrentLiabilitiesPageProps {
  onBack?: () => void;
}

const Note3CurrentLiabilitiesPage: React.FC<
  Note3CurrentLiabilitiesPageProps
> = ({ onBack }) => {
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
    // (i) Other payables
    {
      id: "other-payables",
      type: "section",
      collapsible: true,
      data: {
        particulars: "(i) Other payables",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "audit-fee",
      type: "data",
      parentId: "other-payables",
      data: {
        particulars: "(i) Audit Fee & other expenses",
        currentYear: 150000,
        previousYear: 125000,
      },
      indent: 1,
    },
    {
      id: "refundable-deposits",
      type: "data",
      parentId: "other-payables",
      data: {
        particulars: "(ii) Refundable Deposits",
        currentYear: 250000,
        previousYear: 220000,
      },
      indent: 1,
    },
    {
      id: "restricted-fund",
      type: "data",
      parentId: "other-payables",
      data: {
        particulars: "(iii) Restricted Fund Balance (Note 12)",
        currentYear: 500000,
        previousYear: 450000,
      },
      indent: 1,
    },
    {
      id: "statutory-remittances",
      type: "data",
      parentId: "other-payables",
      data: {
        particulars:
          "(iiii) Statutory remittances (Contributions to PF and ESIC, Withholding Taxes, GST etc.)",
        currentYear: 225000,
        previousYear: 200000,
      },
      indent: 1,
    },
    {
      id: "sundry-creditors",
      type: "data",
      parentId: "other-payables",
      data: {
        particulars: "(iv) Sundry Creditors, Provisions & Other Payables",
        currentYear: 280000,
        previousYear: 210000,
      },
      indent: 1,
    },

    // Total Current Liabilities
    {
      id: "total",
      type: "grandtotal",
      data: {
        particulars: "Total Current Liabilities",
        currentYear: 1405000,
        previousYear: 1205000,
      },
      bold: true,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <FinancialReport
      title="Note 3 Current liabilities"
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

export default Note3CurrentLiabilitiesPage;
