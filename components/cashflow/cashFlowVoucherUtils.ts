export interface CashFlowTransaction {
  id: string;
  date: string;
  ref: string;
  description: string;
  amount: number;
}

interface MonthlyVoucherDetail {
  monthKey: string;
  monthLabel: string;
  amount: number;
  expenseVoucherNo?: string;
}

interface ConsultantSummary {
  consultantName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}

interface ConsultantSnapshot {
  consultants?: ConsultantSummary[];
}

interface LandlordSummary {
  landlordName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}

interface RentSnapshot {
  landlords?: LandlordSummary[];
}

interface TravelEmployeeSummary {
  employeeName: string;
  monthlyDetails: MonthlyVoucherDetail[];
}

interface TravelSnapshot {
  employees?: TravelEmployeeSummary[];
}

export const parseCashFlowDate = (value: string): Date | null => {
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const date = new Date(
    Number(parts[2]),
    Number(parts[1]) - 1,
    Number(parts[0]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseMonthKey = (monthKey: string): Date | null => {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const monthKeyInCashFlowRange = (
  monthKey: string,
  from: Date,
  to: Date,
) => {
  const date = parseMonthKey(monthKey);
  if (!date) return false;
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return date <= to && monthEnd >= from;
};

export const monthKeyToCashFlowDate = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  return `01/${month}/${year}`;
};

const cleanVoucherCode = (name: string) =>
  name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5)
    .padEnd(5, "X");

const buildVoucherNo = (monthKey: string, name: string) =>
  `EV-${monthKey.replace("-", "")}-${cleanVoucherCode(name)}`;

const shouldIncludeMonth = (
  detail: MonthlyVoucherDetail,
  from: Date,
  to: Date,
) => detail.amount > 0 && monthKeyInCashFlowRange(detail.monthKey, from, to);

export const buildConsultantCashFlowTransactions = (
  snapshots: ConsultantSnapshot[],
  from: Date,
  to: Date,
): CashFlowTransaction[] =>
  snapshots.flatMap((snapshot) =>
    (snapshot.consultants || []).flatMap((consultant) =>
      (consultant.monthlyDetails || [])
        .filter((detail) => shouldIncludeMonth(detail, from, to))
        .map((detail) => {
          const ref =
            detail.expenseVoucherNo ||
            buildVoucherNo(detail.monthKey, consultant.consultantName);
          return {
            id: `${ref}-${consultant.consultantName}`,
            date: monthKeyToCashFlowDate(detail.monthKey),
            ref,
            description: `Consultant Fee - ${consultant.consultantName} (${detail.monthLabel})`,
            amount: detail.amount,
          };
        }),
    ),
  );

export const buildRentCashFlowTransactions = (
  snapshots: RentSnapshot[],
  from: Date,
  to: Date,
): CashFlowTransaction[] =>
  snapshots.flatMap((snapshot) =>
    (snapshot.landlords || []).flatMap((landlord) =>
      (landlord.monthlyDetails || [])
        .filter((detail) => shouldIncludeMonth(detail, from, to))
        .map((detail) => {
          const ref =
            detail.expenseVoucherNo ||
            buildVoucherNo(detail.monthKey, landlord.landlordName);
          return {
            id: `${ref}-${landlord.landlordName}`,
            date: monthKeyToCashFlowDate(detail.monthKey),
            ref,
            description: `Rent - ${landlord.landlordName} (${detail.monthLabel})`,
            amount: detail.amount,
          };
        }),
    ),
  );

export const buildTravelCashFlowTransactions = (
  snapshots: TravelSnapshot[],
  from: Date,
  to: Date,
): CashFlowTransaction[] =>
  snapshots.flatMap((snapshot) =>
    (snapshot.employees || []).flatMap((employee) =>
      (employee.monthlyDetails || [])
        .filter((detail) => shouldIncludeMonth(detail, from, to))
        .map((detail) => {
          const ref =
            detail.expenseVoucherNo ||
            buildVoucherNo(detail.monthKey, employee.employeeName);
          return {
            id: `${ref}-${employee.employeeName}`,
            date: monthKeyToCashFlowDate(detail.monthKey),
            ref,
            description: `Travel Expenses - ${employee.employeeName} (${detail.monthLabel})`,
            amount: detail.amount,
          };
        }),
    ),
  );
