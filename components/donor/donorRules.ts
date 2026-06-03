export const DONOR_TYPE_OPTIONS = [
  "Individual / HUF",
  "Corporate",
  "NGO",
  "Donor without PAN",
  "Anonymous donor",
] as const;

export const CITIZEN_STATUS_OPTIONS = [
  "Indian citizen",
  "Foreign citizen",
] as const;

export const MODE_OF_RECEIPT_OPTIONS = ["email", "whatsapp", "post"] as const;

export type DonorType = (typeof DONOR_TYPE_OPTIONS)[number];
export type CitizenStatus = (typeof CITIZEN_STATUS_OPTIONS)[number];
export type ModeOfReceipt = (typeof MODE_OF_RECEIPT_OPTIONS)[number];
export type KycDocument =
  | "PAN"
  | "Aadhaar"
  | "Passport"
  | "PAN Unavailable";

export interface FundTypeItem {
  id?: number | string;
  name?: string;
  code?: string;
  status?: string;
}

export interface DonorRecord {
  id: number;
  donorId: string;
  donorName: string;
  donorType: DonorType;
  citizenStatus: CitizenStatus;
  fundType: string;
  kycDocument: KycDocument | "";
  idNumber: string;
  contactNumber: string;
  emailId: string;
  cinNumber: string;
  address: string;
  modeOfReceipt: ModeOfReceipt;
  contactPersonName: string;
  contactPersonMobileNo: string;
  contactPersonEmailId: string;
}

export type DonorFormData = Omit<DonorRecord, "id" | "donorId">;

export const DONOR_FORM_FIELD_ORDER = [
  "donorName",
  "donorType",
  "citizenStatus",
  "fundType",
  "kycDocument",
  "idNumber",
  "contactNumber",
  "emailId",
  "modeOfReceipt",
  "cinNumber",
  "address",
] as const;

export const DONOR_ADDRESS_FIELD_GRID_CLASS = "md:col-span-2 lg:col-span-3";

const INDIAN_KYC_OPTIONS: KycDocument[] = ["PAN", "Aadhaar"];
const FOREIGN_KYC_OPTIONS: KycDocument[] = ["Passport"];

export const isNoPanDonorType = (donorType: DonorType) =>
  donorType === "Donor without PAN" || donorType === "Anonymous donor";

export const shouldShowContactPersonFields = (donorType: DonorType) =>
  donorType === "Corporate" || donorType === "NGO";

export const shouldShowCinNumberField = (donorType: DonorType) =>
  donorType === "Corporate";

export const shouldUseBlankKycDocument = (
  donorType: DonorType,
  citizenStatus: CitizenStatus,
) => citizenStatus === "Foreign citizen" && shouldShowContactPersonFields(donorType);

export const shouldRequireKycAndIdNumber = (
  donorType: DonorType,
  citizenStatus: CitizenStatus,
) => !shouldUseBlankKycDocument(donorType, citizenStatus);

export const shouldShowVerifyPanButton = (kycDocument: KycDocument | "") =>
  kycDocument === "PAN";

export const getDonorAddAutoOpenDecision = (autoOpenAddToken?: number) => ({
  shouldOpen:
    typeof autoOpenAddToken === "number" && autoOpenAddToken > 0,
  nextToken: 0,
});

export const getNextDonorSerial = (
  existingRecords: Array<Partial<Pick<DonorRecord, "donorId" | "id">>>,
) => {
  const highestSerial = (existingRecords || []).reduce((max, donor, index) => {
    const match = String(donor.donorId || "").match(/^DON-(\d+)$/i);
    const sequence = match ? Number(match[1]) : index + 1;
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);

  return `DON-${String(highestSerial + 1).padStart(3, "0")}`;
};

export const getDefaultKycDocument = (
  donorType: DonorType,
  citizenStatus: CitizenStatus,
): KycDocument | "" => {
  if (shouldUseBlankKycDocument(donorType, citizenStatus)) return "";
  if (isNoPanDonorType(donorType)) return "PAN Unavailable";
  return citizenStatus === "Indian citizen" ? "PAN" : "Passport";
};

export const getAvailableKycDocuments = (
  donorType: DonorType,
  citizenStatus: CitizenStatus,
): KycDocument[] => {
  if (shouldUseBlankKycDocument(donorType, citizenStatus)) return [];

  const baseOptions =
    citizenStatus === "Indian citizen" ?
      [...INDIAN_KYC_OPTIONS]
    : [...FOREIGN_KYC_OPTIONS];

  if (isNoPanDonorType(donorType)) {
    return ["PAN Unavailable", ...baseOptions];
  }

  return baseOptions;
};

const matchesFundTypeKeyword = (fundType: FundTypeItem, keyword: "local" | "fcra") => {
  const haystack = `${fundType.name || ""} ${fundType.code || ""}`.toLowerCase();
  return haystack.includes(keyword);
};

export const getEligibleFundTypes = (
  citizenStatus: CitizenStatus,
  fundTypes: FundTypeItem[],
) => {
  const keyword = citizenStatus === "Indian citizen" ? "local" : "fcra";
  return (fundTypes || []).filter((fundType) => matchesFundTypeKeyword(fundType, keyword));
};

export const selectDefaultFundType = (
  citizenStatus: CitizenStatus,
  fundTypes: FundTypeItem[],
) => {
  return getEligibleFundTypes(citizenStatus, fundTypes)[0]?.name || "";
};

export const getInitialDonorFormData = (
  fundTypes: FundTypeItem[],
): DonorFormData => ({
  donorName: "",
  donorType: "Individual / HUF",
  citizenStatus: "Indian citizen",
  fundType: selectDefaultFundType("Indian citizen", fundTypes),
  kycDocument: getDefaultKycDocument("Individual / HUF", "Indian citizen"),
  idNumber: "",
  contactNumber: "",
  emailId: "",
  cinNumber: "",
  address: "",
  modeOfReceipt: "email",
  contactPersonName: "",
  contactPersonMobileNo: "",
  contactPersonEmailId: "",
});

export const sanitizeDonorFormData = (
  donorForm: DonorFormData,
): DonorFormData => {
  const sanitizedForm = {
    ...donorForm,
  };

  if (!shouldShowCinNumberField(sanitizedForm.donorType)) {
    sanitizedForm.cinNumber = "";
  }

  if (shouldUseBlankKycDocument(sanitizedForm.donorType, sanitizedForm.citizenStatus)) {
    sanitizedForm.kycDocument = "";
  }

  if (!shouldShowContactPersonFields(sanitizedForm.donorType)) {
    sanitizedForm.contactPersonName = "";
    sanitizedForm.contactPersonMobileNo = "";
    sanitizedForm.contactPersonEmailId = "";
  }

  return sanitizedForm;
};

export const upsertDonorRecord = <T extends { id: number }>(
  existingRecords: T[],
  donorRecord: T,
) => {
  const hasExisting = existingRecords.some((item) => item.id === donorRecord.id);
  if (!hasExisting) return [...existingRecords, donorRecord];

  return existingRecords.map((item) =>
    item.id === donorRecord.id ? donorRecord : item,
  );
};
