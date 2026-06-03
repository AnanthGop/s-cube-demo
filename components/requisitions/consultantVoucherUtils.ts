export interface ConsultantEntry {
  id?: string;
  vendorName?: string;
  postingFrequency?: string;
  agreementStartDate?: string;
  agreementEndDate?: string;
  agreementTerminationDate?: string;
  autoPosting?: "Y" | "N";
  autoPostingDate?: string;
  fundType?: string;
  grossAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  totalAmount?: number;
  tdsPercent?: number;
}

export interface FinancialYearItem {
  id?: number | string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ConsultantTdsAccountMapping {
  accountName?: string;
  type?: string;
  section?: string;
  rate?: number;
  appliedOn?: string;
}

export interface MonthlyVoucherDetail {
  monthKey: string;
  monthLabel: string;
  amount: number;
  grossAmount?: number;
  isPartialPeriod?: boolean;
  periodStartDate?: string;
  periodEndDate?: string;
  manualAmount?: number;
  manualGrossAmount?: number;
  manualTdsAmount?: number;
  manualNetAmount?: number;
  tdsAmount: number;
  netAmount: number;
  expenseVoucherNo?: string;
  paymentVoucherNo?: string;
  approved?: string;
  expenseVoucherCreated?: string;
  paymentVoucherCreated?: string;
}

export interface ConsultantVoucherSummary {
  consultantName: string;
  fundType: string;
  entryCount: number;
  monthlyDetails: MonthlyVoucherDetail[];
}

export interface ConsultantVoucherSnapshot {
  financialYearId: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  consultants: ConsultantVoucherSummary[];
  generatedAt: string;
}

interface MonthlyAccumulator {
  amount: number;
  grossAmount: number;
  isPartialPeriod: boolean;
  periodStartDate?: string;
  periodEndDate?: string;
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

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const diffInMonths = (start: Date, end: Date) =>
  (end.getFullYear() - start.getFullYear()) * 12 +
  (end.getMonth() - start.getMonth());

const roundAmount = (value: number) => Math.round(value * 100) / 100;

const formatIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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

const parsePostingDay = (value: string | undefined) => {
  const match = String(value || "").match(/^(\d{1,2})/);
  const day = Number(match?.[1] || 1);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : 1;
};

const clampDay = (year: number, monthIndex: number, day: number) => {
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, maxDay);
};

const getPostingDateForMonth = (month: Date, postingDay: number) =>
  new Date(
    month.getFullYear(),
    month.getMonth(),
    clampDay(month.getFullYear(), month.getMonth(), postingDay),
  );

const diffInDaysInclusive = (start: Date, end: Date) => {
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / 86400000) + 1;
};

const isActiveConsultantEntry = (entry: ConsultantEntry) =>
  String(entry.autoPosting || "")
    .trim()
    .toUpperCase() === "Y";

export const countConsultantVoucherEligibleEntries = (
  consultantRecords: ConsultantEntry[],
) => consultantRecords.filter(isActiveConsultantEntry).length;

const getEffectiveEntryEndDate = (entry: ConsultantEntry) => {
  const agreementEnd = parseDate(entry.agreementEndDate);
  const terminationEnd = parseDate(entry.agreementTerminationDate);
  if (agreementEnd && terminationEnd) {
    return agreementEnd <= terminationEnd ? agreementEnd : terminationEnd;
  }
  return terminationEnd || agreementEnd;
};

const monthOverlapsEntry = (entry: ConsultantEntry, month: Date) => {
  const start = parseDate(entry.agreementStartDate);
  const end = getEffectiveEntryEndDate(entry);
  if (!start || !end) return false;
  return (
    monthStart(month) <= monthEnd(end) && monthEnd(month) >= monthStart(start)
  );
};

const isPostingMonth = (entry: ConsultantEntry, month: Date) => {
  const start = parseDate(entry.agreementStartDate);
  if (!start) return true;
  const monthsSinceStart = diffInMonths(monthStart(start), monthStart(month));
  if (monthsSinceStart < 0) return false;
  const period = frequencyToMonths(entry.postingFrequency);
  // Post at the END of each period (e.g., for quarterly: months 2, 5, 8, 11)
  return (monthsSinceStart + 1) % period === 0;
};

const getMonthlyAmount = (entry: ConsultantEntry) => {
  const totalAmount = Number(entry.totalAmount || 0);
  if (Number.isFinite(totalAmount) && totalAmount > 0)
    return roundAmount(totalAmount);
  const gross = Number(entry.grossAmount || 0);
  const gst = Number(entry.gstAmount || 0);
  if (!Number.isFinite(gross) || !Number.isFinite(gst)) return 0;
  return roundAmount(gross + gst);
};

const getMonthlyGrossAmount = (entry: ConsultantEntry) => {
  const gross = Number(entry.grossAmount || 0);
  return Number.isFinite(gross) && gross > 0 ? roundAmount(gross) : 0;
};

const getPartialPeriodDetails = (
  entry: ConsultantEntry,
  month: Date,
): {
  factor: number;
  periodStartDate: string;
  periodEndDate: string;
} | null => {
  const terminationDate = parseDate(entry.agreementTerminationDate);
  if (!terminationDate) return null;

  const postingDay = parsePostingDay(String(entry.autoPostingDate || ""));
  const periodMonths = frequencyToMonths(entry.postingFrequency);
  const postingDate = getPostingDateForMonth(month, postingDay);
  const nextPostingDate = getPostingDateForMonth(
    addMonths(month, periodMonths),
    postingDay,
  );

  if (terminationDate < postingDate || terminationDate >= nextPostingDate) {
    return null;
  }

  const fullPeriodEnd = addDays(nextPostingDate, -1);
  const coveredDays = diffInDaysInclusive(postingDate, terminationDate);
  const fullPeriodDays = Math.max(
    1,
    diffInDaysInclusive(postingDate, fullPeriodEnd),
  );
  const factor = Math.min(1, Math.max(0, coveredDays / fullPeriodDays));

  return {
    factor,
    periodStartDate: formatIsoDate(postingDate),
    periodEndDate: formatIsoDate(terminationDate),
  };
};

export const buildConsultantVoucherNo = (
  type: "EV" | "PV",
  monthKey: string,
  consultantName: string,
) => {
  const clean = consultantName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5)
    .padEnd(5, "X");
  return `${type}-${monthKey.replace("-", "")}-${clean}`;
};

export const buildConsultantVoucherSnapshots = (
  consultantRecords: ConsultantEntry[],
  financialYears: FinancialYearItem[],
  tdsAccountMappings: ConsultantTdsAccountMapping[] = [],
): ConsultantVoucherSnapshot[] => {
  const activeYears = financialYears.filter(isActiveFinancialYear);
  const activeEntries = consultantRecords.filter(isActiveConsultantEntry);
  const consultantMap = new Map<string, ConsultantEntry[]>();
  const mappedTdsPercent =
    tdsAccountMappings.reduce<number | null>((selectedRate, item) => {
      if (selectedRate !== null) return selectedRate;
      const rate = Number(item?.rate || 0);
      return Number.isFinite(rate) && rate > 0 ? rate : null;
    }, null) || 0;

  activeEntries.forEach((entry) => {
    const consultantName = String(entry.vendorName || "").trim();
    if (!consultantName) return;
    const existing = consultantMap.get(consultantName) || [];
    existing.push(entry);
    consultantMap.set(consultantName, existing);
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

      const consultants: ConsultantVoucherSummary[] = Array.from(
        consultantMap.entries(),
      )
        .map(([consultantName, entries]) => {
          const fundType =
            entries.length > 0 ?
              String(entries[0].fundType || "LC").trim()
            : "LC";

          const monthlyBase = months.map((month) => {
            const totals = entries.reduce<MonthlyAccumulator>(
              (acc, entry) => {
                if (!monthOverlapsEntry(entry, month)) return acc;
                if (!isPostingMonth(entry, month)) return acc;
                const partial = getPartialPeriodDetails(entry, month);
                const amountFactor = partial?.factor || 1;
                const amount = roundAmount(getMonthlyAmount(entry) * amountFactor);
                const grossAmount = roundAmount(
                  getMonthlyGrossAmount(entry) * amountFactor,
                );
                return {
                  amount: acc.amount + amount,
                  grossAmount: acc.grossAmount + grossAmount,
                  isPartialPeriod: acc.isPartialPeriod || !!partial,
                  periodStartDate: acc.periodStartDate || partial?.periodStartDate,
                  periodEndDate: acc.periodEndDate || partial?.periodEndDate,
                };
              },
              {
                amount: 0,
                grossAmount: 0,
                isPartialPeriod: false,
                periodStartDate: undefined as string | undefined,
                periodEndDate: undefined as string | undefined,
              },
            );
            return {
              monthKey: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
              monthLabel: month.toLocaleString("en-US", {
                month: "short",
                year: "numeric",
              }),
              amount: roundAmount(totals.amount),
              grossAmount: roundAmount(totals.grossAmount),
              isPartialPeriod: totals.isPartialPeriod,
              periodStartDate: totals.periodStartDate,
              periodEndDate: totals.periodEndDate,
              tdsAmount: 0,
              netAmount: roundAmount(totals.amount),
            };
          });

          const monthlyDetails = monthlyBase.map((row) => {
            const voucherNumbers =
              row.amount > 0 ?
                {
                  expenseVoucherNo: buildConsultantVoucherNo(
                    "EV",
                    row.monthKey,
                    consultantName,
                  ),
                  paymentVoucherNo: buildConsultantVoucherNo(
                    "PV",
                    row.monthKey,
                    consultantName,
                  ),
                }
              : {};
            if (!mappedTdsPercent || row.amount <= 0) {
              return { ...row, ...voucherNumbers };
            }
            const tdsBase =
              Number.isFinite(row.grossAmount) && row.grossAmount > 0 ?
                row.grossAmount
              : row.amount;
            const tdsAmount = roundAmount((tdsBase * mappedTdsPercent) / 100);
            return {
              ...row,
              ...voucherNumbers,
              tdsAmount,
              netAmount: roundAmount(row.amount - tdsAmount),
            };
          });

          const entryCount = monthlyDetails.filter((m) => m.amount > 0).length;
          return { consultantName, fundType, entryCount, monthlyDetails };
        })
        .filter((item) => item.entryCount > 0)
        .sort((a, b) => a.consultantName.localeCompare(b.consultantName));

      return {
        financialYearId: String(fy.id ?? fy.name ?? ""),
        financialYearName: String(fy.name || ""),
        startDate: `${fyStart.getFullYear()}-${String(fyStart.getMonth() + 1).padStart(2, "0")}-${String(fyStart.getDate()).padStart(2, "0")}`,
        endDate: `${fyEnd.getFullYear()}-${String(fyEnd.getMonth() + 1).padStart(2, "0")}-${String(fyEnd.getDate()).padStart(2, "0")}`,
        consultants,
        generatedAt: `${String(fy.startDate || "")}_${String(fy.endDate || "")}`,
      } satisfies ConsultantVoucherSnapshot;
    })
    .filter((item): item is ConsultantVoucherSnapshot => item !== null);
};
