import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note6DonationsGrantsPageProps {
  onBack?: () => void;
}

const Note6DonationsGrantsPage: React.FC<Note6DonationsGrantsPageProps> = ({
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
    // Note 6 Donations & Grants
    {
      id: "note6-header",
      type: "section",
      data: {
        particulars: "Note 6  Donations & Grants",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "grants-csr",
      type: "data",
      data: {
        particulars: "Grants - CSR",
        currentYear: 13200000,
        previousYear: 11640000,
      },
    },
    {
      id: "grants-others",
      type: "data",
      data: {
        particulars: "Grants - Others",
        currentYear: 4600000,
        previousYear: 4100000,
      },
    },
    {
      id: "donations",
      type: "data",
      data: {
        particulars: "Donations",
        currentYear: 2300000,
        previousYear: 2100000,
      },
    },
    {
      id: "donations-anonymous",
      type: "data",
      data: {
        particulars: "Donations - Anonymous",
        currentYear: 700000,
        previousYear: 710000,
      },
    },
    {
      id: "total-donations-grants",
      type: "total",
      data: {
        particulars: "Total Donations & Grants",
        currentYear: 20800000,
        previousYear: 18550000,
      },
      bold: true,
    },
  ];

  return (
    <div className="p-6">
      <FinancialReport
        title="Note 6 Donations & Grants"
        columns={columns}
        rows={rows}
        exportFilename="Note6_DonationsGrants"
        onBack={onBack}
        backLabel="Back to Income & Expenditure"
      />
    </div>
  );
};

export default Note6DonationsGrantsPage;
