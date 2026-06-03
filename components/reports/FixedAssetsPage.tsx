import React from "react";
import FinancialReport, {
  FinancialReportColumn,
  FinancialReportRow,
} from "./FinancialReport";

const FixedAssetsPage: React.FC = () => {
  // Generate mock data for fixed assets
  const generateMockData = () => {
    const assets = [
      {
        id: "land",
        description: "Land",
        openingWDV: 3500000,
        additions: 0,
        deletions: 0,
        depreciationRate: 0,
        depreciation: 0,
      },
      {
        id: "building",
        description: "Building",
        openingWDV: 4500000,
        additions: 0,
        deletions: 0,
        depreciationRate: 5,
        depreciation: 225000,
      },
      {
        id: "computers",
        description: "Computers",
        openingWDV: 950000,
        additions: 285000,
        deletions: 45000,
        depreciationRate: 40,
        depreciation: 476000,
      },
      {
        id: "furniture",
        description: "Furniture & Fixtures",
        openingWDV: 625000,
        additions: 125000,
        deletions: 0,
        depreciationRate: 10,
        depreciation: 75000,
      },
      {
        id: "office-equipment",
        description: "Office Equipment",
        openingWDV: 385000,
        additions: 95000,
        deletions: 12000,
        depreciationRate: 15,
        depreciation: 70200,
      },
      {
        id: "vehicles",
        description: "Vehicles",
        openingWDV: 1250000,
        additions: 0,
        deletions: 0,
        depreciationRate: 15,
        depreciation: 187500,
      },
    ];

    // Calculate totals
    const totals = assets.reduce(
      (acc, asset) => {
        const grossBlock = asset.openingWDV + asset.additions - asset.deletions;
        const closingWDV = grossBlock - asset.depreciation;

        return {
          openingWDV: acc.openingWDV + asset.openingWDV,
          additions: acc.additions + asset.additions,
          deletions: acc.deletions + asset.deletions,
          grossBlock: acc.grossBlock + grossBlock,
          depreciation: acc.depreciation + asset.depreciation,
          closingWDV: acc.closingWDV + closingWDV,
        };
      },
      {
        openingWDV: 0,
        additions: 0,
        deletions: 0,
        grossBlock: 0,
        depreciation: 0,
        closingWDV: 0,
      },
    );

    return { assets, totals };
  };

  const mockData = generateMockData();

  const columns: FinancialReportColumn[] = [
    {
      key: "description",
      label: "Description",
      align: "left",
      width: "20%",
    },
    {
      key: "openingWDV",
      label: "Opening WDV\n01.04.2024",
      align: "right",
      format: "currency",
      width: "13%",
    },
    {
      key: "additions",
      label: "Additions\nDuring Year",
      align: "right",
      format: "currency",
      width: "13%",
    },
    {
      key: "deletions",
      label: "Deletions\nDuring Year",
      align: "right",
      format: "currency",
      width: "13%",
    },
    {
      key: "grossBlock",
      label: "Gross Block\n31.03.2025",
      align: "right",
      format: "currency",
      width: "13%",
    },
    {
      key: "depRate",
      label: "Dep.\nRate %",
      align: "center",
      width: "8%",
    },
    {
      key: "depreciation",
      label: "Depreciation\nFor Year",
      align: "right",
      format: "currency",
      width: "13%",
    },
    {
      key: "closingWDV",
      label: "Closing WDV\n31.03.2025",
      align: "right",
      format: "currency",
      width: "13%",
    },
  ];

  const rows: FinancialReportRow[] = [
    {
      id: "header",
      type: "header",
      collapsible: true,
      data: {
        description: "FIXED ASSETS SCHEDULE",
        openingWDV: "",
        additions: "",
        deletions: "",
        grossBlock: "",
        depRate: "",
        depreciation: "",
        closingWDV: "",
      },
    },
    ...mockData.assets.map((asset) => {
      const grossBlock = asset.openingWDV + asset.additions - asset.deletions;
      const closingWDV = grossBlock - asset.depreciation;

      return {
        id: asset.id,
        type: "data" as const,
        parentId: "header",
        data: {
          description: asset.description,
          openingWDV: asset.openingWDV,
          additions: asset.additions || "-",
          deletions: asset.deletions || "-",
          grossBlock: grossBlock,
          depRate:
            asset.depreciationRate > 0 ? `${asset.depreciationRate}%` : "-",
          depreciation: asset.depreciation,
          closingWDV: closingWDV,
        },
        indent: 1,
      };
    }),
    {
      id: "total",
      type: "grandtotal",
      parentId: "header",
      data: {
        description: "TOTAL",
        openingWDV: mockData.totals.openingWDV,
        additions: mockData.totals.additions,
        deletions: mockData.totals.deletions,
        grossBlock: mockData.totals.grossBlock,
        depRate: "",
        depreciation: mockData.totals.depreciation,
        closingWDV: mockData.totals.closingWDV,
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
      title="Fixed Assets Schedule"
      subtitle="For the Financial Year 2024-2025"
      columns={columns}
      rows={rows}
      showExport={true}
      onExport={handleExport}
    />
  );
};

export default FixedAssetsPage;
