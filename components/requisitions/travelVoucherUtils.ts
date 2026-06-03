export interface TravelEntry {
  id?: string;
  employeeName?: string;
  postingFrequency?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  autoPosting?: "Y" | "N";
  grossAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  totalAmount?: number;
}

export interface FinancialYearItem {
  id?: number | string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface MonthlyVoucherDetail {
  monthKey: string;
  monthLabel: string;
  amount: number;
  expenseVoucherNo?: string;
  paymentVoucherNo?: string;
}

export interface TravelVoucherSummary {
  employeeName: string;
  entryCount: number;
  monthlyDetails: MonthlyVoucherDetail[];
}

export interface TravelVoucherSnapshot {
  financialYearId: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  employees: TravelVoucherSummary[];
  generatedAt: string;
}

export interface TravelEmployeeMapping {
  employeeName: string;
  ledgerName: string;
}

export type RawTravelEmployeeMapping =
  | {
      employeeName?: string;
      ledgerName?: string;
      employee?: string;
      ledger?: string;
    }
  | null
  | undefined;

export type TravelEmployeeMappingSource =
  | RawTravelEmployeeMapping[]
  | { employeeMappings?: RawTravelEmployeeMapping[] }
  | null
  | undefined;

export const normalizeTravelEmployeeMappings = (
  rawMappings: TravelEmployeeMappingSource,
): TravelEmployeeMapping[] => {
  const source =
    Array.isArray(rawMappings) ?
      rawMappings
    : Array.isArray(rawMappings?.employeeMappings) ?
      rawMappings.employeeMappings
    : [];

  return source
    .map((item) => {
      const employeeName = String(
        item?.employeeName || item?.employee || "",
      ).trim();
      const ledgerName = String(item?.ledgerName || item?.ledger || "").trim();
      return { employeeName, ledgerName };
    })
    .filter((item) => item.employeeName && item.ledgerName);
};

const parseDate = (raw: string | undefined): Date | null => {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const monthStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const monthEnd = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const diffInMonths = (start: Date, end: Date) =>
  (end.getFullYear() - start.getFullYear()) * 12 +
  (end.getMonth() - start.getMonth());

const roundAmount = (value: number) => Math.round(value * 100) / 100;

const normalizeStatus = (value: string | undefined) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isActiveFinancialYear = (fy: FinancialYearItem) => {
  const status = normalizeStatus(fy.status);
  return status === "open" || status === "active";
};

const getFyWindow = (
  fy: FinancialYearItem,
): { start: Date; end: Date } | null => {
  const name = String(fy.name || "").trim();
  const nameMatch = name.match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (nameMatch) {
    const startYear = Number(nameMatch[1]);
    const endYear = Number(nameMatch[2]);
    if (Number.isFinite(startYear) && Number.isFinite(endYear)) {
      return {
        start: new Date(startYear, 3, 1), // April 1
        end: new Date(endYear, 2, 31), // March 31
      };
    }
  }

  const fyStart = parseDate(fy.startDate);
  const fyEnd = parseDate(fy.endDate);
  if (!fyStart || !fyEnd) return null;
  return { start: fyStart, end: fyEnd };
};

const normalizeFrequency = (value: string | undefined) =>
  String(value || "")
    .trim()
    .toLowerCase();

const frequencyToMonths = (value: string | undefined) => {
  const normalized = normalizeFrequency(value);
  if (normalized.includes("bi")) return 2;
  if (normalized.includes("quarter")) return 3;
  if (normalized.includes("half")) return 6;
  if (normalized.includes("year")) return 12;
  return 1;
};

const isActiveTravelEntry = (entry: TravelEntry) =>
  String(entry.autoPosting || "")
    .trim()
    .toUpperCase() === "Y";

const monthOverlapsEntry = (entry: TravelEntry, month: Date) => {
  const start = parseDate(entry.travelStartDate);
  const end = parseDate(entry.travelEndDate);
  if (!start || !end) return false;
  return (
    monthStart(month) <= monthEnd(end) && monthEnd(month) >= monthStart(start)
  );
};

const isPostingMonth = (entry: TravelEntry, month: Date) => {
  const start = parseDate(entry.travelStartDate);
  if (!start) return true;
  const monthsSinceStart = diffInMonths(monthStart(start), monthStart(month));
  if (monthsSinceStart < 0) return false;
  const period = frequencyToMonths(entry.postingFrequency);
  // Post at the END of each period (e.g., for quarterly: months 2, 5, 8, 11)
  return (monthsSinceStart + 1) % period === 0;
};

const getMonthlyAmount = (entry: TravelEntry) => {
  const totalAmount = Number(entry.totalAmount || 0);
  if (Number.isFinite(totalAmount) && totalAmount > 0)
    return roundAmount(totalAmount);
  const gross = Number(entry.grossAmount || 0);
  const gst = Number(entry.gstAmount || 0);
  if (!Number.isFinite(gross) || !Number.isFinite(gst)) return 0;
  return roundAmount(gross + gst);
};

export const buildTravelVoucherNo = (
  type: "EV" | "PV",
  monthKey: string,
  employeeName: string,
) => {
  const clean = employeeName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^SANDHYA$/, "SEASIDE")
    .replace(/^ANANTH$/, "ALPHA");
  return `${type}-${monthKey.replace("-", "")}-${clean}`;
};

export const buildTravelVoucherSnapshots = (
  travelRecords: TravelEntry[],
  financialYears: FinancialYearItem[],
): TravelVoucherSnapshot[] => {
  const activeYears = financialYears.filter(isActiveFinancialYear);
  const activeEntries = travelRecords.filter(isActiveTravelEntry);
  const employeeMap = new Map<string, TravelEntry[]>();

  activeEntries.forEach((entry) => {
    const employeeName = String(entry.employeeName || "").trim();
    if (!employeeName) return;
    const existing = employeeMap.get(employeeName) || [];
    existing.push(entry);
    employeeMap.set(employeeName, existing);
  });

  return activeYears
    .map((fy) => {
      const fyWindow = getFyWindow(fy);
      if (!fyWindow) return null;
      const fyStart = fyWindow.start;
      const fyEnd = fyWindow.end;

      const months: Date[] = [];
      let cursor = monthStart(fyStart);
      const last = monthStart(fyEnd);
      while (cursor <= last) {
        months.push(cursor);
        cursor = addMonths(cursor, 1);
      }

      const employees: TravelVoucherSummary[] = Array.from(
        employeeMap.entries(),
      )
        .map(([employeeName, entries]) => {
          const monthlyDetails = months.map((month) => {
            const amount = entries.reduce((acc, entry) => {
              if (!monthOverlapsEntry(entry, month)) return acc;
              if (!isPostingMonth(entry, month)) return acc;
              return acc + getMonthlyAmount(entry);
            }, 0);
            return {
              monthKey: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
              monthLabel: month.toLocaleString("en-US", {
                month: "short",
                year: "numeric",
              }),
              amount: roundAmount(amount),
              ...(
                amount > 0 ?
                  {
                    expenseVoucherNo: buildTravelVoucherNo(
                      "EV",
                      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
                      employeeName,
                    ),
                    paymentVoucherNo: buildTravelVoucherNo(
                      "PV",
                      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
                      employeeName,
                    ),
                  }
                : {}
              ),
            };
          });

          const entryCount = monthlyDetails.filter((m) => m.amount > 0).length;
          return { employeeName, entryCount, monthlyDetails };
        })
        .filter((item) => item.entryCount > 0)
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

      return {
        financialYearId: String(fy.id ?? fy.name ?? ""),
        financialYearName: String(fy.name || ""),
        startDate: `${fyStart.getFullYear()}-${String(fyStart.getMonth() + 1).padStart(2, "0")}-${String(fyStart.getDate()).padStart(2, "0")}`,
        endDate: `${fyEnd.getFullYear()}-${String(fyEnd.getMonth() + 1).padStart(2, "0")}-${String(fyEnd.getDate()).padStart(2, "0")}`,
        employees,
        generatedAt: `${String(fy.startDate || "")}_${String(fy.endDate || "")}`,
      } satisfies TravelVoucherSnapshot;
    })
    .filter((item): item is TravelVoucherSnapshot => item !== null);
};
