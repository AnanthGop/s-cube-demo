import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note7OtherIncomePageProps {
  onBack?: () => void;
}

const Note7OtherIncomePage: React.FC<Note7OtherIncomePageProps> = ({
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
    // Note 7 Other Income
    {
      id: "note7-header",
      type: "section",
      data: {
        particulars: "Note 7 Other income",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "interest-sb-fd",
      type: "data",
      data: {
        particulars: "( a ) Interest on SB & FD Accounts (Note 25)",
        currentYear: 485000,
        previousYear: 425000,
      },
    },
    {
      id: "interest-tax-refund",
      type: "data",
      data: {
        particulars: "(b) Interest on Income Tax Refund",
        currentYear: 65000,
        previousYear: 58000,
      },
    },
    {
      id: "miscellaneous-receipts",
      type: "data",
      data: {
        particulars: "( c ) Miscelleneous Receipts",
        currentYear: 185000,
        previousYear: 135000,
      },
    },
    {
      id: "program-income",
      type: "section",
      collapsible: true,
      data: {
        particulars: "(d) Program Income",
        currentYear: "",
        previousYear: "",
      },
    },
    {
      id: "placement-fees",
      type: "data",
      parentId: "program-income",
      data: {
        particulars: "1. Training Fees",
        currentYear: 1250000,
        previousYear: 1871000,
      },
      indent: 1,
    },

    {
      id: "other-training-fees",
      type: "data",
      parentId: "program-income",
      data: {
        particulars: "2. Other Program Income",
        currentYear: 530000,
        previousYear: 511000,
      },
      indent: 1,
    },
    {
      id: "total-other-income",
      type: "total",
      data: {
        particulars: "Total Other Income",
        currentYear: 3200000,
        previousYear: 3750000,
      },
      bold: true,
    },
  ];

  return (
    <div className="p-6">
      <FinancialReport
        title="Note 7 Other Income"
        columns={columns}
        rows={rows}
        exportFilename="Note7_OtherIncome"
        onBack={onBack}
        backLabel="Back to Income & Expenditure"
      />
    </div>
  );
};

export default Note7OtherIncomePage;
