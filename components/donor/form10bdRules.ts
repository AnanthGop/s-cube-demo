import type { DonationRecord, DonationReceiptMode, DonationType } from "./donationRules";
import type { DonorRecord } from "./donorRules";

export const FORM_10BD_MENU_LABEL = "Form 10BD & Form 10BE";
export const SECTION_CODE_80G = "Section 80G";
export const PAN_ID_CODE = "1";
export const FORM_10BD_CASH_LIMIT = 2000;

export const FORM_10BD_COLUMNS = [
  "Sl. No.",
  "Pre Acknowledgement No.",
  "Unique Identification Number of the donor",
  "ID code",
  "Section code",
  "Unique Registration Number",
  "Date of Issuance of Unique Registration Number",
  "Name of donor",
  "Address of donor",
  "Donation Type",
  "Mode of receipt",
  "Amount of donation",
] as const;

export type Form10BDColumn = (typeof FORM_10BD_COLUMNS)[number];
export type Form10BDRow = Record<Form10BDColumn, string>;

export type Form10BDFilingStatus = "Generated" | "Uploaded";

export interface FormAttachmentRecord {
  fileName: string;
  storedFileName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  uploadedAt?: string;
}

export interface Form10BDFilingRecord {
  id: number;
  companyId: string | number;
  companyName: string;
  financialYear: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  status: Form10BDFilingStatus;
  donationIds: number[];
  totalAmount: number;
  csvFileName?: string;
  uploadDate?: string;
  acknowledgementNumber?: string;
  attachment?: FormAttachmentRecord;
}

export interface Form10BEFileRecord {
  id: number;
  donorPan: string;
  donationAmount: string | number;
  donationDate: string;
  fileName: string;
  storedFileName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  uploadedAt?: string;
  certificateNumber?: string;
  certificateDate?: string;
  donationId?: number;
}

export interface Company80GRecord {
  id?: string | number;
  name?: string;
  eightyGNo?: string;
  eightyGDate?: string;
}

export type Form10BDExclusionReasonCode =
  | "ANONYMOUS_DONOR"
  | "DONOR_WITHOUT_PAN"
  | "CASH_DONATION_OVER_2000"
  | "ALREADY_DECLARED"
  | "MISSING_DONOR";

export const FORM_10BD_EXCLUSION_REASON_LABELS: Record<
  Form10BDExclusionReasonCode | "PENDING_10BD_UPLOAD",
  string
> = {
  ANONYMOUS_DONOR: "Anonymous donations",
  DONOR_WITHOUT_PAN: "Donations without PAN",
  CASH_DONATION_OVER_2000: "Cash donations exceeding Rs. 2,000",
  ALREADY_DECLARED: "Already declared in Form 10BD",
  MISSING_DONOR: "Donor missing from database",
  PENDING_10BD_UPLOAD: "Eligible but not uploaded in Form 10BD",
};

export interface Form10BDEligibleDonation {
  donation: DonationRecord;
  donor: DonorRecord;
}

export interface Form10BDExcludedDonation {
  donation: DonationRecord;
  donor?: DonorRecord;
  reasonCode: Form10BDExclusionReasonCode;
  reason: string;
}

export interface Form10BDEligibilityInput {
  donations: DonationRecord[];
  donors: DonorRecord[];
  filings: Form10BDFilingRecord[];
  dateFrom: string;
  dateTo: string;
}

export interface Form10BDReconciliationInput extends Form10BDEligibilityInput {}

export interface Form10BDReconciliationGroup {
  reasonCode: Form10BDExclusionReasonCode | "PENDING_10BD_UPLOAD";
  reason: string;
  amount: number;
  donations: DonationRecord[];
}

export interface Form10BDReconciliation {
  declaredAmount: number;
  notDeclaredAmount: number;
  totalAmount: number;
  declaredDonations: DonationRecord[];
  notDeclaredGroups: Form10BDReconciliationGroup[];
}

const normalizeComparableText = (value: string | number | undefined | null) =>
  String(value ?? "").trim().toUpperCase();

const parseAmount = (value: string | number | undefined | null) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const parseDate = (value: string) => {
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

const isValidDate = (date: Date) => Number.isFinite(date.getTime());

export const isDateInRange = (date: string, dateFrom: string, dateTo: string) => {
  const parsedDate = parseDate(date);
  const parsedFrom = parseDate(dateFrom);
  const parsedTo = parseDate(dateTo);

  if (!isValidDate(parsedDate)) return false;
  if (dateFrom && isValidDate(parsedFrom) && parsedDate < parsedFrom) return false;
  if (dateTo && isValidDate(parsedTo) && parsedDate > parsedTo) return false;

  return true;
};

export const getFinancialYearForDate = (date: string) => {
  const parsedDate = parseDate(date);
  if (!isValidDate(parsedDate)) return "";

  const year = parsedDate.getFullYear();
  const startYear = parsedDate.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const getDeclaredDonationIds = (filings: Form10BDFilingRecord[]) =>
  new Set(
    (filings || [])
      .filter(
        (filing) =>
          filing.status === "Uploaded" &&
          Boolean(filing.uploadDate) &&
          Boolean(filing.attachment?.fileName || filing.attachment?.url),
      )
      .flatMap((filing) => filing.donationIds || []),
  );

export const getDonorPan = (donor?: DonorRecord) => {
  if (!donor) return "";
  if (donor.kycDocument !== "PAN") return "";

  const pan = normalizeComparableText(donor.idNumber);
  if (!pan || pan === "PAN-UNAVAILABLE" || pan === "ANONYMOUS") return "";

  return pan;
};

export const getDonationExclusionReason = (
  donation: DonationRecord,
  donor: DonorRecord | undefined,
  declaredDonationIds: Set<number>,
): Form10BDExclusionReasonCode | null => {
  if (!donor) return "MISSING_DONOR";
  if (declaredDonationIds.has(donation.id)) return "ALREADY_DECLARED";
  if (donor.donorType === "Anonymous donor") return "ANONYMOUS_DONOR";
  if (!getDonorPan(donor)) return "DONOR_WITHOUT_PAN";
  if (
    donation.modeOfReceipt === "Cash" &&
    parseAmount(donation.amount) > FORM_10BD_CASH_LIMIT
  ) {
    return "CASH_DONATION_OVER_2000";
  }

  return null;
};

export const getForm10BDEligibility = ({
  donations,
  donors,
  filings,
  dateFrom,
  dateTo,
}: Form10BDEligibilityInput) => {
  const donorById = new Map((donors || []).map((donor) => [donor.id, donor]));
  const declaredDonationIds = getDeclaredDonationIds(filings || []);
  const eligible: Form10BDEligibleDonation[] = [];
  const excluded: Form10BDExcludedDonation[] = [];

  (donations || [])
    .filter((donation) => isDateInRange(donation.donationDate, dateFrom, dateTo))
    .forEach((donation) => {
      const donor = donorById.get(donation.donorId);
      const reasonCode = getDonationExclusionReason(
        donation,
        donor,
        declaredDonationIds,
      );

      if (reasonCode) {
        excluded.push({
          donation,
          donor,
          reasonCode,
          reason: FORM_10BD_EXCLUSION_REASON_LABELS[reasonCode],
        });
        return;
      }

      eligible.push({ donation, donor: donor as DonorRecord });
    });

  return { eligible, excluded };
};

export const mapDonationTypeToForm10BD = (donationType: DonationType | string) => {
  if (donationType === "Corpus Donation") return "Corpus";
  if (donationType === "CSR Grant" || donationType === "Other Grant") {
    return "Specific grant";
  }

  return "Others";
};

export const mapReceiptModeToForm10BD = (
  modeOfReceipt: DonationReceiptMode | string,
) => {
  if (modeOfReceipt === "Cash") return "Cash";
  return "Electronic modes including account payee cheque/draft";
};

export const buildForm10BDRows = ({
  donations,
  donors,
  company,
  preAcknowledgementNumber = "",
}: {
  donations: DonationRecord[];
  donors: DonorRecord[];
  company: Company80GRecord;
  preAcknowledgementNumber?: string;
}) => {
  const donorById = new Map((donors || []).map((donor) => [donor.id, donor]));

  return (donations || []).map((donation, index) => {
    const donor = donorById.get(donation.donorId);
    const pan = getDonorPan(donor);

    return {
      "Sl. No.": String(index + 1),
      "Pre Acknowledgement No.": preAcknowledgementNumber,
      "Unique Identification Number of the donor": pan,
      "ID code": PAN_ID_CODE,
      "Section code": SECTION_CODE_80G,
      "Unique Registration Number": String(company?.eightyGNo || ""),
      "Date of Issuance of Unique Registration Number": String(
        company?.eightyGDate || "",
      ),
      "Name of donor": String(donor?.donorName || donation.donorName || ""),
      "Address of donor": String(donor?.address || ""),
      "Donation Type": mapDonationTypeToForm10BD(donation.donationType),
      "Mode of receipt": mapReceiptModeToForm10BD(donation.modeOfReceipt),
      "Amount of donation": String(parseAmount(donation.amount)),
    } satisfies Form10BDRow;
  });
};

const csvEscape = (value: string | number | undefined | null) => {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

export const buildForm10BDCsv = (rows: Form10BDRow[]) => {
  const header = FORM_10BD_COLUMNS.join(",");
  const body = (rows || [])
    .map((row) => FORM_10BD_COLUMNS.map((column) => csvEscape(row[column])).join(","))
    .join("\n");

  return body ? `${header}\n${body}` : header;
};

export const createForm10BDFilingRecord = ({
  id,
  company,
  dateFrom,
  dateTo,
  donationIds,
  totalAmount,
  generatedAt,
}: {
  id: number;
  company: Company80GRecord;
  dateFrom: string;
  dateTo: string;
  donationIds: number[];
  totalAmount: number;
  generatedAt: string;
}): Form10BDFilingRecord => ({
  id,
  companyId: company.id || "",
  companyName: company.name || "",
  financialYear: getFinancialYearForDate(dateFrom),
  dateFrom,
  dateTo,
  generatedAt,
  status: "Generated",
  donationIds,
  totalAmount,
  csvFileName: `form-10bd-${getFinancialYearForDate(dateFrom) || "export"}-${id}.csv`,
});

export const markForm10BDFilingUploaded = (
  filing: Form10BDFilingRecord,
  uploadDetails: {
    uploadDate: string;
    acknowledgementNumber?: string;
    attachment: FormAttachmentRecord;
  },
): Form10BDFilingRecord => ({
  ...filing,
  status: "Uploaded",
  uploadDate: uploadDetails.uploadDate,
  acknowledgementNumber: uploadDetails.acknowledgementNumber || "",
  attachment: uploadDetails.attachment,
});

const pushReconciliationGroup = (
  groups: Map<Form10BDReconciliationGroup["reasonCode"], Form10BDReconciliationGroup>,
  reasonCode: Form10BDReconciliationGroup["reasonCode"],
  donation: DonationRecord,
) => {
  const existing = groups.get(reasonCode);
  const reason = FORM_10BD_EXCLUSION_REASON_LABELS[reasonCode];
  const amount = parseAmount(donation.amount);

  if (existing) {
    existing.amount += amount;
    existing.donations.push(donation);
    return;
  }

  groups.set(reasonCode, {
    reasonCode,
    reason,
    amount,
    donations: [donation],
  });
};

export const buildForm10BDReconciliation = ({
  donations,
  donors,
  filings,
  dateFrom,
  dateTo,
}: Form10BDReconciliationInput): Form10BDReconciliation => {
  const inRangeDonations = (donations || []).filter((donation) =>
    isDateInRange(donation.donationDate, dateFrom, dateTo),
  );
  const donationById = new Map(inRangeDonations.map((donation) => [donation.id, donation]));
  const donorById = new Map((donors || []).map((donor) => [donor.id, donor]));
  const declaredDonationIds = getDeclaredDonationIds(filings || []);
  const groups = new Map<
    Form10BDReconciliationGroup["reasonCode"],
    Form10BDReconciliationGroup
  >();

  const declaredDonations = Array.from(declaredDonationIds)
    .map((donationId) => donationById.get(donationId))
    .filter(Boolean) as DonationRecord[];

  const declaredAmount = declaredDonations.reduce(
    (sum, donation) => sum + parseAmount(donation.amount),
    0,
  );

  inRangeDonations.forEach((donation) => {
    if (declaredDonationIds.has(donation.id)) return;

    const donor = donorById.get(donation.donorId);
    const reasonCode =
      getDonationExclusionReason(donation, donor, declaredDonationIds) ||
      "PENDING_10BD_UPLOAD";

    pushReconciliationGroup(groups, reasonCode, donation);
  });

  const notDeclaredGroups = Array.from(groups.values());
  const notDeclaredAmount = notDeclaredGroups.reduce(
    (sum, group) => sum + group.amount,
    0,
  );

  return {
    declaredAmount,
    notDeclaredAmount,
    totalAmount: declaredAmount + notDeclaredAmount,
    declaredDonations,
    notDeclaredGroups,
  };
};

export const getForm10BEDonationMatches = ({
  form10BEFiles,
  donations,
  donors,
  filings,
}: {
  form10BEFiles: Form10BEFileRecord[];
  donations: DonationRecord[];
  donors: DonorRecord[];
  filings: Form10BDFilingRecord[];
}) => {
  const declaredDonationIds = getDeclaredDonationIds(filings || []);
  const donorById = new Map((donors || []).map((donor) => [donor.id, donor]));
  const declaredDonations = (donations || []).filter((donation) =>
    declaredDonationIds.has(donation.id),
  );

  const matched: Array<{ file: Form10BEFileRecord; donation: DonationRecord }> = [];
  const unmatched: Array<{
    file: Form10BEFileRecord;
    reasonCode: "DONATION_NOT_DECLARED_IN_10BD";
    reason: string;
  }> = [];
  const matchedDonationIds = new Set<number>();

  (form10BEFiles || []).forEach((file) => {
    const filePan = normalizeComparableText(file.donorPan);
    const fileAmount = parseAmount(file.donationAmount);
    const fileDate = parseDate(file.donationDate);
    const donation = declaredDonations.find((candidate) => {
      if (matchedDonationIds.has(candidate.id)) return false;

      const donor = donorById.get(candidate.donorId);
      const donorPan = getDonorPan(donor);
      const candidateDate = parseDate(candidate.donationDate);

      return (
        donorPan === filePan &&
        parseAmount(candidate.amount) === fileAmount &&
        isValidDate(fileDate) &&
        isValidDate(candidateDate) &&
        fileDate.getTime() === candidateDate.getTime()
      );
    });

    if (donation) {
      matchedDonationIds.add(donation.id);
      matched.push({ file, donation });
      return;
    }

    unmatched.push({
      file,
      reasonCode: "DONATION_NOT_DECLARED_IN_10BD",
      reason: "Form 10BE file is not linked to a donation declared in Form 10BD.",
    });
  });

  return { matched, unmatched };
};

export const getForm10BEFileWithDonation = (
  file: Form10BEFileRecord,
  donationId: number,
): Form10BEFileRecord => ({
  ...file,
  donationId,
});
