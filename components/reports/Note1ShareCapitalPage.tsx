import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

interface Note1ShareCapitalPageProps {
  onBack?: () => void;
}

const Note1ShareCapitalPage: React.FC<Note1ShareCapitalPageProps> = ({
  onBack,
}) => {
  // Main table columns
  const columns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "40%",
    },
    {
      key: "currentYearShares",
      label: "Number of shares",
      align: "right",
      format: "number",
      width: "15%",
      headerGroup: "As at 31 March, 2025",
    },
    {
      key: "currentYearINR",
      label: "INR",
      align: "right",
      format: "currency",
      width: "15%",
      headerGroup: "As at 31 March, 2025",
    },
    {
      key: "previousYearShares",
      label: "Number of shares",
      align: "right",
      format: "number",
      width: "15%",
      headerGroup: "As at 31 March, 2024",
    },
    {
      key: "previousYearINR",
      label: "INR",
      align: "right",
      format: "currency",
      width: "15%",
      headerGroup: "As at 31 March, 2024",
    },
  ];

  const rows: FinancialReportRow[] = [
    // (a) Authorised
    {
      id: "authorized",
      type: "data",
      data: {
        particulars: "(a) Authorised",
        currentYearShares: "",
        currentYearINR: "",
        previousYearShares: "",
        previousYearINR: "",
      },
      bold: true,
    },
    {
      id: "authorized-equity",
      type: "data",
      data: {
        particulars: "Equity shares of INR. 10 each with voting rights",
        currentYearShares: 100000,
        currentYearINR: 1000000,
        previousYearShares: 100000,
        previousYearINR: 1000000,
      },
      indent: 1,
    },

    // (b) Issued
    {
      id: "issued",
      type: "data",
      data: {
        particulars: "(b) Issued",
        currentYearShares: "",
        currentYearINR: "",
        previousYearShares: "",
        previousYearINR: "",
      },
      bold: true,
    },
    {
      id: "issued-equity",
      type: "data",
      data: {
        particulars: "Equity shares of INR. 10 each with voting rights",
        currentYearShares: 75000,
        currentYearINR: 750000,
        previousYearShares: 75000,
        previousYearINR: 750000,
      },
      indent: 1,
    },

    // (c) Subscribed and fully paid up
    {
      id: "subscribed",
      type: "data",
      data: {
        particulars: "(c) Subscribed and fully paid up",
        currentYearShares: "",
        currentYearINR: "",
        previousYearShares: "",
        previousYearINR: "",
      },
      bold: true,
    },
    {
      id: "subscribed-equity",
      type: "data",
      data: {
        particulars: "Equity shares of INR. 10 each with voting rights",
        currentYearShares: 75000,
        currentYearINR: 750000,
        previousYearShares: 75000,
        previousYearINR: 750000,
      },
      indent: 1,
    },

    // Total
    {
      id: "total",
      type: "grandtotal",
      data: {
        particulars: "Total",
        currentYearShares: 75000,
        currentYearINR: 750000,
        previousYearShares: 75000,
        previousYearINR: 750000,
      },
      bold: true,
    },
  ];

  // Reconciliation table columns
  const reconciliationColumns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Particulars",
      align: "left",
      width: "25%",
    },
    {
      key: "cy_opening_shares",
      label: "Number of shares",
      align: "right",
      format: "number",
      width: "12.5%",
      headerGroup: "As at 31 March, 2025 - Opening Balance",
    },
    {
      key: "cy_opening_amount",
      label: "Amount (INR)",
      align: "right",
      format: "currency",
      width: "12.5%",
      headerGroup: "As at 31 March, 2025 - Opening Balance",
    },
    {
      key: "cy_fresh_shares",
      label: "Number of shares",
      align: "right",
      format: "number",
      width: "12.5%",
      headerGroup: "As at 31 March, 2025 - Fresh Issue",
    },
    {
      key: "cy_fresh_amount",
      label: "Amount (INR)",
      align: "right",
      format: "currency",
      width: "12.5%",
      headerGroup: "As at 31 March, 2025 - Fresh Issue",
    },
    {
      key: "cy_closing_shares",
      label: "Number of shares",
      align: "right",
      format: "number",
      width: "12.5%",
      headerGroup: "As at 31 March, 2025 - Closing Balance",
    },
    {
      key: "cy_closing_amount",
      label: "Amount (INR)",
      align: "right",
      format: "currency",
      width: "12.5%",
      headerGroup: "As at 31 March, 2025 - Closing Balance",
    },
  ];

  const reconciliationRows: FinancialReportRow[] = [
    {
      id: "recon-equity-2025",
      type: "data",
      data: {
        particulars:
          "Equity shares Subscribed & Fully paid up with voting rights - Year ended 31 March, 2025",
        cy_opening_shares: 75000,
        cy_opening_amount: 750000,
        cy_fresh_shares: 0,
        cy_fresh_amount: 0,
        cy_closing_shares: 75000,
        cy_closing_amount: 750000,
      },
      bold: true,
    },
    {
      id: "recon-equity-2024",
      type: "data",
      data: {
        particulars:
          "Equity shares Subscribed & Fully paid up with voting rights - Year ended 31 March, 2024",
        cy_opening_shares: 75000,
        cy_opening_amount: 750000,
        cy_fresh_shares: 0,
        cy_fresh_amount: 0,
        cy_closing_shares: 75000,
        cy_closing_amount: 750000,
      },
    },
  ];

  // Shareholder details table columns
  const shareholderColumns: FinancialReportColumn[] = [
    {
      key: "particulars",
      label: "Class of shares / Name of shareholder",
      align: "left",
      width: "40%",
    },
    {
      key: "cy_shares",
      label: "Number of shares held",
      align: "right",
      format: "number",
      width: "15%",
      headerGroup: "As at 31 March, 2025",
    },
    {
      key: "cy_percentage",
      label: "% holding in that class of shares",
      align: "right",
      format: "percentage",
      width: "15%",
      headerGroup: "As at 31 March, 2025",
    },
    {
      key: "py_shares",
      label: "Number of shares held",
      align: "right",
      format: "number",
      width: "15%",
      headerGroup: "As at 31 March, 2024",
    },
    {
      key: "py_percentage",
      label: "% holding in that class of shares",
      align: "right",
      format: "percentage",
      width: "15%",
      headerGroup: "As at 31 March, 2024",
    },
  ];

  const shareholderRows: FinancialReportRow[] = [
    {
      id: "shareholder-equity",
      type: "data",
      data: {
        particulars: "Equity shares with voting rights",
        cy_shares: "",
        cy_percentage: "",
        py_shares: "",
        py_percentage: "",
      },
      bold: true,
    },
    {
      id: "shareholder-1",
      type: "data",
      data: {
        particulars: "ABC Foundation",
        cy_shares: 7500,
        cy_percentage: 10.0,
        py_shares: 7500,
        py_percentage: 10.0,
      },
      indent: 1,
    },
    {
      id: "shareholder-2",
      type: "data",
      data: {
        particulars: "XYZ Trust",
        cy_shares: 6750,
        cy_percentage: 9.0,
        py_shares: 6750,
        py_percentage: 9.0,
      },
      indent: 1,
    },
    {
      id: "shareholder-3",
      type: "data",
      data: {
        particulars: "PQR Educational Society",
        cy_shares: 6000,
        cy_percentage: 8.0,
        py_shares: 6000,
        py_percentage: 8.0,
      },
      indent: 1,
    },
  ];

  const handleExport = () => {
    alert("Export functionality to be implemented");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-auto">
      {/* Main Share Capital Table */}
      <div className="flex-shrink-0">
        <FinancialReport
          title="Note 1 Share Capital"
          subtitle="As at 31 March, 2025 and As at 31 March, 2024"
          columns={columns}
          rows={rows}
          showExport={true}
          onExport={handleExport}
          onBack={onBack}
          backLabel="Back to Balance Sheet"
        />
      </div>

      {/* Notes Section */}
      <div className="p-6 space-y-6">
        {/* (i) Reconciliation Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4">
            (i) Reconciliation of the number of shares and amount outstanding at
            the beginning and at the end of the reporting period:
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-200 dark:border-slate-700 text-left">
                    Particulars
                  </th>
                  <th
                    colSpan={2}
                    className="px-4 py-3 text-xs font-black text-slate-600 dark:text-slate-300 border-b border-l-2 border-r-2 border-slate-300 dark:border-slate-600 text-center">
                    Opening Balance
                  </th>
                  <th
                    colSpan={2}
                    className="px-4 py-3 text-xs font-black text-slate-600 dark:text-slate-300 border-b border-l-2 border-r-2 border-slate-300 dark:border-slate-600 text-center">
                    Fresh Issue
                  </th>
                  <th
                    colSpan={2}
                    className="px-4 py-3 text-xs font-black text-slate-600 dark:text-slate-300 border-b border-l-2 border-r-2 border-slate-300 dark:border-slate-600 text-center">
                    Closing Balance
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-l-2 border-slate-300 dark:border-slate-600 text-right">
                    Number of shares
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-r-2 border-slate-300 dark:border-slate-600 text-right">
                    Amount (INR)
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-l-2 border-slate-300 dark:border-slate-600 text-right">
                    Number of shares
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-r-2 border-slate-300 dark:border-slate-600 text-right">
                    Amount (INR)
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-l-2 border-slate-300 dark:border-slate-600 text-right">
                    Number of shares
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-r-2 border-slate-300 dark:border-slate-600 text-right">
                    Amount (INR)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-left font-bold">
                    Equity shares Subscribed & Fully paid up with voting rights
                  </td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600"></td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600"></td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600"></td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600"></td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600"></td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600"></td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-left font-semibold">
                    Year ended 31 March, 2025
                  </td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600">
                    75,000.00
                  </td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600">
                    ₹ 750,000.00
                  </td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600">
                    75,000.00
                  </td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600">
                    ₹ 750,000.00
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-left font-semibold">
                    Year ended 31 March, 2024
                  </td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600">
                    75,000.00
                  </td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600">
                    ₹ 750,000.00
                  </td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-right border-l-2 border-slate-300 dark:border-slate-600">
                    75,000.00
                  </td>
                  <td className="px-4 py-3 text-right border-r-2 border-slate-300 dark:border-slate-600">
                    ₹ 750,000.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* (ii) Shareholder Details Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 pb-0">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4">
              (ii) Details of shares held by each shareholder holding more than
              5% shares:
            </h3>
          </div>
          <FinancialReport
            title=""
            columns={shareholderColumns}
            rows={shareholderRows}
            showExport={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Note1ShareCapitalPage;
