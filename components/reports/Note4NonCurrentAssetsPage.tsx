import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note4NonCurrentAssetsPageProps {
  onBack?: () => void;
}

const Note4NonCurrentAssetsPage: React.FC<Note4NonCurrentAssetsPageProps> = ({
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
    // Note 4 Non-Current Assets
    {
      id: "note4-header",
      type: "section",
      data: {
        particulars: "Note 4 Non-Current Assets",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "fixed-deposits",
      type: "data",
      data: {
        particulars:
          "(a) Fixed Deposits (Scheduled Banks) with maturity > 1 year",
        currentYear: 2500000,
        previousYear: 2000000,
      },
    },
    {
      id: "total-non-current",
      type: "total",
      data: {
        particulars: "Total Non Current Assets",
        currentYear: 2500000,
        previousYear: 2000000,
      },
      bold: true,
    },
  ];

  return (
    <div className="p-6">
      <FinancialReport
        title="Note 4 Non-Current Assets"
        columns={columns}
        rows={rows}
        exportFilename="Note4_NonCurrentAssets"
        onBack={onBack}
        backLabel="Back to Balance Sheet"
      />
    </div>
  );
};

export default Note4NonCurrentAssetsPage;
