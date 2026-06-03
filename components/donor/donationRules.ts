import type { DonorRecord, DonorType, FundTypeItem } from "./donorRules";

export const DONATION_TYPE_OPTIONS = [
  "General Donation",
  "CSR Grant",
  "Other Grant",
  "Corpus Donation",
] as const;

export const DONATION_MODE_OF_RECEIPT_OPTIONS = [
  "Bank Transfer",
  "Cheque",
  "Cash",
] as const;

export const RECEIPT_SENT_OPTIONS = ["No", "Yes"] as const;
export const DONATION_VALIDATION_STATUS_OPTIONS = ["Pending", "Validated"] as const;
export const RECEIPT_POSTED_OPTIONS = ["No", "Yes"] as const;
const CASH_80G_ELIGIBILITY_LIMIT = 2000;

export type DonationType = (typeof DONATION_TYPE_OPTIONS)[number];
export type DonationReceiptMode = (typeof DONATION_MODE_OF_RECEIPT_OPTIONS)[number];
export type ReceiptSentStatus = (typeof RECEIPT_SENT_OPTIONS)[number];
export type DonationValidationStatus =
  (typeof DONATION_VALIDATION_STATUS_OPTIONS)[number];
export type ReceiptPostedStatus = (typeof RECEIPT_POSTED_OPTIONS)[number];

export interface ChartOfAccountsCategory {
  master: string;
  groups: {
    name: string;
    ledgers: Array<string | { name: string }>;
  }[];
}

export interface DonationRecord {
  id: number;
  donorId: number;
  donorName: string;
  donorType: DonorType;
  donationDate: string;
  donationType: DonationType;
  amount: string;
  projectId: string;
  projectName: string;
  fundType: string;
  modeOfReceipt: DonationReceiptMode;
  bankAccount: string;
  transactionReference: string;
  chequeBankName?: string;
  location: string;
  receiptNumber: string;
  receiptSent: ReceiptSentStatus;
  validationStatus?: DonationValidationStatus;
  receiptPosted?: ReceiptPostedStatus;
  receiptPostedDate?: string;
  createdAt: string;
}

export interface Donation80GEligibilityBreakup {
  eligibleAmount: number;
  ineligibleAmount: number;
  hasCashCapApplied: boolean;
}

export type RecordedDonationFilterKey =
  | "receiptNumber"
  | "donorName"
  | "donationDate"
  | "amount"
  | "eightyGEligibleAmount"
  | "eightyGIneligibleAmount"
  | "donationType"
  | "projectName"
  | "fundType"
  | "modeOfReceipt"
  | "bankAccount"
  | "transactionReference"
  | "chequeBankName"
  | "location"
  | "receiptSent"
  | "receiptAction";

export type RecordedDonationFilters = Partial<
  Record<RecordedDonationFilterKey, string>
>;

/**
 * Applies the donation receipt 80G presentation rule for cash donations.
 * Final donor tax deductibility may still depend on the applicable 80G category.
 */
export const get80GEligibilityBreakup = (
  donation: Pick<DonationRecord, "amount" | "modeOfReceipt">,
): Donation80GEligibilityBreakup => {
  const parsedAmount = Number(donation.amount);
  const donationAmount =
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

  if (
    donation.modeOfReceipt === "Cash" &&
    donationAmount > CASH_80G_ELIGIBILITY_LIMIT
  ) {
    return {
      eligibleAmount: CASH_80G_ELIGIBILITY_LIMIT,
      ineligibleAmount: donationAmount - CASH_80G_ELIGIBILITY_LIMIT,
      hasCashCapApplied: true,
    };
  }

  return {
    eligibleAmount: donationAmount,
    ineligibleAmount: 0,
    hasCashCapApplied: false,
  };
};

const formatCurrencyForFilter = (value: string | number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const normalizeDateForFilter = (date: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  return date;
};

const matchesRecordedDonationFilter = (
  values: Array<string | number | undefined>,
  filterValue = "",
) => {
  const query = filterValue.trim().toLowerCase();
  if (!query) return true;

  return values.some((value) =>
    String(value ?? "").toLowerCase().includes(query),
  );
};

const getAmountFilterValues = (value: string | number) => [
  value,
  Number(value || 0),
  Number(value || 0).toLocaleString("en-IN"),
  formatCurrencyForFilter(value),
];

export const filterRecordedDonations = (
  donations: DonationRecord[],
  filters: RecordedDonationFilters,
) =>
  (donations || []).filter((donation) => {
    const eightyGBreakup = get80GEligibilityBreakup(donation);
    const receiptNumber = donation.receiptNumber || "Pending";
    const receiptAction = donation.receiptNumber ?
      "Generated View Download"
    : "Pending";
    const normalizedDate = normalizeDateForFilter(donation.donationDate);

    const columnValues: Record<
      RecordedDonationFilterKey,
      Array<string | number | undefined>
    > = {
      receiptNumber: [receiptNumber],
      donorName: [donation.donorName],
      donationDate: [donation.donationDate, normalizedDate],
      amount: getAmountFilterValues(donation.amount),
      eightyGEligibleAmount: getAmountFilterValues(eightyGBreakup.eligibleAmount),
      eightyGIneligibleAmount: getAmountFilterValues(
        eightyGBreakup.ineligibleAmount,
      ),
      donationType: [donation.donationType],
      projectName: [donation.projectName],
      fundType: [donation.fundType],
      modeOfReceipt: [donation.modeOfReceipt],
      bankAccount: [donation.bankAccount || "--"],
      transactionReference: [donation.transactionReference || "--"],
      chequeBankName: [donation.chequeBankName || "--"],
      location: [donation.location],
      receiptSent: [donation.receiptSent],
      receiptAction: [receiptAction],
    };

    return (Object.keys(columnValues) as RecordedDonationFilterKey[]).every(
      (key) => matchesRecordedDonationFilter(columnValues[key], filters[key]),
    );
  });

export const getAvailableDonationTypes = (
  donorType: DonorType | string,
): DonationType[] => {
  if (donorType === "Corporate") {
    return [
      "General Donation",
      "CSR Grant",
      "Other Grant",
      "Corpus Donation",
    ];
  }

  if (donorType === "NGO") {
    return ["General Donation", "Other Grant", "Corpus Donation"];
  }

  return ["General Donation", "Corpus Donation"];
};

export const searchDonors = <T extends Partial<DonorRecord>>(
  donors: T[],
  searchText: string,
) => {
  const query = searchText.trim().toLowerCase();
  if (!query) return donors || [];

  return (donors || []).filter((donor) =>
    [
      donor.donorName,
      donor.contactNumber,
      donor.emailId,
      donor.kycDocument,
      donor.idNumber,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
};

export const selectBankAccountLedgers = (
  chartOfAccounts: ChartOfAccountsCategory[],
) => {
  const bankLedgers: string[] = [];

  (chartOfAccounts || []).forEach((category) => {
    if (String(category.master || "").toLowerCase() !== "assets") return;

    (category.groups || []).forEach((group) => {
      (group.ledgers || []).forEach((ledger) => {
        const ledgerName = typeof ledger === "string" ? ledger : ledger.name;
        if (String(ledgerName || "").toLowerCase().includes("bank")) {
          bankLedgers.push(ledgerName);
        }
      });
    });
  });

  return bankLedgers;
};

export const getRequiredDonationFields = (modeOfReceipt: DonationReceiptMode) => {
  const fields = [
    "donorId",
    "donationDate",
    "donationType",
    "amount",
    "projectId",
    "fundType",
    "modeOfReceipt",
    "location",
  ];

  if (modeOfReceipt === "Bank Transfer") {
    return [...fields, "bankAccount", "transactionReference"];
  }

  if (modeOfReceipt === "Cheque") {
    return [...fields, "bankAccount", "transactionReference", "chequeBankName"];
  }

  return fields;
};

const getFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    donorId: "Donor",
    donationDate: "Donation date",
    donationType: "Donation type",
    amount: "Donation amount",
    projectId: "Project / purpose",
    fundType: "Fund type",
    modeOfReceipt: "Mode of receipt",
    location: "Location",
    bankAccount: "Bank account",
    transactionReference: "Transaction reference",
    chequeBankName: "Name of Bank (cheque)",
  };

  return labels[field] || field;
};

export const isDonationValidated = (donation: Pick<DonationRecord, "receiptNumber" | "validationStatus">) =>
  donation.validationStatus === "Validated" || Boolean(donation.receiptNumber);

export const validateDonationForReceipt = (
  donation: DonationRecord,
  donors: DonorRecord[],
) => {
  const errors: string[] = [];
  const selectedDonor = (donors || []).find((donor) => donor.id === donation.donorId);
  if (!selectedDonor) {
    errors.push("Donor was not found in donor database.");
  }

  const amount = Number(donation.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Donation amount must be greater than 0.");
  }

  getRequiredDonationFields(donation.modeOfReceipt).forEach((field) => {
    if (field === "amount") return;
    if (!String(donation[field as keyof DonationRecord] || "").trim()) {
      if (
        field === "transactionReference" &&
        donation.modeOfReceipt === "Bank Transfer"
      ) {
        errors.push("Transaction reference is required for Bank Transfer receipts.");
        return;
      }

      if (
        field === "transactionReference" &&
        donation.modeOfReceipt === "Cheque"
      ) {
        errors.push("Transaction reference is required for Cheque receipts.");
        return;
      }

      if (field === "chequeBankName" && donation.modeOfReceipt === "Cheque") {
        errors.push("Name of Bank (cheque) is required for Cheque receipts.");
        return;
      }

      errors.push(`${getFieldLabel(field)} is required.`);
    }
  });

  const allowedTypes = selectedDonor ?
    getAvailableDonationTypes(selectedDonor.donorType)
  : getAvailableDonationTypes(donation.donorType);
  if (!allowedTypes.includes(donation.donationType)) {
    errors.push("Donation type is not allowed for this donor.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const markDonationValidated = (donation: DonationRecord): DonationRecord => ({
  ...donation,
  validationStatus: "Validated",
});

export const generateReceiptForDonation = (
  donation: DonationRecord,
  existingDonations: DonationRecord[],
  fundTypes: FundTypeItem[],
): DonationRecord => {
  if (!isDonationValidated(donation)) {
    throw new Error("Donation must be validated before receipt generation.");
  }

  if (donation.receiptNumber) return donation;

  return {
    ...donation,
    receiptNumber: getReceiptNumber(
      donation.fundType,
      donation.donationDate,
      existingDonations,
      fundTypes,
    ),
  };
};

export const markDonationReceiptPosted = (
  donation: DonationRecord,
  receiptPostedDate: string,
): DonationRecord => {
  if (!donation.receiptNumber) {
    throw new Error("Postal posting requires a generated receipt.");
  }

  if (!receiptPostedDate) {
    throw new Error("Postal posting date is required.");
  }

  return {
    ...donation,
    receiptPosted: "Yes",
    receiptPostedDate,
  };
};

export const getDonationReceiptBuckets = (
  donations: DonationRecord[],
  donors: DonorRecord[],
) => {
  const getDonor = (donation: DonationRecord) =>
    (donors || []).find((donor) => donor.id === donation.donorId);

  return {
    pendingValidation: (donations || []).filter(
      (donation) => !isDonationValidated(donation),
    ),
    pendingGeneration: (donations || []).filter(
      (donation) => isDonationValidated(donation) && !donation.receiptNumber,
    ),
    generated: (donations || []).filter((donation) =>
      Boolean(donation.receiptNumber),
    ),
    pendingPosting: (donations || []).filter((donation) => {
      const donor = getDonor(donation);
      return (
        Boolean(donation.receiptNumber) &&
        donor?.modeOfReceipt === "post" &&
        donation.receiptPosted !== "Yes"
      );
    }),
  };
};

const parseDonationDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

export const getFinancialYearLabel = (donationDate: string) => {
  const parsedDate = parseDonationDate(donationDate);
  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth();
  const startYear = month >= 3 ? year : year - 1;

  return `${startYear}-${startYear + 1}`;
};

export const getFundReceiptPrefix = (
  fundType: FundTypeItem | string | undefined,
) => {
  const code =
    typeof fundType === "string" ? "" : String(fundType?.code || "").trim();
  const label =
    typeof fundType === "string" ?
      fundType
    : `${fundType?.name || ""} ${fundType?.code || ""}`;
  const upperCode = code.toUpperCase();
  const lowerLabel = label.toLowerCase();

  if (upperCode === "FC" || lowerLabel.includes("fcra")) return "FC";
  if (upperCode === "LC" || lowerLabel.includes("local")) return "LC";

  return upperCode || "LC";
};

export const getReceiptNumber = (
  fundTypeName: string,
  donationDate: string,
  existingDonations: Array<Pick<DonationRecord, "receiptNumber">>,
  fundTypes: FundTypeItem[],
) => {
  const matchingFundType = (fundTypes || []).find(
    (fundType) =>
      String(fundType.name || "").toLowerCase() ===
      fundTypeName.toLowerCase(),
  );
  const prefix = getFundReceiptPrefix(matchingFundType || fundTypeName);
  const financialYear = getFinancialYearLabel(donationDate);
  const receiptPrefix = `${prefix}/${financialYear}/`;
  const maxSequence = (existingDonations || []).reduce((max, donation) => {
    const receiptNumber = String(donation.receiptNumber || "");
    if (!receiptNumber.startsWith(receiptPrefix)) return max;

    const sequence = Number(receiptNumber.slice(receiptPrefix.length));
    if (!Number.isFinite(sequence)) return max;

    return Math.max(max, sequence);
  }, 0);

  return `${receiptPrefix}${String(maxSequence + 1).padStart(3, "0")}`;
};
