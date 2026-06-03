import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";

export interface FinancialReportColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
  format?: "currency" | "number" | "text" | "date" | "percentage";
  headerGroup?: string; // Optional header group label for multi-row headers
}

export interface FinancialReportRow {
  id: string;
  type?: "header" | "section" | "subsection" | "data" | "total" | "grandtotal";
  data: Record<string, any>;
  indent?: number;
  bold?: boolean;
  parentId?: string; // ID of the parent row for hierarchical grouping
  collapsible?: boolean; // Whether this row can be collapsed
  noteRef?: string; // Note reference number or label
}

export interface FinancialReportProps {
  title: string;
  subtitle?: string;
  columns: FinancialReportColumn[];
  rows: FinancialReportRow[];
  showExport?: boolean;
  onExport?: () => void;
  defaultCollapsed?: boolean; // Whether sections start collapsed
  showNoteColumn?: boolean; // Whether to show the Note column
  onNoteClick?: (noteRef: string) => void; // Callback when a note is clicked
  onBack?: () => void; // Callback for back navigation
  backLabel?: string; // Label for back button (default: "Back")
  headerControls?: React.ReactNode;
}

const FinancialReport: React.FC<FinancialReportProps> = ({
  title,
  subtitle,
  columns,
  rows,
  showExport = true,
  onExport,
  defaultCollapsed = false,
  showNoteColumn = false,
  onNoteClick,
  onBack,
  backLabel = "Back",
  headerControls,
}) => {
  // Track which sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => {
      if (defaultCollapsed) {
        // Start with all collapsible sections collapsed
        return new Set(rows.filter((r) => r.collapsible).map((r) => r.id));
      }
      return new Set();
    },
  );

  const toggleSection = (rowId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  // Filter rows based on collapsed state
  const visibleRows = useMemo(() => {
    const result: FinancialReportRow[] = [];
    const collapsedParents = new Set<string>();

    for (const row of rows) {
      // Check if any parent is collapsed
      const isParentCollapsed =
        row.parentId && collapsedSections.has(row.parentId);

      // Show totals and grandtotals even when parent is collapsed
      const isTotalRow = row.type === "total" || row.type === "grandtotal";
      const isHidden = isParentCollapsed && !isTotalRow;

      if (!isHidden) {
        result.push(row);
        if (row.collapsible && collapsedSections.has(row.id)) {
          collapsedParents.add(row.id);
        }
      }
    }

    return result;
  }, [rows, collapsedSections]);
  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined || value === "") return "-";

    switch (format) {
      case "currency":
        if (typeof value === "number") {
          return `₹ ${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        }
        return value.toString();

      case "number":
        if (typeof value === "number") {
          return value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        return value.toString();

      case "percentage":
        if (typeof value === "number") {
          return `${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}%`;
        }
        return value.toString();

      case "date":
        return value.toString();

      default:
        return value.toString();
    }
  };

  const getRowClassName = (row: FinancialReportRow): string => {
    const baseClasses =
      "border-b border-slate-100 dark:border-slate-700 transition-colors";
    const cursorClass = row.collapsible ? "cursor-pointer" : "";

    switch (row.type) {
      case "header":
        return `${baseClasses} ${cursorClass} bg-emerald-50 dark:bg-emerald-900/20 font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30`;

      case "section":
        return `${baseClasses} ${cursorClass} bg-rose-50 dark:bg-rose-900/20 font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-100 dark:hover:bg-rose-900/30`;

      case "subsection":
        return `${baseClasses} font-semibold text-slate-600 dark:text-slate-300`;

      case "total":
        return `${baseClasses} bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600`;

      case "grandtotal":
        return `${baseClasses} bg-slate-200 dark:bg-slate-700 font-black text-slate-900 dark:text-white border-t-4 border-slate-400 dark:border-slate-500`;

      default:
        return `${baseClasses} hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-300`;
    }
  };

  const getCellClassName = (
    column: FinancialReportColumn,
    row: FinancialReportRow,
  ): string => {
    let classes = "px-4 py-3";

    if (column.align === "right") {
      classes += " text-right";
    } else if (column.align === "center") {
      classes += " text-center";
    } else {
      classes += " text-left";
    }

    if (row.bold) {
      classes += " font-bold";
    }

    return classes;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="flex-none border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 px-8 py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition shadow-sm"
                  title={backLabel}>
                  <ArrowLeft size={16} />
                  {backLabel}
                </button>
              )}
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end xl:justify-end">
              {headerControls}

              {showExport && (
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition">
                  📥 Export to Excel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
              {/* Check if any column has a headerGroup */}
              {columns.some((col) => col.headerGroup) && (
                <tr>
                  {(() => {
                    const headerGroups: Array<{
                      label: string;
                      colspan: number;
                      align?: string;
                    }> = [];
                    let currentGroup: string | null = null;
                    let colspan = 0;

                    columns.forEach((column, index) => {
                      if (column.headerGroup) {
                        if (column.headerGroup === currentGroup) {
                          colspan++;
                        } else {
                          if (currentGroup !== null) {
                            headerGroups.push({
                              label: currentGroup,
                              colspan,
                              align: columns[index - 1].align,
                            });
                          }
                          currentGroup = column.headerGroup;
                          colspan = 1;
                        }
                      } else {
                        if (currentGroup !== null) {
                          headerGroups.push({
                            label: currentGroup,
                            colspan,
                            align: columns[index - 1].align,
                          });
                          currentGroup = null;
                          colspan = 0;
                        }
                        headerGroups.push({
                          label: "",
                          colspan: 1,
                        });
                      }
                    });

                    if (currentGroup !== null) {
                      headerGroups.push({
                        label: currentGroup,
                        colspan,
                        align: columns[columns.length - 1].align,
                      });
                    }

                    return headerGroups.map((group, idx) => (
                      <th
                        key={idx}
                        colSpan={group.colspan}
                        className={`px-4 py-3 text-xs font-black text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-center ${
                          group.label ?
                            "border-l-2 border-r-2 border-slate-300 dark:border-slate-600"
                          : ""
                        }`}>
                        {group.label}
                      </th>
                    ));
                  })()}
                </tr>
              )}
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-200 dark:border-slate-700 ${
                      column.align === "right" ? "text-right"
                      : column.align === "center" ? "text-center"
                      : "text-left"
                    } ${
                      column.headerGroup ?
                        "border-l-2 border-r-2 border-slate-300 dark:border-slate-600"
                      : ""
                    }`}
                    style={{ width: column.width }}>
                    {column.label}
                  </th>
                ))}
                {showNoteColumn && (
                  <th
                    className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-200 dark:border-slate-700 text-center"
                    style={{ width: "8%" }}>
                    Note No.
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className={getRowClassName(row)}
                  onClick={
                    row.collapsible ? () => toggleSection(row.id) : undefined
                  }>
                  {columns.map((column, colIndex) => {
                    const value = row.data[column.key];
                    const isFirstColumn = colIndex === 0;
                    const indentStyle =
                      isFirstColumn && row.indent ?
                        { paddingLeft: `${16 + row.indent * 24}px` }
                      : {};

                    // Check if this is the noteNo column and row has a noteRef
                    const isNoteNoColumn =
                      column.key === "noteNo" && row.noteRef;

                    return (
                      <td
                        key={column.key}
                        className={`${getCellClassName(column, row)} ${
                          column.headerGroup ?
                            "border-l-2 border-r-2 border-slate-300 dark:border-slate-600"
                          : ""
                        }`}
                        style={indentStyle}>
                        {isFirstColumn && row.collapsible ?
                          <div className="flex items-center gap-2">
                            {collapsedSections.has(row.id) ?
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                            <span>{formatValue(value, column.format)}</span>
                          </div>
                        : isNoteNoColumn ?
                          <div className="flex items-center justify-center gap-1">
                            {
                              row.noteRef!.includes("&") ?
                                // Handle combined notes like "13&13A"
                                row.noteRef!.split("&").map((noteNum, idx) => (
                                  <React.Fragment key={noteNum}>
                                    {idx > 0 && (
                                      <span className="text-slate-500">&</span>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onNoteClick) {
                                          onNoteClick(noteNum.trim());
                                        }
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline hover:no-underline transition-colors">
                                      {noteNum.trim()}
                                    </button>
                                  </React.Fragment>
                                ))
                                // Single note reference
                              : <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onNoteClick) {
                                      onNoteClick(row.noteRef!);
                                    }
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline hover:no-underline transition-colors">
                                  {row.noteRef}
                                </button>

                            }
                          </div>
                        : formatValue(value, column.format)}
                      </td>
                    );
                  })}
                  {showNoteColumn && (
                    <td className="px-4 py-3 text-center">
                      {row.noteRef && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNoteClick) {
                              onNoteClick(row.noteRef!);
                            }
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline hover:no-underline transition-colors">
                          {row.noteRef}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;
