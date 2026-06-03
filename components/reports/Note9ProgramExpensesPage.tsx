import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note9ProgramExpensesPageProps {
  onBack?: () => void;
}

const Note9ProgramExpensesPage: React.FC<Note9ProgramExpensesPageProps> = ({
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
    // Note 9 Program expenses
    {
      id: "note9-header",
      type: "section",
      data: {
        particulars: "Note 9 Program expenses",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },
    {
      id: "asset-purchases",
      type: "data",
      data: {
        particulars: "Asset Purchases From Restricted Funds",
        currentYear: 650000,
        previousYear: 520000,
      },
    },
    {
      id: "bank-charges",
      type: "data",
      data: {
        particulars: "Bank Charges",
        currentYear: 38000,
        previousYear: 32000,
      },
    },
    {
      id: "catering",
      type: "data",
      data: {
        particulars: "Catering & Pantry Expenses",
        currentYear: 285000,
        previousYear: 245000,
      },
    },
    {
      id: "centre-setup",
      type: "data",
      data: {
        particulars: "Centre Setup & Shifting Expenses",
        currentYear: 425000,
        previousYear: 380000,
      },
    },
    {
      id: "computer-maintenance",
      type: "data",
      data: {
        particulars: "Computer Maintenance",
        currentYear: 185000,
        previousYear: 165000,
      },
    },
    {
      id: "electricity-water",
      type: "data",
      data: {
        particulars: "Electricity & Water",
        currentYear: 325000,
        previousYear: 285000,
      },
    },
    {
      id: "housekeeping",
      type: "data",
      data: {
        particulars: "Housekeeping, Repairs & Maintenance",
        currentYear: 485000,
        previousYear: 425000,
      },
    },
    {
      id: "interest-unutilised",
      type: "data",
      data: {
        particulars: "Interest on Unutilised Grants",
        currentYear: 95000,
        previousYear: 82000,
      },
    },
    {
      id: "medical",
      type: "data",
      data: {
        particulars: "Medical Expenses",
        currentYear: 125000,
        previousYear: 110000,
      },
    },
    {
      id: "membership",
      type: "data",
      data: {
        particulars: "Membership Fees",
        currentYear: 85000,
        previousYear: 75000,
      },
    },
    {
      id: "miscellaneous",
      type: "data",
      data: {
        particulars: "Miscelleneous Expenses",
        currentYear: 145000,
        previousYear: 125000,
      },
    },
    {
      id: "outreach",
      type: "data",
      data: {
        particulars: "Outreach Expenses",
        currentYear: 685000,
        previousYear: 595000,
      },
    },
    {
      id: "postage",
      type: "data",
      data: {
        particulars: "Postage, Telephone & Internet Expenses",
        currentYear: 225000,
        previousYear: 195000,
      },
    },
    {
      id: "printing",
      type: "data",
      data: {
        particulars: "Printing and stationery",
        currentYear: 185000,
        previousYear: 165000,
      },
    },
    {
      id: "rent",
      type: "data",
      data: {
        particulars: "Rent",
        currentYear: 1850000,
        previousYear: 2009000,
      },
    },
    {
      id: "software-subscription",
      type: "data",
      data: {
        particulars: "Software Subscription",
        currentYear: 385000,
        previousYear: 325000,
      },
    },
    {
      id: "staff-training",
      type: "data",
      data: {
        particulars: "Staff Training, Recruitment & HR Expenses",
        currentYear: 585000,
        previousYear: 495000,
      },
    },
    {
      id: "training-materials",
      type: "data",
      data: {
        particulars: "Training Materials & Other Expenses",
        currentYear: 725000,
        previousYear: 625000,
      },
    },
    {
      id: "training-partner",
      type: "data",
      data: {
        particulars: "Training Partner Expenses",
        currentYear: 1250000,
        previousYear: 1050000,
      },
    },
    {
      id: "training-software",
      type: "data",
      data: {
        particulars:
          "Training Software, Impact Tracking & Psychometric Expenses",
        currentYear: 485000,
        previousYear: 425000,
      },
    },
    {
      id: "travelling",
      type: "data",
      data: {
        particulars: "Travelling and conveyance",
        currentYear: 825000,
        previousYear: 715000,
      },
    },
    {
      id: "total-program",
      type: "total",
      data: {
        particulars: "Total Program Expenses",
        currentYear: 10048000,
        previousYear: 9043000,
      },
      bold: true,
    },
  ];

  return (
    <div className="p-6">
      <FinancialReport
        title="Note 9 Program Expenses"
        columns={columns}
        rows={rows}
        exportFilename="Note9_ProgramExpenses"
        onBack={onBack}
        backLabel="Back to Income & Expenditure"
      />
    </div>
  );
};

export default Note9ProgramExpensesPage;
