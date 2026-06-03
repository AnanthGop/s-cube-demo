import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";
import ReportHeaderFilters from "./ReportHeaderFilters";

interface IncomeExpenditurePageProps {
  onNavigateToNote?: (noteRef: string) => void;
}

const IncomeExpenditurePage: React.FC<IncomeExpenditurePageProps> = ({
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

  // Mock data
  const mockData = {
    donationsGrants: 20800000,
    otherIncome: 3200000,
    salariesBenefits: 8445000,
    programExpenses: 10048000,
    generalAdminExpenses: 790000,
    depreciation: 1575000,
    incomeTax: 940000,
    deferredTax: 50000,

    previous: {
      donationsGrants: 18550000,
      otherIncome: 3750000,
      salariesBenefits: 7854000,
      programExpenses: 9043000,
      generalAdminExpenses: 795000,
      depreciation: 1701000,
      incomeTax: 870000,
      deferredTax: 37000,
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
      label: `For the Year Ended - ${endYear}`,
      align: "right",
      format: "currency",
      width: "20%",
      headerGroup: "INR",
    },
    {
      key: "previousYear",
      label: `For the Year Ended - ${startYear}`,
      align: "right",
      format: "currency",
      width: "20%",
      headerGroup: "INR",
    },
  ];

  const totalRevenueCurrent = mockData.donationsGrants + mockData.otherIncome;
  const totalRevenuePrevious =
    mockData.previous.donationsGrants + mockData.previous.otherIncome;

  const totalExpensesCurrent =
    mockData.salariesBenefits +
    mockData.programExpenses +
    mockData.generalAdminExpenses +
    mockData.depreciation;

  const totalExpensesPrevious =
    mockData.previous.salariesBenefits +
    mockData.previous.programExpenses +
    mockData.previous.generalAdminExpenses +
    mockData.previous.depreciation;

  const excessCurrent = totalRevenueCurrent - totalExpensesCurrent;
  const excessPrevious = totalRevenuePrevious - totalExpensesPrevious;

  const rows: FinancialReportRow[] = [
    // SECTION A: CONTINUING OPERATIONS
    {
      id: "continuing-operations-header",
      type: "header",
      data: {
        particulars: "CONTINUING OPERATIONS",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },

    // 1. Donations & Grants Received
    {
      id: "donations-grants",
      type: "data",
      data: {
        particulars: "Donations & Grants Received",
        noteNo: "6",
        currentYear: mockData.donationsGrants,
        previousYear: mockData.previous.donationsGrants,
      },
      indent: 1,
      noteRef: "6",
    },

    // 2. Other Income
    {
      id: "other-income",
      type: "data",
      data: {
        particulars: "Other Income",
        noteNo: "7",
        currentYear: mockData.otherIncome,
        previousYear: mockData.previous.otherIncome,
      },
      indent: 1,
      noteRef: "7",
    },

    // 3. Total revenue (1-2)
    {
      id: "total-revenue",
      type: "total",
      data: {
        particulars: "Total revenue (1-2)",
        noteNo: "",
        currentYear: totalRevenueCurrent,
        previousYear: totalRevenuePrevious,
      },
      indent: 1,
      bold: true,
    },

    // 4. Expenses
    {
      id: "expenses-header",
      type: "section",
      data: {
        particulars: "Expenses",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      bold: true,
    },

    // (a) Salaries, Allowances & Benefits
    {
      id: "salaries-benefits",
      type: "data",
      data: {
        particulars: "(a) Salaries, Allowances & Benefits",
        noteNo: "8",
        currentYear: mockData.salariesBenefits,
        previousYear: mockData.previous.salariesBenefits,
      },
      indent: 2,
      noteRef: "8",
    },

    // (b) Program Expenses
    {
      id: "program-expenses",
      type: "data",
      data: {
        particulars: "(b) Program Expenses",
        noteNo: "9",
        currentYear: mockData.programExpenses,
        previousYear: mockData.previous.programExpenses,
      },
      indent: 2,
      noteRef: "9",
    },

    // (c) General & Admin Expenses
    {
      id: "general-admin-expenses",
      type: "data",
      data: {
        particulars: "(c) General & Admin Expenses",
        noteNo: "10",
        currentYear: mockData.generalAdminExpenses,
        previousYear: mockData.previous.generalAdminExpenses,
      },
      indent: 2,
      noteRef: "10",
    },

    // (d) Depreciation
    {
      id: "depreciation",
      type: "data",
      data: {
        particulars: "(d) Depreciation",
        noteNo: "13A",
        currentYear: mockData.depreciation,
        previousYear: mockData.previous.depreciation,
      },
      indent: 2,
      noteRef: "13A",
    },

    // Total expenses (4)
    {
      id: "total-expenses",
      type: "total",
      data: {
        particulars: "Total expenses (4)",
        noteNo: "",
        currentYear: totalExpensesCurrent,
        previousYear: totalExpensesPrevious,
      },
      indent: 1,
      bold: true,
    },

    // 5. Excess of Income / (Expenditure) before extraordinary items and tax
    {
      id: "excess-before-tax-1",
      type: "data",
      data: {
        particulars:
          "Excess of Income / (Expenditure) before extraordinary items and tax",
        noteNo: "",
        currentYear: excessCurrent,
        previousYear: excessPrevious,
      },
      indent: 1,
    },

    // 6. Tax expenses
    {
      id: "tax-expenses-1",
      type: "data",
      data: {
        particulars: "Tax expenses",
        noteNo: "",
        currentYear: mockData.incomeTax + mockData.deferredTax,
        previousYear:
          mockData.previous.incomeTax + mockData.previous.deferredTax,
      },
      indent: 1,
    },

    // 7. Excess of Income / (Expenditure) before extraordinary items and tax after tax (5 - 6)
    {
      id: "excess-after-tax",
      type: "data",
      data: {
        particulars:
          "Excess of Income / (Expenditure) before extraordinary items and tax after tax (5 - 6)",
        noteNo: "",
        currentYear: excessCurrent - mockData.incomeTax - mockData.deferredTax,
        previousYear:
          excessPrevious -
          mockData.previous.incomeTax -
          mockData.previous.deferredTax,
      },
      indent: 1,
    },

    // 8. Prior Period Adjustments for Depreciation
    {
      id: "prior-period-adjustments",
      type: "data",
      data: {
        particulars: "Prior Period Adjustments for Depreciation",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 1,
    },

    // 9. Excess of Income / (Expenditure) before tax (7 + 8)
    {
      id: "excess-before-tax-2",
      type: "data",
      data: {
        particulars: "Excess of Income / (Expenditure) before tax (7 + 8)",
        noteNo: "",
        currentYear: excessCurrent - mockData.incomeTax - mockData.deferredTax,
        previousYear:
          excessPrevious -
          mockData.previous.incomeTax -
          mockData.previous.deferredTax,
      },
      indent: 1,
    },

    // 10. Tax expenses
    {
      id: "tax-expenses-section",
      type: "section",
      data: {
        particulars: "Tax expenses:",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
    },
    {
      id: "income-tax",
      type: "data",
      data: {
        particulars: "- Income Tax",
        noteNo: "",
        currentYear: mockData.incomeTax,
        previousYear: mockData.previous.incomeTax,
      },
      indent: 2,
    },
    {
      id: "deferred-tax",
      type: "data",
      data: {
        particulars: "- Deferred Tax",
        noteNo: "",
        currentYear: mockData.deferredTax,
        previousYear: mockData.previous.deferredTax,
      },
      indent: 2,
    },

    // 11. Excess of Income / (Expenditure) from continuing operations (9 -10)
    {
      id: "excess-continuing-operations",
      type: "data",
      data: {
        particulars:
          "Excess of Income / (Expenditure) from continuing operations (9 -10)",
        noteNo: "",
        currentYear: excessCurrent - mockData.incomeTax - mockData.deferredTax,
        previousYear:
          excessPrevious -
          mockData.previous.incomeTax -
          mockData.previous.deferredTax,
      },
      indent: 1,
      bold: true,
    },

    // SECTION B: DISCONTINUING OPERATIONS
    {
      id: "discontinuing-operations-header",
      type: "header",
      data: {
        particulars: "DISCONTINUING OPERATIONS",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },

    // 12. Profit of Income / (Expenditure) from discontinuing operations
    {
      id: "profit-discontinuing-operations",
      type: "data",
      data: {
        particulars:
          "Profit of Income / (Expenditure) from discontinuing operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 1,
    },

    // 13. Excess of Income / (Expenditure) from discontinuing operations (before tax)
    {
      id: "excess-discontinuing-operations",
      type: "data",
      data: {
        particulars:
          "Excess of Income / (Expenditure) from discontinuing operations (before tax)",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 1,
    },

    // SECTION C: TOTAL OPERATIONS
    {
      id: "total-operations-header",
      type: "header",
      data: {
        particulars: "TOTAL OPERATIONS",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      bold: true,
    },

    // 14. Excess of Income / (Expenditure) for the year (11 + 13)
    {
      id: "excess-for-year",
      type: "total",
      data: {
        particulars: "Excess of Income / (Expenditure) for the year (11 + 13)",
        noteNo: "",
        currentYear: excessCurrent,
        previousYear: excessPrevious,
      },
      indent: 1,
      bold: true,
    },

    // 15.i Earnings per share (for RS. 10/- each):
    {
      id: "eps-section-i",
      type: "section",
      data: {
        particulars: "Earnings per share (for RS. 10/- each):",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      bold: true,
    },
    {
      id: "eps-basic-continuing",
      type: "data",
      data: {
        particulars: "(a) Basic",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 2,
    },
    {
      id: "eps-continuing-operations",
      type: "data",
      data: {
        particulars: "(i) Continuing operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
    },
    {
      id: "eps-total-operations-basic",
      type: "data",
      data: {
        particulars: "(ii) Total operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
    },
    {
      id: "eps-diluted",
      type: "data",
      data: {
        particulars: "(b) Diluted",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 2,
    },
    {
      id: "eps-continuing-operations-diluted",
      type: "data",
      data: {
        particulars: "(i) Continuing operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
    },
    {
      id: "eps-total-operations-diluted",
      type: "data",
      data: {
        particulars: "(ii) Total operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
    },

    // 15.ii Earnings per share (excluding extraordinary items) [of Rs. 10/- each]:
    {
      id: "eps-section-ii",
      type: "section",
      data: {
        particulars:
          "Earnings per share (excluding extraordinary items) [of Rs. 10/- each]:",
        noteNo: "",
        currentYear: "",
        previousYear: "",
      },
      indent: 1,
      bold: true,
    },
    {
      id: "eps-basic-excluding",
      type: "data",
      data: {
        particulars: "(a) Basic",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 2,
    },
    {
      id: "eps-continuing-operations-excluding",
      type: "data",
      data: {
        particulars: "(i) Continuing operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
    },
    {
      id: "eps-total-operations-excluding",
      type: "data",
      data: {
        particulars: "(ii) Total operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
    },
    {
      id: "eps-diluted-excluding",
      type: "data",
      data: {
        particulars: "(b) Diluted",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 2,
    },
    {
      id: "eps-continuing-operations-diluted-excluding",
      type: "data",
      data: {
        particulars: "(i) Continuing operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
    },
    {
      id: "eps-total-operations-diluted-excluding",
      type: "data",
      data: {
        particulars: "(ii) Total operations",
        noteNo: "",
        currentYear: 0,
        previousYear: 0,
      },
      indent: 3,
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
      title={`Statement of Income and Expenditure for the year ended 31st March ${endYear}`}
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

export default IncomeExpenditurePage;
