export interface BankDetailsParts {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
}

export const emptyBankDetails = (): BankDetailsParts => ({
  accountName: "",
  accountNumber: "",
  bankName: "",
  ifscCode: "",
  branchName: "",
});

export const composeBankDetails = (parts: BankDetailsParts) =>
  [
    parts.accountName ? `Account Name: ${parts.accountName}` : "",
    parts.accountNumber ? `Account Number: ${parts.accountNumber}` : "",
    parts.bankName ? `Bank Name: ${parts.bankName}` : "",
    parts.ifscCode ? `IFSC Code: ${parts.ifscCode}` : "",
    parts.branchName ? `Branch: ${parts.branchName}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

export const parseBankDetails = (value: string | undefined): BankDetailsParts => {
  const raw = String(value || "").trim();
  if (!raw) return emptyBankDetails();

  const parts = emptyBankDetails();
  const segments = raw.split("|").map((segment) => segment.trim());

  segments.forEach((segment) => {
    const normalized = segment.toLowerCase();
    const cleanValue = segment.includes(":") ? segment.split(":").slice(1).join(":").trim() : segment.trim();

    if (normalized.includes("account name")) {
      parts.accountName = cleanValue;
      return;
    }
    if (normalized.includes("account number") || normalized.includes("a/c no")) {
      parts.accountNumber = cleanValue;
      return;
    }
    if (normalized.includes("bank name") || normalized.startsWith("bank")) {
      parts.bankName = cleanValue;
      return;
    }
    if (normalized.includes("ifsc")) {
      parts.ifscCode = cleanValue;
      return;
    }
    if (normalized.includes("branch")) {
      parts.branchName = cleanValue;
    }
  });

  if (
    !parts.accountName &&
    !parts.accountNumber &&
    !parts.bankName &&
    !parts.ifscCode &&
    !parts.branchName
  ) {
    parts.accountName = raw;
  }

  return parts;
};
