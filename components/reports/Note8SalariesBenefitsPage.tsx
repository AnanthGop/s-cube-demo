import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note8SalariesBenefitsPageProps {
  onBack?: () => void;
}

const Note8SalariesBenefitsPage: React.FC<Note8SalariesBenefitsPageProps> = ({
  onBack,
}) => {
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
    // Note 8 Salaries, Allowances & Benefits
    {
      id: "note8-header",
      type: "section",
      data: {
        particulars: "Note 8 Salaries, Allowances & Benefits",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "salaries",
      type: "data",
      data: {
        particulars: "Salaries, Allowances, Consultant Fees",
        currentYear: 6850000,
        previousYear: 6469000,
      },
    },
    {
      id: "incentives",
      type: "data",
      data: {
        particulars: "Incentives",
        currentYear: 485000,
        previousYear: 425000,
      },
    },
    {
      id: "pf-esic",
      type: "data",
      data: {
        particulars: "PF & ESIC Contributions",
        currentYear: 825000,
        previousYear: 715000,
      },
    },
    {
      id: "gratuity",
      type: "data",
      data: {
        particulars: "Gratuity",
        currentYear: 285000,
        previousYear: 245000,
      },
    },
    {
      id: "total-salaries",
      type: "total",
      data: {
        particulars: "Total",
        currentYear: 8445000,
        previousYear: 7854000,
      },
      bold: true,
    },
  ];

  return (
    <div className="p-6">
      <FinancialReport
        title="Note 8 Salaries, Allowances & Benefits"
        columns={columns}
        rows={rows}
        exportFilename="Note8_SalariesBenefits"
        onBack={onBack}
        backLabel="Back to Income & Expenditure"
      />
    </div>
  );
};

export default Note8SalariesBenefitsPage;
