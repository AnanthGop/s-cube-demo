import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note5CurrentAssetsPageProps {
  onBack?: () => void;
}

const Note5CurrentAssetsPage: React.FC<Note5CurrentAssetsPageProps> = ({
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
    // Note 5 Current Assets
    {
      id: "note5-header",
      type: "section",
      data: {
        particulars: "Note 5 Current Assets",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    // (A) Cash and cash equivalents
    {
      id: "cash-equivalents",
      type: "section",
      collapsible: true,
      data: {
        particulars: "(A) Cash and cash equivalents",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "cash-on-hand",
      type: "data",
      parentId: "cash-equivalents",
      data: {
        particulars: "(a) Cash on hand",
        currentYear: 125000,
        previousYear: 95000,
      },
      indent: 1,
    },
    {
      id: "savings-accounts",
      type: "data",
      parentId: "cash-equivalents",
      data: {
        particulars: "(b) Savings accounts (Scheduled Banks)",
        currentYear: 3450000,
        previousYear: 2850000,
      },
      indent: 1,
    },
    {
      id: "fd-less-3months",
      type: "data",
      parentId: "cash-equivalents",
      data: {
        particulars:
          "(c) Fixed Deposits (Scheduled Banks) with maturity < 3 months",
        currentYear: 1500000,
        previousYear: 1200000,
      },
      indent: 1,
    },
    {
      id: "total-a",
      type: "total",
      parentId: "cash-equivalents",
      data: {
        particulars: "Total (A)",
        currentYear: 5075000,
        previousYear: 4145000,
      },
      bold: true,
      indent: 1,
    },
    // (B) Short-term loans and advances, Deposits etc
    {
      id: "short-term-loans",
      type: "section",
      collapsible: true,
      data: {
        particulars: "(B) Short-term loans and advances, Deposits etc",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "balances-govt",
      type: "section",
      collapsible: true,
      parentId: "short-term-loans",
      data: {
        particulars: "(a) Balances with government authorities",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
    },
    {
      id: "tds-receivable",
      type: "data",
      parentId: "balances-govt",
      data: {
        particulars: "(i) TDS receivable, Input taxes etc",
        currentYear: 285000,
        previousYear: 245000,
      },
      indent: 2,
    },
    {
      id: "balances-others",
      type: "section",
      collapsible: true,
      parentId: "short-term-loans",
      data: {
        particulars: "(b) Balances with others",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
    },
    {
      id: "advance-creditors",
      type: "data",
      parentId: "balances-others",
      data: {
        particulars: "(i) Advance to creditors",
        currentYear: 185000,
        previousYear: 150000,
      },
      indent: 2,
    },
    {
      id: "fd-5-to-12-months",
      type: "data",
      parentId: "balances-others",
      data: {
        particulars:
          "(ii) Fixed Deposits (Scheduled Banks) with maturity > 5 months and < 12 months",
        currentYear: 800000,
        previousYear: 650000,
      },
      indent: 2,
    },
    {
      id: "rent-deposits",
      type: "data",
      parentId: "balances-others",
      data: {
        particulars: "(iii) Rent Deposits",
        currentYear: 450000,
        previousYear: 450000,
      },
      indent: 2,
    },
    {
      id: "staff-advance",
      type: "data",
      parentId: "balances-others",
      data: {
        particulars: "(iv) Staff Advance",
        currentYear: 125000,
        previousYear: 95000,
      },
      indent: 2,
    },
    {
      id: "total-b",
      type: "total",
      parentId: "short-term-loans",
      data: {
        particulars: "Total (B)",
        currentYear: 1845000,
        previousYear: 1590000,
      },
      bold: true,
      indent: 1,
    },
    // (c) Other Amounts Receivable
    {
      id: "other-receivable",
      type: "data",
      data: {
        particulars: "(c) Other Amounts Receivable",
        currentYear: 325000,
        previousYear: 275000,
      },
    },
    {
      id: "total-current-assets",
      type: "total",
      data: {
        particulars: "Total Current Assets (A+B)",
        currentYear: 7245000,
        previousYear: 6010000,
      },
      bold: true,
    },
  ];

  return (
    <div className="p-6">
      <FinancialReport
        title="Note 5 Current Assets"
        columns={columns}
        rows={rows}
        exportFilename="Note5_CurrentAssets"
        onBack={onBack}
        backLabel="Back to Balance Sheet"
      />
    </div>
  );
};

export default Note5CurrentAssetsPage;
