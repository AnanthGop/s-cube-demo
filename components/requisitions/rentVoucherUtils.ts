import type { RentEntry } from "./rentTypes";

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
  tdsAmount: number;
  netAmount: number;
  expenseVoucherNo?: string;
  paymentVoucherNo?: string;
  approved?: string;
  expenseVoucherCreated?: string;
  paymentVoucherCreated?: string;
}

export interface LandlordVoucherSummary {
  landlordName: string;
  fundType: string;
  entryCount: number;
  monthlyDetails: MonthlyVoucherDetail[];
}

export interface RentVoucherSnapshot {
  financialYearId: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  landlords: LandlordVoucherSummary[];
  generatedAt: string;
}

export interface TDSItem {
  id?: number | string;
  fy?: string;
  type?: string;
  section?: string;
  rate?: number;
  threshold?: number;
  status?: string;
}

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

const isActiveTdsRule = (rule: TDSItem) => {
  const status = normalizeStatus(rule.status);
  return status === "" || status === "active" || status === "open";
};

const findRentLandAndBuildingRule = (
  fyName: string,
  tdsRules: TDSItem[],
): { rate: number; threshold: number } | null => {
  const normalizedFy = String(fyName || "").trim();
  const candidates = tdsRules.filter((rule) => {
    if (!isActiveTdsRule(rule)) return false;
    const type = normalizeStatus(rule.type);
    const isRentLand =
      type.includes("rent") &&
      (type.includes("land") ||
        type.includes("bldg") ||
        type.includes("building"));
    if (!isRentLand) return false;
    return String(rule.fy || "").trim() === normalizedFy;
  });
  if (candidates.length === 0) return null;
  const preferred = candidates.find((r) =>
    normalizeStatus(r.type).includes("rent of land and building"),
  );
  const picked = preferred || candidates[0];
  const rate = Number(picked.rate || 0);
  const threshold = Number(picked.threshold || 0);
  if (!Number.isFinite(rate) || !Number.isFinite(threshold)) return null;
  return { rate, threshold };
};

const isActiveRentEntry = (entry: RentEntry) => {
  if (entry.activeForJV !== "Y") return false;
  return true;
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

const getMonthlyAmount = (entry: RentEntry, month: Date): number => {
  const baseRent = Number(entry.currentRent || entry.rentAmount || 0);
  if (!Number.isFinite(baseRent)) return 0;

  const start = parseDate(entry.startDate);
  if (!start) return roundAmount(baseRent);

  const incrementPeriod = normalizeStatus(entry.incrementPeriod);
  const isYearly =
    incrementPeriod.includes("year") || incrementPeriod.includes("annual");
  if (!isYearly) return roundAmount(baseRent);

  const monthsSinceStart = diffInMonths(monthStart(start), monthStart(month));
  const yearlySteps =
    monthsSinceStart >= 0 ? Math.floor(monthsSinceStart / 12) : 0;
  if (yearlySteps <= 0) return roundAmount(baseRent);

  const incrementType = normalizeStatus(entry.incrementType);
  const incrementValue = Number(
    entry.incrementValue ?? entry.incrementPercent ?? 0,
  );
  if (!Number.isFinite(incrementValue) || incrementValue <= 0) {
    return roundAmount(baseRent);
  }

  if (incrementType === "amount") {
    return roundAmount(baseRent + incrementValue * yearlySteps);
  }

  const factor = Math.pow(1 + incrementValue / 100, yearlySteps);
  return roundAmount(baseRent * factor);
};

const monthOverlapsEntry = (entry: RentEntry, month: Date) => {
  const start = parseDate(entry.startDate);
  const end = parseDate(entry.endDate);
  if (!start || !end) return false;
  return (
    monthStart(month) <= monthEnd(end) && monthEnd(month) >= monthStart(start)
  );
};

export const buildRentVoucherNo = (
  type: "EV" | "PV",
  monthKey: string,
  landlordName: string,
) => {
  const clean = landlordName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5)
    .padEnd(5, "X");
  return `${type}-${monthKey.replace("-", "")}-${clean}`;
};

export const buildRentVoucherSnapshots = (
  rentRecords: RentEntry[],
  financialYears: FinancialYearItem[],
  tdsRules: TDSItem[] = [],
): RentVoucherSnapshot[] => {
  const activeYears = financialYears.filter(isActiveFinancialYear);
  const activeEntries = rentRecords.filter(isActiveRentEntry);
  const landlordMap = new Map<string, RentEntry[]>();

  activeEntries.forEach((entry) => {
    const landlordName = String(entry.landlordName || "").trim();
    if (!landlordName) return;
    const existing = landlordMap.get(landlordName) || [];
    existing.push(entry);
    landlordMap.set(landlordName, existing);
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

      const landlords: LandlordVoucherSummary[] = Array.from(
        landlordMap.entries(),
      )
        .map(([landlordName, entries]) => {
          const fundType =
            entries.length > 0 ?
              String(entries[0].fundType || "LC").trim()
            : "LC";

          const monthlyBase = months.map((month) => {
            const amount = entries.reduce((acc, entry) => {
              if (!monthOverlapsEntry(entry, month)) return acc;
              return acc + getMonthlyAmount(entry, month);
            }, 0);
            return {
              monthKey: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
              monthLabel: month.toLocaleString("en-US", {
                month: "short",
                year: "numeric",
              }),
              amount: roundAmount(amount),
              tdsAmount: 0,
              netAmount: roundAmount(amount),
            };
          });
          const annualTotal = roundAmount(
            monthlyBase.reduce((acc, row) => acc + row.amount, 0),
          );
          const tdsRule = findRentLandAndBuildingRule(
            String(fy.name || ""),
            tdsRules,
          );
          const applyTds =
            !!tdsRule &&
            annualTotal > Number(tdsRule.threshold || 0) &&
            tdsRule.rate > 0;

          const monthlyDetails = monthlyBase.map((row) => {
            const voucherNumbers =
              row.amount > 0 ?
                {
                  expenseVoucherNo: buildRentVoucherNo(
                    "EV",
                    row.monthKey,
                    landlordName,
                  ),
                  paymentVoucherNo: buildRentVoucherNo(
                    "PV",
                    row.monthKey,
                    landlordName,
                  ),
                }
              : {};
            if (!applyTds || row.amount <= 0) {
              return { ...row, ...voucherNumbers };
            }
            const tdsAmount = roundAmount((row.amount * tdsRule.rate) / 100);
            return {
              ...row,
              ...voucherNumbers,
              tdsAmount,
              netAmount: roundAmount(row.amount - tdsAmount),
            };
          });

          const entryCount = monthlyDetails.filter((m) => m.amount > 0).length;
          return { landlordName, fundType, entryCount, monthlyDetails };
        })
        .filter((item) => item.entryCount > 0)
        .sort((a, b) => a.landlordName.localeCompare(b.landlordName));

      return {
        financialYearId: String(fy.id ?? fy.name ?? ""),
        financialYearName: String(fy.name || ""),
        startDate: `${fyStart.getFullYear()}-${String(fyStart.getMonth() + 1).padStart(2, "0")}-${String(fyStart.getDate()).padStart(2, "0")}`,
        endDate: `${fyEnd.getFullYear()}-${String(fyEnd.getMonth() + 1).padStart(2, "0")}-${String(fyEnd.getDate()).padStart(2, "0")}`,
        landlords,
        // Keep deterministic to avoid persistence loops in render/effect cycles.
        generatedAt: `${String(fy.startDate || "")}_${String(fy.endDate || "")}`,
      } satisfies RentVoucherSnapshot;
    })
    .filter((item): item is RentVoucherSnapshot => item !== null);
};
