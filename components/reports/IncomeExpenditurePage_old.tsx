import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface IncomeExpenditurePageProps {
  onNavigateToNote?: (noteRef: string) => void;
}

const IncomeExpenditurePage: React.FC<IncomeExpenditurePageProps> = ({
  onNavigateToNote,
}) => {
  // Generate mock data with proper reconciliation
  const generateMockData = () => {
    // Income
    const donationsGrants = 8500000;
    const programFees = 1250000;
    const interestIncome = 185000;
    const otherIncome = 95000;
    const totalIncome =
      donationsGrants + programFees + interestIncome + otherIncome;

    // Expenditure
    const salariesWages = 4500000;
    const programExpenses = 2800000;
    const rentUtilities = 650000;
    const travelConveyance = 425000;
    const professionallFees = 380000;
    const officeExpenses = 285000;
    const depreciation = 315000;
    const bankCharges = 45000;
    const auditFees = 55000;
    const printingStationery = 125000;
    const otherExpenses = 185000;
    const totalExpenditure =
      salariesWages +
      programExpenses +
      rentUtilities +
      travelConveyance +
      professionallFees +
      officeExpenses +
      depreciation +
      bankCharges +
      auditFees +
      printingStationery +
      otherExpenses;

    const surplusDeficit = totalIncome - totalExpenditure;

    return {
      income: {
        donationsGrants,
        programFees,
        interestIncome,
        otherIncome,
        total: totalIncome,
      },
      expenditure: {
        salariesWages,
        programExpenses,
        rentUtilities,
        travelConveyance,
        professionallFees,
        officeExpenses,
        depreciation,
        bankCharges,
        auditFees,
        printingStationery,
        otherExpenses,
        total: totalExpenditure,
      },
      surplusDeficit,
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
      label: "For the Year Ended 31.03.2025",
      align: "right",
      format: "currency",
      width: "20%",
    },
    {
      key: "previousYear",
      label: "For the Year Ended 31.03.2024",
      align: "right",
      format: "currency",
      width: "20%",
    },
  ];

  const rows: FinancialReportRow[] = [
    // INCOME
    {
      id: "income-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "INCOME",
        currentYear: "",
        previousYear: "",
      },
    },
    {
      id: "donations-grants",
      type: "data",
      parentId: "income-header",
      data: {
        particulars: "Donations & Grants Received",
        currentYear: mockData.income.donationsGrants,
        previousYear: mockData.income.donationsGrants * 0.88,
      },
      indent: 1,
      noteRef: "6",
    },
    {
      id: "other-income",
      type: "data",
      parentId: "income-header",
      data: {
        particulars: "Other Income",
        currentYear:
          mockData.income.otherIncome +
          mockData.income.programFees +
          mockData.income.interestIncome,
        previousYear:
          mockData.income.otherIncome * 0.78 +
          mockData.income.programFees * 0.92 +
          mockData.income.interestIncome * 1.05,
      },
      indent: 1,
      noteRef: "7",
    },
    {
      id: "total-revenue",
      type: "total",
      parentId: "income-header",
      data: {
        particulars: "Total revenue (1+2)",
        currentYear: mockData.income.total,
        previousYear: mockData.income.total * 0.89,
      },
      bold: true,
      indent: 1,
    },

    // EXPENDITURE
    {
      id: "expenditure-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "Expenses",
        currentYear: "",
        previousYear: "",
      },
    },
    {
      id: "salaries-benefits",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "(a) Salaries, Allowances & Benefits",
        currentYear: mockData.expenditure.salariesWages,
        previousYear: mockData.expenditure.salariesWages * 0.93,
      },
      indent: 1,
      noteRef: "8",
    },
    {
      id: "program-expenses",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "(b) Program Expenses",
        currentYear: mockData.expenditure.programExpenses,
        previousYear: mockData.expenditure.programExpenses * 0.85,
      },
      indent: 1,
      noteRef: "9",
    },
    {
      id: "general-admin",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "(c) General & Admin Expenses",
        currentYear:
          mockData.expenditure.professionallFees +
          mockData.expenditure.officeExpenses +
          mockData.expenditure.auditFees +
          mockData.expenditure.bankCharges +
          mockData.expenditure.printingStationery +
          mockData.expenditure.otherExpenses,
        previousYear:
          mockData.expenditure.professionallFees * 1.15 +
          mockData.expenditure.officeExpenses * 0.88 +
          mockData.expenditure.auditFees * 0.95 +
          mockData.expenditure.bankCharges * 1.1 +
          mockData.expenditure.printingStationery * 0.82 +
          mockData.expenditure.otherExpenses * 0.76,
      },
      indent: 1,
      noteRef: "10",
    },
    {
      id: "depreciation",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "(d) Depreciation",
        currentYear: mockData.expenditure.depreciation,
        previousYear: mockData.expenditure.depreciation * 1.08,
      },
      indent: 1,
      noteRef: "13A",
    },
    {
      id: "total-expenditure",
      type: "total",
      parentId: "expenditure-header",
      data: {
        particulars: "Total Expenditure (B)",
        currentYear: mockData.expenditure.total,
        previousYear: mockData.expenditure.total * 0.9,
      },
      bold: true,
      indent: 1,
    },

    // SURPLUS/DEFICIT
    {
      id: "surplus-deficit",
      type: "grandtotal",
      data: {
        particulars:
          mockData.surplusDeficit >= 0 ?
            "SURPLUS FOR THE YEAR (A - B)"
          : "DEFICIT FOR THE YEAR (A - B)",
        currentYear: mockData.surplusDeficit,
        previousYear: mockData.surplusDeficit * 0.85,
      },
      bold: true,
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
      title="Income & Expenditure"
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

export default IncomeExpenditurePage;
