import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface BalanceSheetPageProps {
  onNavigateToNote?: (noteRef: string) => void;
}

const BalanceSheetPage: React.FC<BalanceSheetPageProps> = ({
  onNavigateToNote,
}) => {
  // Generate mock data with proper reconciliation
  const generateMockData = () => {
    // Assets
    const cashInHand = 125000;
    const bankBalances = 3450000;
    const shortTermLoans = 850000;
    const receivables = 1250000;
    const totalCurrentAssets =
      cashInHand + bankBalances + shortTermLoans + receivables;

    const landAndBuilding = 5000000;
    const officeEquipment = 850000;
    const furnitureFixtures = 450000;
    const computers = 380000;
    const lessDepreciation = 950000;
    const totalFixedAssets =
      landAndBuilding +
      officeEquipment +
      furnitureFixtures +
      computers -
      lessDepreciation;

    const totalAssets = totalCurrentAssets + totalFixedAssets;

    // Liabilities
    const accountsPayable = 680000;
    const advancesReceived = 450000;
    const provisionsExpenses = 275000;
    const totalCurrentLiabilities =
      accountsPayable + advancesReceived + provisionsExpenses;

    const longTermLoans = 1200000;
    const totalLiabilities = totalCurrentLiabilities + longTermLoans;

    // Funds - Calculate to balance with Assets
    const corpusFund = 3500000;
    const restrictedFunds = 1850000;
    const generalFund = 725000;
    const currentYearSurplus =
      totalAssets -
      totalLiabilities -
      corpusFund -
      restrictedFunds -
      generalFund;
    const totalFunds =
      corpusFund + restrictedFunds + generalFund + currentYearSurplus;

    // Verify: Total Assets = Total Liabilities + Total Funds
    const totalLiabilitiesAndFunds = totalLiabilities + totalFunds;

    return {
      assets: {
        currentAssets: {
          cashInHand,
          bankBalances,
          shortTermLoans,
          receivables,
          total: totalCurrentAssets,
        },
        fixedAssets: {
          landAndBuilding,
          officeEquipment,
          furnitureFixtures,
          computers,
          lessDepreciation,
          total: totalFixedAssets,
        },
        total: totalAssets,
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable,
          advancesReceived,
          provisionsExpenses,
          total: totalCurrentLiabilities,
        },
        longTermLoans,
        total: totalLiabilities,
      },
      funds: {
        corpusFund,
        restrictedFunds,
        generalFund,
        currentYearSurplus,
        total: totalFunds,
      },
      totalLiabilitiesAndFunds,
    };
  };

  const mockData = generateMockData();

  const columns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "60%",
    },
    {
      key: "currentYear",
      label: "As at 31.03.2025",
      align: "right",
      format: "currency",
      width: "20%",
    },
    {
      key: "previousYear",
      label: "As at 31.03.2024",
      align: "right",
      format: "currency",
      width: "20%",
    },
  ];

  const rows: FinancialReportRow[] = [
    // ASSETS
    {
      id: "assets-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "ASSETS",
        currentYear: "",
        previousYear: "",
      },
    },

    // Fixed Assets
    {
      id: "fixed-assets",
      type: "section",
      collapsible: true,
      parentId: "assets-header",
      data: {
        particulars: "Fixed Assets",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      noteRef: "13&13A",
    },

    // Non-current Assets
    {
      id: "non-current-assets",
      type: "section",
      collapsible: true,
      parentId: "assets-header",
      data: {
        particulars: "Non-current assets",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      noteRef: "4",
    },

    // Current Assets
    {
      id: "current-assets",
      type: "section",
      collapsible: true,
      parentId: "assets-header",
      data: {
        particulars: "Current assets",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      noteRef: "5",
    },
    {
      id: "cash-in-hand",
      type: "data",
      parentId: "current-assets",
      data: {
        particulars: "Cash in Hand",
        currentYear: mockData.assets.currentAssets.cashInHand,
        previousYear: mockData.assets.currentAssets.cashInHand * 0.85,
      },
      indent: 2,
    },
    {
      id: "bank-balances",
      type: "data",
      parentId: "current-assets",
      data: {
        particulars: "Bank Balances",
        currentYear: mockData.assets.currentAssets.bankBalances,
        previousYear: mockData.assets.currentAssets.bankBalances * 0.78,
      },
      indent: 2,
    },
    {
      id: "short-term-loans",
      type: "data",
      parentId: "current-assets",
      data: {
        particulars: "Short-term Loans and Advances",
        currentYear: mockData.assets.currentAssets.shortTermLoans,
        previousYear: mockData.assets.currentAssets.shortTermLoans * 0.92,
      },
      indent: 2,
    },
    {
      id: "receivables",
      type: "data",
      parentId: "current-assets",
      data: {
        particulars: "Receivables",
        currentYear: mockData.assets.currentAssets.receivables,
        previousYear: mockData.assets.currentAssets.receivables * 0.88,
      },
      indent: 2,
    },
    {
      id: "total-current-assets",
      type: "total",
      parentId: "current-assets",
      data: {
        particulars: "Total Current Assets",
        currentYear: mockData.assets.currentAssets.total,
        previousYear: mockData.assets.currentAssets.total * 0.82,
      },
      indent: 2,
      bold: true,
    },

    {
      id: "land-building",
      type: "data",
      parentId: "fixed-assets",
      data: {
        particulars: "Land and Building",
        currentYear: mockData.assets.fixedAssets.landAndBuilding,
        previousYear: mockData.assets.fixedAssets.landAndBuilding,
      },
      indent: 2,
    },
    {
      id: "office-equipment",
      type: "data",
      parentId: "fixed-assets",
      data: {
        particulars: "Office Equipment",
        currentYear: mockData.assets.fixedAssets.officeEquipment,
        previousYear: mockData.assets.fixedAssets.officeEquipment * 0.95,
      },
      indent: 2,
    },
    {
      id: "furniture-fixtures",
      type: "data",
      parentId: "fixed-assets",
      data: {
        particulars: "Furniture and Fixtures",
        currentYear: mockData.assets.fixedAssets.furnitureFixtures,
        previousYear: mockData.assets.fixedAssets.furnitureFixtures * 0.9,
      },
      indent: 2,
    },
    {
      id: "computers",
      type: "data",
      parentId: "fixed-assets",
      data: {
        particulars: "Computers",
        currentYear: mockData.assets.fixedAssets.computers,
        previousYear: mockData.assets.fixedAssets.computers * 0.88,
      },
      indent: 2,
    },
    {
      id: "less-depreciation",
      type: "data",
      parentId: "fixed-assets",
      data: {
        particulars: "Less: Accumulated Depreciation",
        currentYear: -mockData.assets.fixedAssets.lessDepreciation,
        previousYear: -mockData.assets.fixedAssets.lessDepreciation * 0.75,
      },
      indent: 2,
    },
    {
      id: "total-fixed-assets",
      type: "total",
      parentId: "fixed-assets",
      data: {
        particulars: "Total Fixed Assets",
        currentYear: mockData.assets.fixedAssets.total,
        previousYear: mockData.assets.fixedAssets.total * 0.96,
      },
      indent: 2,
      bold: true,
    },

    // Total Assets
    {
      id: "total-assets",
      type: "grandtotal",
      parentId: "assets-header",
      data: {
        particulars: "TOTAL ASSETS",
        currentYear: mockData.assets.total,
        previousYear: mockData.assets.total * 0.87,
      },
      bold: true,
      indent: 1,
    },

    // EQUITY AND LIABILITIES
    {
      id: "equity-liabilities-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "EQUITY AND LIABILITIES",
        currentYear: "",
        previousYear: "",
      },
    },

    // Shareholders' funds
    {
      id: "shareholders-funds",
      type: "subsection",
      collapsible: true,
      parentId: "equity-liabilities-header",
      data: {
        particulars: "Shareholders' funds",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
    },
    {
      id: "share-capital",
      type: "data",
      parentId: "shareholders-funds",
      data: {
        particulars: "(a) Share capital",
        currentYear: 750000,
        previousYear: 750000,
      },
      indent: 2,
      noteRef: "1",
    },

    // Reserves and Earmarked Funds
    {
      id: "reserves-funds",
      type: "section",
      collapsible: true,
      parentId: "equity-liabilities-header",
      data: {
        particulars: "Reserves and Earmarked Funds",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      noteRef: "2",
    },

    // Non-current liabilities
    {
      id: "non-current-liabilities",
      type: "section",
      collapsible: true,
      parentId: "equity-liabilities-header",
      data: {
        particulars: "Non-current liabilities",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
    },

    // Current Liabilities
    {
      id: "current-liabilities",
      type: "section",
      collapsible: true,
      parentId: "equity-liabilities-header",
      data: {
        particulars: "Current liabilities",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      noteRef: "3",
    },
    {
      id: "accounts-payable",
      type: "data",
      parentId: "current-liabilities",
      data: {
        particulars: "Accounts Payable",
        currentYear: mockData.liabilities.currentLiabilities.accountsPayable,
        previousYear:
          mockData.liabilities.currentLiabilities.accountsPayable * 0.95,
      },
      indent: 2,
    },
    {
      id: "advances-received",
      type: "data",
      parentId: "current-liabilities",
      data: {
        particulars: "Advances Received",
        currentYear: mockData.liabilities.currentLiabilities.advancesReceived,
        previousYear:
          mockData.liabilities.currentLiabilities.advancesReceived * 0.88,
      },
      indent: 2,
    },
    {
      id: "provisions",
      type: "data",
      parentId: "current-liabilities",
      data: {
        particulars: "Provisions for Expenses",
        currentYear: mockData.liabilities.currentLiabilities.provisionsExpenses,
        previousYear:
          mockData.liabilities.currentLiabilities.provisionsExpenses * 0.92,
      },
      indent: 2,
    },
    {
      id: "total-current-liabilities",
      type: "total",
      parentId: "current-liabilities",
      data: {
        particulars: "Total Current Liabilities",
        currentYear: mockData.liabilities.currentLiabilities.total,
        previousYear: mockData.liabilities.currentLiabilities.total * 0.92,
      },
      indent: 2,
      bold: true,
    },

    // Long-term Loans
    {
      id: "long-term-loans",
      type: "data",
      parentId: "liabilities-header",
      data: {
        particulars: "Long-term Loans",
        currentYear: mockData.liabilities.longTermLoans,
        previousYear: mockData.liabilities.longTermLoans * 1.15,
      },
      indent: 1,
    },

    // Total Liabilities
    {
      id: "total-equity-liabilities",
      type: "grandtotal",
      parentId: "equity-liabilities-header",
      data: {
        particulars: "TOTAL",
        currentYear: mockData.totalLiabilitiesAndFunds,
        previousYear: mockData.totalLiabilitiesAndFunds * 0.87,
      },
      bold: true,
      indent: 1,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  const handleNoteClick = (noteRef: string) => {
    if (onNavigateToNote) {
      onNavigateToNote(noteRef);
    } else {
      // Fallback: Show which note was clicked
      alert(`Navigate to Note ${noteRef}`);
    }
  };

  return (
    <FinancialReport
      title="Balance Sheet"
      subtitle="For the Financial Year 2024-2025"
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
      showNoteColumn={true}
      onNoteClick={handleNoteClick}
    />
  );
};

export default BalanceSheetPage;
