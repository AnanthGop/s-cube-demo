import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

const ReceiptsPaymentsPage: React.FC = () => {
  // Generate mock data
  const generateMockData = () => {
    // Opening balances
    const openingBankLocal = 2850000;
    const openingBankFCRA = 1250000;
    const openingCash = 85000;

    // Receipts
    const donationsGrants = 8500000;
    const programFees = 1250000;
    const interestReceived = 185000;
    const otherReceipts = 95000;
    const totalReceipts =
      donationsGrants + programFees + interestReceived + otherReceipts;

    // Payments
    const salariesPaid = 4450000;
    const programPayments = 2750000;
    const rentPaid = 650000;
    const travelPaid = 425000;
    const professionalFees = 380000;
    const officeExpenses = 285000;
    const fixedAssetPurchases = 450000;
    const bankCharges = 45000;
    const otherPayments = 385000;
    const totalPayments =
      salariesPaid +
      programPayments +
      rentPaid +
      travelPaid +
      professionalFees +
      officeExpenses +
      fixedAssetPurchases +
      bankCharges +
      otherPayments;

    // Closing balances
    const totalOpeningBalance =
      openingBankLocal + openingBankFCRA + openingCash;
    const netCashFlow = totalReceipts - totalPayments;
    const totalClosingBalance = totalOpeningBalance + netCashFlow;

    // Distribute closing balance
    const closingBankLocal = 3150000;
    const closingBankFCRA = 1680000;
    const closingCash =
      totalClosingBalance - closingBankLocal - closingBankFCRA;

    return {
      opening: {
        bankLocal: openingBankLocal,
        bankFCRA: openingBankFCRA,
        cash: openingCash,
        total: totalOpeningBalance,
      },
      receipts: {
        donationsGrants,
        programFees,
        interestReceived,
        otherReceipts,
        total: totalReceipts,
      },
      payments: {
        salariesPaid,
        programPayments,
        rentPaid,
        travelPaid,
        professionalFees,
        officeExpenses,
        fixedAssetPurchases,
        bankCharges,
        otherPayments,
        total: totalPayments,
      },
      closing: {
        bankLocal: closingBankLocal,
        bankFCRA: closingBankFCRA,
        cash: closingCash,
        total: totalClosingBalance,
      },
      grandTotal: totalOpeningBalance + totalReceipts,
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
    // OPENING BALANCES
    {
      id: "opening-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "OPENING BALANCES",
        currentYear: "",
        previousYear: "",
      },
    },
    {
      id: "opening-bank-local",
      type: "data",
      parentId: "opening-header",
      data: {
        particulars: "Bank - Local Fund",
        currentYear: mockData.opening.bankLocal,
        previousYear: mockData.opening.bankLocal * 0.85,
      },
      indent: 1,
    },
    {
      id: "opening-bank-fcra",
      type: "data",
      parentId: "opening-header",
      data: {
        particulars: "Bank - FCRA Account",
        currentYear: mockData.opening.bankFCRA,
        previousYear: mockData.opening.bankFCRA * 0.78,
      },
      indent: 1,
    },
    {
      id: "opening-cash",
      type: "data",
      parentId: "opening-header",
      data: {
        particulars: "Cash in Hand",
        currentYear: mockData.opening.cash,
        previousYear: mockData.opening.cash * 0.92,
      },
      indent: 1,
    },
    {
      id: "total-opening",
      type: "total",
      parentId: "opening-header",
      data: {
        particulars: "Total Opening Balance",
        currentYear: mockData.opening.total,
        previousYear: mockData.opening.total * 0.82,
      },
      bold: true,
      indent: 1,
    },

    // RECEIPTS
    {
      id: "receipts-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "RECEIPTS",
        currentYear: "",
        previousYear: "",
      },
    },
    {
      id: "donations-grants",
      type: "data",
      parentId: "receipts-header",
      data: {
        particulars: "Donations and Grants",
        currentYear: mockData.receipts.donationsGrants,
        previousYear: mockData.receipts.donationsGrants * 0.88,
      },
      indent: 1,
    },
    {
      id: "program-fees",
      type: "data",
      parentId: "receipts-header",
      data: {
        particulars: "Program Fees",
        currentYear: mockData.receipts.programFees,
        previousYear: mockData.receipts.programFees * 0.92,
      },
      indent: 1,
    },
    {
      id: "interest-received",
      type: "data",
      parentId: "receipts-header",
      data: {
        particulars: "Interest Received",
        currentYear: mockData.receipts.interestReceived,
        previousYear: mockData.receipts.interestReceived * 1.05,
      },
      indent: 1,
    },
    {
      id: "other-receipts",
      type: "data",
      parentId: "receipts-header",
      data: {
        particulars: "Other Receipts",
        currentYear: mockData.receipts.otherReceipts,
        previousYear: mockData.receipts.otherReceipts * 0.78,
      },
      indent: 1,
    },
    {
      id: "total-receipts",
      type: "total",
      parentId: "receipts-header",
      data: {
        particulars: "Total Receipts",
        currentYear: mockData.receipts.total,
        previousYear: mockData.receipts.total * 0.89,
      },
      bold: true,
      indent: 1,
    },

    // PAYMENTS
    {
      id: "payments-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "PAYMENTS",
        currentYear: "",
        previousYear: "",
      },
    },
    {
      id: "salaries-paid",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Salaries and Wages",
        currentYear: mockData.payments.salariesPaid,
        previousYear: mockData.payments.salariesPaid * 0.93,
      },
      indent: 1,
    },
    {
      id: "program-payments",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Program Expenses",
        currentYear: mockData.payments.programPayments,
        previousYear: mockData.payments.programPayments * 0.85,
      },
      indent: 1,
    },
    {
      id: "rent-paid",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Rent and Utilities",
        currentYear: mockData.payments.rentPaid,
        previousYear: mockData.payments.rentPaid * 0.96,
      },
      indent: 1,
    },
    {
      id: "travel-paid",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Travel and Conveyance",
        currentYear: mockData.payments.travelPaid,
        previousYear: mockData.payments.travelPaid * 0.72,
      },
      indent: 1,
    },
    {
      id: "professional-fees",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Professional Fees",
        currentYear: mockData.payments.professionalFees,
        previousYear: mockData.payments.professionalFees * 1.15,
      },
      indent: 1,
    },
    {
      id: "office-expenses",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Office and Administrative Expenses",
        currentYear: mockData.payments.officeExpenses,
        previousYear: mockData.payments.officeExpenses * 0.88,
      },
      indent: 1,
    },
    {
      id: "fixed-asset-purchases",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Fixed Asset Purchases",
        currentYear: mockData.payments.fixedAssetPurchases,
        previousYear: mockData.payments.fixedAssetPurchases * 1.25,
      },
      indent: 1,
    },
    {
      id: "bank-charges",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Bank Charges",
        currentYear: mockData.payments.bankCharges,
        previousYear: mockData.payments.bankCharges * 0.95,
      },
      indent: 1,
    },
    {
      id: "other-payments",
      type: "data",
      parentId: "payments-header",
      data: {
        particulars: "Other Payments",
        currentYear: mockData.payments.otherPayments,
        previousYear: mockData.payments.otherPayments * 1.12,
      },
      indent: 1,
    },
    {
      id: "total-payments",
      type: "total",
      parentId: "payments-header",
      data: {
        particulars: "Total Payments",
        currentYear: mockData.payments.total,
        previousYear: mockData.payments.total * 0.9,
      },
      bold: true,
      indent: 1,
    },

    // CLOSING BALANCES
    {
      id: "closing-header",
      type: "header",
      collapsible: true,
      data: {
        particulars: "CLOSING BALANCES",
        currentYear: "",
        previousYear: "",
      },
    },
    {
      id: "closing-bank-local",
      type: "data",
      parentId: "closing-header",
      data: {
        particulars: "Bank - Local Fund",
        currentYear: mockData.closing.bankLocal,
        previousYear: mockData.closing.bankLocal * 0.87,
      },
      indent: 1,
    },
    {
      id: "closing-bank-fcra",
      type: "data",
      parentId: "closing-header",
      data: {
        particulars: "Bank - FCRA Account",
        currentYear: mockData.closing.bankFCRA,
        previousYear: mockData.closing.bankFCRA * 0.91,
      },
      indent: 1,
    },
    {
      id: "closing-cash",
      type: "data",
      parentId: "closing-header",
      data: {
        particulars: "Cash in Hand",
        currentYear: mockData.closing.cash,
        previousYear: mockData.closing.cash * 0.94,
      },
      indent: 1,
    },
    {
      id: "total-closing",
      type: "total",
      parentId: "closing-header",
      data: {
        particulars: "Total Closing Balance",
        currentYear: mockData.closing.total,
        previousYear: mockData.closing.total * 0.88,
      },
      bold: true,
      indent: 1,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <FinancialReport
      title="Receipts & Payments Account"
      subtitle="For the Financial Year 2024-2025"
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
    />
  );
};

export default ReceiptsPaymentsPage;
