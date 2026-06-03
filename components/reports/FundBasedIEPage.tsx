import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

const FundBasedIEPage: React.FC = () => {
  // Generate mock data
  const generateMockData = () => {
    // Define funds
    const localFund = {
      income: {
        donations: 2500000,
        fees: 850000,
        interest: 125000,
        other: 55000,
      },
      expenditure: {
        salaries: 1800000,
        programs: 950000,
        administration: 420000,
        other: 285000,
      },
    };

    const restrictedFund = {
      income: {
        grants: 4800000,
        interest: 45000,
        other: 25000,
      },
      expenditure: {
        salaries: 2200000,
        programs: 1650000,
        administration: 380000,
        other: 475000,
      },
    };

    const corpusFund = {
      income: {
        interest: 175000,
        other: 15000,
      },
      expenditure: {
        administration: 85000,
        other: 45000,
      },
    };

    // Calculate totals
    const localIncome =
      localFund.income.donations +
      localFund.income.fees +
      localFund.income.interest +
      localFund.income.other;
    const localExpenditure =
      localFund.expenditure.salaries +
      localFund.expenditure.programs +
      localFund.expenditure.administration +
      localFund.expenditure.other;
    const localTotal = {
      income: localIncome,
      expenditure: localExpenditure,
      surplus: localIncome - localExpenditure,
    };

    const restrictedIncome =
      restrictedFund.income.grants +
      restrictedFund.income.interest +
      restrictedFund.income.other;
    const restrictedExpenditure =
      restrictedFund.expenditure.salaries +
      restrictedFund.expenditure.programs +
      restrictedFund.expenditure.administration +
      restrictedFund.expenditure.other;
    const restrictedTotal = {
      income: restrictedIncome,
      expenditure: restrictedExpenditure,
      surplus: restrictedIncome - restrictedExpenditure,
    };

    const corpusIncome = corpusFund.income.interest + corpusFund.income.other;
    const corpusExpenditure =
      corpusFund.expenditure.administration + corpusFund.expenditure.other;
    const corpusTotal = {
      income: corpusIncome,
      expenditure: corpusExpenditure,
      surplus: corpusIncome - corpusExpenditure,
    };

    const grandIncome =
      localTotal.income + restrictedTotal.income + corpusTotal.income;
    const grandExpenditure =
      localTotal.expenditure +
      restrictedTotal.expenditure +
      corpusTotal.expenditure;
    const grandTotal = {
      income: grandIncome,
      expenditure: grandExpenditure,
      surplus: grandIncome - grandExpenditure,
    };

    return {
      localFund,
      restrictedFund,
      corpusFund,
      localTotal,
      restrictedTotal,
      corpusTotal,
      grandTotal,
    };
  };

  const mockData = generateMockData();

  const columns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "40%",
    },
    {
      key: "localFund",
      label: "Local Fund",
      align: "right",
      format: "currency",
      width: "15%",
    },
    {
      key: "restrictedFund",
      label: "Restricted Fund",
      align: "right",
      format: "currency",
      width: "15%",
    },
    {
      key: "corpusFund",
      label: "Corpus Fund",
      align: "right",
      format: "currency",
      width: "15%",
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      format: "currency",
      width: "15%",
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
        localFund: "",
        restrictedFund: "",
        corpusFund: "",
        total: "",
      },
    },
    {
      id: "donations-grants",
      type: "data",
      parentId: "income-header",
      data: {
        particulars: "Donations and Grants",
        localFund: mockData.localFund.income.donations,
        restrictedFund: mockData.restrictedFund.income.grants,
        corpusFund: 0,
        total:
          mockData.localFund.income.donations +
          mockData.restrictedFund.income.grants,
      },
      indent: 1,
    },
    {
      id: "program-fees",
      type: "data",
      parentId: "income-header",
      data: {
        particulars: "Program Fees",
        localFund: mockData.localFund.income.fees,
        restrictedFund: 0,
        corpusFund: 0,
        total: mockData.localFund.income.fees,
      },
      indent: 1,
    },
    {
      id: "interest-income",
      type: "data",
      parentId: "income-header",
      data: {
        particulars: "Interest Income",
        localFund: mockData.localFund.income.interest,
        restrictedFund: mockData.restrictedFund.income.interest,
        corpusFund: mockData.corpusFund.income.interest,
        total:
          mockData.localFund.income.interest +
          mockData.restrictedFund.income.interest +
          mockData.corpusFund.income.interest,
      },
      indent: 1,
    },
    {
      id: "other-income",
      type: "data",
      parentId: "income-header",
      data: {
        particulars: "Other Income",
        localFund: mockData.localFund.income.other,
        restrictedFund: mockData.restrictedFund.income.other,
        corpusFund: mockData.corpusFund.income.other,
        total:
          mockData.localFund.income.other +
          mockData.restrictedFund.income.other +
          mockData.corpusFund.income.other,
      },
      indent: 1,
    },
    {
      id: "total-income",
      type: "total",
      parentId: "income-header",
      data: {
        particulars: "Total Income (A)",
        localFund: mockData.localTotal.income,
        restrictedFund: mockData.restrictedTotal.income,
        corpusFund: mockData.corpusTotal.income,
        total: mockData.grandTotal.income,
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
        particulars: "EXPENDITURE",
        localFund: "",
        restrictedFund: "",
        corpusFund: "",
        total: "",
      },
    },
    {
      id: "salaries",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "Salaries and Wages",
        localFund: mockData.localFund.expenditure.salaries,
        restrictedFund: mockData.restrictedFund.expenditure.salaries,
        corpusFund: 0,
        total:
          mockData.localFund.expenditure.salaries +
          mockData.restrictedFund.expenditure.salaries,
      },
      indent: 1,
    },
    {
      id: "programs",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "Program Expenses",
        localFund: mockData.localFund.expenditure.programs,
        restrictedFund: mockData.restrictedFund.expenditure.programs,
        corpusFund: 0,
        total:
          mockData.localFund.expenditure.programs +
          mockData.restrictedFund.expenditure.programs,
      },
      indent: 1,
    },
    {
      id: "administration",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "Administrative Expenses",
        localFund: mockData.localFund.expenditure.administration,
        restrictedFund: mockData.restrictedFund.expenditure.administration,
        corpusFund: mockData.corpusFund.expenditure.administration,
        total:
          mockData.localFund.expenditure.administration +
          mockData.restrictedFund.expenditure.administration +
          mockData.corpusFund.expenditure.administration,
      },
      indent: 1,
    },
    {
      id: "other-expenses",
      type: "data",
      parentId: "expenditure-header",
      data: {
        particulars: "Other Expenses",
        localFund: mockData.localFund.expenditure.other,
        restrictedFund: mockData.restrictedFund.expenditure.other,
        corpusFund: mockData.corpusFund.expenditure.other,
        total:
          mockData.localFund.expenditure.other +
          mockData.restrictedFund.expenditure.other +
          mockData.corpusFund.expenditure.other,
      },
      indent: 1,
    },
    {
      id: "total-expenditure",
      type: "total",
      parentId: "expenditure-header",
      data: {
        particulars: "Total Expenditure (B)",
        localFund: mockData.localTotal.expenditure,
        restrictedFund: mockData.restrictedTotal.expenditure,
        corpusFund: mockData.corpusTotal.expenditure,
        total: mockData.grandTotal.expenditure,
      },
      bold: true,
      indent: 1,
    },

    // SURPLUS/DEFICIT
    {
      id: "surplus-deficit",
      type: "grandtotal",
      data: {
        particulars: "SURPLUS / (DEFICIT) FOR THE YEAR (A - B)",
        localFund: mockData.localTotal.surplus,
        restrictedFund: mockData.restrictedTotal.surplus,
        corpusFund: mockData.corpusTotal.surplus,
        total: mockData.grandTotal.surplus,
      },
      bold: true,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <FinancialReport
      title="Fund-wise Income & Expenditure"
      subtitle="For the Financial Year 2024-2025"
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
    />
  );
};

export default FundBasedIEPage;
