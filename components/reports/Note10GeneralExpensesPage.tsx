import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note10GeneralExpensesPageProps {
  onBack?: () => void;
}

const Note10GeneralExpensesPage: React.FC<Note10GeneralExpensesPageProps> = ({
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
    // Note 10 General Expenses
    {
      id: "note10-header",
      type: "section",
      data: {
        particulars: "Note 10 General Expenses",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "auditor-remuneration",
      type: "data",
      data: {
        particulars: "Remuneration to Auditors - Audit Fees",
        currentYear: 0,
        previousYear: 0,
      },
    },
    {
      id: "audit-fees",
      type: "data",
      data: {
        particulars: "(i) Audit Fees",
        currentYear: 185000,
        previousYear: 165000,
      },
      indent: 1,
    },
    {
      id: "other-services",
      type: "data",
      data: {
        particulars: "(ii) Other Services",
        currentYear: 85000,
        previousYear: 75000,
      },
      indent: 1,
    },
    {
      id: "loss-on-sale",
      type: "data",
      data: {
        particulars: "Loss on sale / discarding of asset",
        currentYear: 45000,
        previousYear: 32000,
      },
    },
    {
      id: "professional-charges",
      type: "data",
      data: {
        particulars: "Professional Charges",
        currentYear: 285000,
        previousYear: 366000,
      },
    },
    {
      id: "rates-taxes",
      type: "data",
      data: {
        particulars: "Rates & Taxes",
        currentYear: 125000,
        previousYear: 105000,
      },
    },
    {
      id: "sundry-balances",
      type: "data",
      data: {
        particulars: "Sundry Balances w/off",
        currentYear: 65000,
        previousYear: 52000,
      },
    },
    {
      id: "total-general",
      type: "total",
      data: {
        particulars: "Total General Expenses",
        currentYear: 790000,
        previousYear: 795000,
      },
      bold: true,
    },
  ];

  return (
    <div className="p-6">
      <FinancialReport
        title="Note 10 General Expenses"
        columns={columns}
        rows={rows}
        exportFilename="Note10_GeneralExpenses"
        onBack={onBack}
        backLabel="Back to Income & Expenditure"
      />
    </div>
  );
};

export default Note10GeneralExpensesPage;
