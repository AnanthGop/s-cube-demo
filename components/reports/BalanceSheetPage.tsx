import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";
import ReportHeaderFilters from "./ReportHeaderFilters";

interface BalanceSheetPageProps {
  onNavigateToNote?: (noteRef: string) => void;
}

const BalanceSheetPage: React.FC<BalanceSheetPageProps> = ({
  onNavigateToNote,
}) => {
  const financialYearOptions = ["2024-2025", "2023-2024", "2022-2023"];
  const bookOptions = ["LC", "FC", "Consolidated"];
  const [selectedFinancialYear, setSelectedFinancialYear] = React.useState(
    financialYearOptions[0],
  );
  const [selectedBook, setSelectedBook] = React.useState(bookOptions[0]);
  const [startYear, endYear] = selectedFinancialYear
    .split("-")
    .map((year) => Number(year));

  // Mock data with balanced totals
  const mockData = {
    // EQUITY AND LIABILITIES
    shareCapital: 750000,
    reservesAndEarmarked: 10790000, // Adjusted to balance with assets
    nonCurrentLiabilities: 0,
    currentLiabilities: 1405000,

    // ASSETS
    fixedAssets: 3200000,
    nonCurrentAssets: 2500000,
    currentAssets: 7245000,

    // Previous year (with similar proportions)
    previous: {
      shareCapital: 750000,
      reservesAndEarmarked: 8905000, // Adjusted to balance with assets
      nonCurrentLiabilities: 0,
      currentLiabilities: 1205000,

      fixedAssets: 2850000,
      nonCurrentAssets: 2000000,
      currentAssets: 6010000,
    },
  };

  const columns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "50%",
    },
    {
      key: "noteNo",
      label: "Note No.",
      align: "center",
      width: "10%",
    },
    {
      key: "currentYear",
      label: `As at 31 March, ${endYear}`,
      align: "right",
      format: "currency",
      width: "20%",
      headerGroup: "INR",
    },
    {
      key: "previousYear",
      label: `As at 31 March, ${startYear}`,
      align: "right",
      format: "currency",
      width: "20%",
      headerGroup: "INR",
    },
  ];

  const totalEquityLiabilitiesCurrent =
    mockData.shareCapital +
    mockData.reservesAndEarmarked +
    mockData.nonCurrentLiabilities +
    mockData.currentLiabilities;

  const totalEquityLiabilitiesPrevious =
    mockData.previous.shareCapital +
    mockData.previous.reservesAndEarmarked +
    mockData.previous.nonCurrentLiabilities +
    mockData.previous.currentLiabilities;

  const totalAssetsCurrent =
    mockData.fixedAssets + mockData.nonCurrentAssets + mockData.currentAssets;

  const totalAssetsPrevious =
    mockData.previous.fixedAssets +
    mockData.previous.nonCurrentAssets +
    mockData.previous.currentAssets;

  const rows: FinancialReportRow[] = [
    // SECTION A: EQUITY AND LIABILITIES
    {
      id: "equity-liabilities-header",
      type: "header",
      data: {
        particulars: "EQUITY AND LIABILITIES",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },

    // 1. Shareholders' funds
    {
      id: "shareholders-funds",
      type: "subsection",
      data: {
        particulars: "Shareholders' funds",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
      indent: 1,
    },
    {
      id: "share-capital",
      type: "data",
      data: {
        particulars: "(a) Share capital",
        noteNo: "1",
        currentYear: mockData.shareCapital,
        previousYear: mockData.previous.shareCapital,
      },
      indent: 2,
      noteRef: "1",
    },

    // 2. Reserves and Earmarked Funds
    {
      id: "reserves-earmarked",
      type: "data",
      data: {
        particulars: "Reserves and Earmarked Funds",
        noteNo: "2",
        currentYear: mockData.reservesAndEarmarked,
        previousYear: mockData.previous.reservesAndEarmarked,
      },
      indent: 1,
      noteRef: "2",
    },

    // 3. Non-current liabilities
    {
      id: "non-current-liabilities",
      type: "data",
      data: {
        particulars: "Non-current liabilities",
        noteNo: "",
        currentYear: mockData.nonCurrentLiabilities,
        previousYear: mockData.previous.nonCurrentLiabilities,
      },
      indent: 1,
    },

    // 4. Current liabilities
    {
      id: "current-liabilities",
      type: "data",
      data: {
        particulars: "Current liabilities",
        noteNo: "3",
        currentYear: mockData.currentLiabilities,
        previousYear: mockData.previous.currentLiabilities,
      },
      indent: 1,
      noteRef: "3",
    },

    // TOTAL EQUITY AND LIABILITIES
    {
      id: "total-equity-liabilities",
      type: "total",
      data: {
        particulars: "TOTAL",
        noteNo: "",
        currentYear: totalEquityLiabilitiesCurrent,
        previousYear: totalEquityLiabilitiesPrevious,
      },
      bold: true,
      indent: 1,
    },

    // SECTION B: ASSETS
    {
      id: "assets-header",
      type: "header",
      data: {
        particulars: "ASSETS",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },

    // 1. Fixed Assets
    {
      id: "fixed-assets",
      type: "data",
      data: {
        particulars: "Fixed Assets",
        noteNo: "13&13A",
        currentYear: mockData.fixedAssets,
        previousYear: mockData.previous.fixedAssets,
      },
      indent: 1,
      noteRef: "13&13A",
    },

    // 2. Non-current assets
    {
      id: "non-current-assets",
      type: "data",
      data: {
        particulars: "Non-current assets",
        noteNo: "4",
        currentYear: mockData.nonCurrentAssets,
        previousYear: mockData.previous.nonCurrentAssets,
      },
      indent: 1,
      noteRef: "4",
    },

    // 3. Current assets
    {
      id: "current-assets",
      type: "data",
      data: {
        particulars: "Current assets",
        noteNo: "5",
        currentYear: mockData.currentAssets,
        previousYear: mockData.previous.currentAssets,
      },
      indent: 1,
      noteRef: "5",
    },

    // TOTAL ASSETS
    {
      id: "total-assets",
      type: "total",
      data: {
        particulars: "TOTAL",
        noteNo: "",
        currentYear: totalAssetsCurrent,
        previousYear: totalAssetsPrevious,
      },
      bold: true,
      indent: 1,
    },

    // Footer note
    {
      id: "notes-reference",
      type: "section",
      data: {
        particulars:
          "See accompanying notes forming part of the financial statements",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
    },
  ];

  const handleNoteClick = (noteRef: string) => {
    if (onNavigateToNote) {
      onNavigateToNote(noteRef);
    } else {
      alert(`Navigate to Note ${noteRef}`);
    }
  };

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <FinancialReport
      title={`Balance Sheet as at 31st March, ${endYear}`}
      subtitle={`Financial Year ${selectedFinancialYear} | Books of Accounts: ${selectedBook}`}
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
      showNoteColumn={false}
      onNoteClick={handleNoteClick}
      headerControls={
        <ReportHeaderFilters
          financialYearOptions={financialYearOptions}
          selectedFinancialYear={selectedFinancialYear}
          onFinancialYearChange={setSelectedFinancialYear}
          bookOptions={bookOptions}
          selectedBook={selectedBook}
          onBookChange={setSelectedBook}
        />
      }
    />
  );
};

export default BalanceSheetPage;
