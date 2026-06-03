import assert from "node:assert/strict";

import {
  generateReceiptForDonation,
  getAvailableDonationTypes,
  getDonationReceiptBuckets,
  get80GEligibilityBreakup,
  getFinancialYearLabel,
  getFundReceiptPrefix,
  getReceiptNumber,
  getRequiredDonationFields,
  filterRecordedDonations,
  markDonationReceiptPosted,
  markDonationValidated,
  searchDonors,
  selectBankAccountLedgers,
  validateDonationForReceipt,
} from "../components/donor/donationRules.ts";

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
};

const donors: any[] = [
  {
    id: 1,
    donorName: "Asha Rao",
    donorType: "Individual / HUF",
    citizenStatus: "Indian citizen",
    fundType: "Local Funds",
    kycDocument: "PAN",
    idNumber: "AAAAA0000A",
    contactNumber: "9876543210",
    emailId: "asha@example.org",
    cinNumber: "",
    address: "Mumbai",
    modeOfReceipt: "email",
    contactPersonName: "",
    contactPersonMobileNo: "",
    contactPersonEmailId: "",
  },
  {
    id: 2,
    donorName: "Global Aid",
    donorType: "NGO",
    citizenStatus: "Foreign citizen",
    fundType: "FCRA Funds",
    kycDocument: "Passport",
    idNumber: "P998877",
    contactNumber: "9123456780",
    emailId: "contact@global.example",
    cinNumber: "",
    address: "Delhi",
    modeOfReceipt: "post",
    contactPersonName: "Maya",
    contactPersonMobileNo: "9000000000",
    contactPersonEmailId: "maya@global.example",
  },
  {
    id: 3,
    donorName: "Metro CSR Private Limited",
    donorType: "Corporate",
    citizenStatus: "Indian citizen",
    fundType: "Local Funds",
    kycDocument: "PAN",
    idNumber: "AAFCM1234P",
    contactNumber: "9988776655",
    emailId: "csr@metro.example",
    cinNumber: "U12345MH2024PTC123456",
    address: "Bengaluru",
    modeOfReceipt: "whatsapp",
    contactPersonName: "Ravi",
    contactPersonMobileNo: "9111111111",
    contactPersonEmailId: "ravi@metro.example",
  },
  {
    id: 4,
    donorName: "Rohan Iyer",
    donorType: "Individual / HUF",
    citizenStatus: "Indian citizen",
    fundType: "Local Funds",
    kycDocument: "Aadhaar",
    idNumber: "123412341234",
    contactNumber: "9776655443",
    emailId: "rohan@example.org",
    cinNumber: "",
    address: "Chennai",
    modeOfReceipt: "email",
    contactPersonName: "",
    contactPersonMobileNo: "",
    contactPersonEmailId: "",
  },
];

const chartOfAccounts = [
  {
    master: "Assets",
    groups: [
      {
        name: "Current Assets",
        ledgers: ["Cash in Hand", "Bank Accounts - FCRA", "Bank Account Local"],
      },
      {
        name: "Fixed Assets",
        ledgers: ["Office Equipment"],
      },
    ],
  },
  {
    master: "Liabilities",
    groups: [
      {
        name: "Borrowings",
        ledgers: ["Bank Loan"],
      },
    ],
  },
];

const validPendingDonation: any = {
  id: 101,
  donorId: 1,
  donorName: "Asha Rao",
  donorType: "Individual / HUF",
  donationDate: "2026-04-14",
  donationType: "General Donation",
  amount: "2500",
  projectId: "P1",
  projectName: "General Purpose",
  fundType: "Local Funds",
  modeOfReceipt: "Bank Transfer",
  bankAccount: "Bank Account Local",
  transactionReference: "UTR-123",
  chequeBankName: "",
  location: "Mumbai Office",
  receiptNumber: "",
  receiptSent: "No",
  validationStatus: "Pending",
  receiptPosted: "No",
  receiptPostedDate: "",
  createdAt: "2026-04-14T10:00:00.000Z",
};

runTest("Donation types are filtered by donor type", () => {
  assert.deepEqual(getAvailableDonationTypes("Individual / HUF"), [
    "General Donation",
    "Corpus Donation",
  ]);
  assert.deepEqual(getAvailableDonationTypes("Donor without PAN"), [
    "General Donation",
    "Corpus Donation",
  ]);
  assert.deepEqual(getAvailableDonationTypes("Corporate"), [
    "General Donation",
    "CSR Grant",
    "Other Grant",
    "Corpus Donation",
  ]);
  assert.deepEqual(getAvailableDonationTypes("NGO"), [
    "General Donation",
    "Other Grant",
    "Corpus Donation",
  ]);
});

runTest("Donor search supports name, email, PAN, passport, mobile, and Aadhaar", () => {
  assert.deepEqual(searchDonors(donors, "asha").map((item) => item.id), [1]);
  assert.deepEqual(searchDonors(donors, "csr@metro.example").map((item) => item.id), [3]);
  assert.deepEqual(searchDonors(donors, "AAAAA0000A").map((item) => item.id), [1]);
  assert.deepEqual(searchDonors(donors, "P998877").map((item) => item.id), [2]);
  assert.deepEqual(searchDonors(donors, "9988776655").map((item) => item.id), [3]);
  assert.deepEqual(searchDonors(donors, "123412341234").map((item) => item.id), [4]);
});

runTest("Bank account ledgers come only from asset bank accounts", () => {
  assert.deepEqual(selectBankAccountLedgers(chartOfAccounts), [
    "Bank Accounts - FCRA",
    "Bank Account Local",
  ]);
});

runTest("80G breakup caps cash donation eligibility at Rs. 2,000", () => {
  assert.deepEqual(
    get80GEligibilityBreakup({
      amount: "2500",
      modeOfReceipt: "Cash",
    }),
    {
      eligibleAmount: 2000,
      ineligibleAmount: 500,
      hasCashCapApplied: true,
    },
  );
  assert.deepEqual(
    get80GEligibilityBreakup({
      amount: "2000",
      modeOfReceipt: "Cash",
    }),
    {
      eligibleAmount: 2000,
      ineligibleAmount: 0,
      hasCashCapApplied: false,
    },
  );
  assert.deepEqual(
    get80GEligibilityBreakup({
      amount: "2500",
      modeOfReceipt: "Bank Transfer",
    }),
    {
      eligibleAmount: 2500,
      ineligibleAmount: 0,
      hasCashCapApplied: false,
    },
  );
  assert.deepEqual(
    get80GEligibilityBreakup({
      amount: "2500",
      modeOfReceipt: "Cheque",
    }),
    {
      eligibleAmount: 2500,
      ineligibleAmount: 0,
      hasCashCapApplied: false,
    },
  );
});

runTest("Recorded donation filters match every displayed donation column", () => {
  const donations = [
    {
      ...validPendingDonation,
      id: 301,
      donorName: "Asha Rao",
      donationDate: "2026-04-14",
      amount: "20000",
      donationType: "General Donation",
      projectName: "Solar Grid 1",
      fundType: "Local Funds",
      modeOfReceipt: "Cash",
      bankAccount: "",
      transactionReference: "",
      chequeBankName: "",
      location: "Bengaluru Office",
      receiptNumber: "",
      receiptSent: "No",
    },
    {
      ...validPendingDonation,
      id: 302,
      donorName: "Metro CSR Private Limited",
      donationDate: "2026-04-20",
      amount: "75000",
      donationType: "CSR Grant",
      projectName: "Digital Literacy",
      fundType: "FCRA Funds",
      modeOfReceipt: "Cheque",
      bankAccount: "Bank Account Local",
      transactionReference: "CHQ-2026",
      chequeBankName: "HDFC Bank",
      location: "Mumbai Office",
      receiptNumber: "LC/2026-2027/003",
      receiptSent: "Yes",
    },
  ];

  assert.deepEqual(
    filterRecordedDonations(donations, { receiptNumber: "pending" }).map(
      (item) => item.id,
    ),
    [301],
  );
  assert.deepEqual(
    filterRecordedDonations(donations, {
      donorName: "metro",
      donationDate: "20/04/2026",
      amount: "75,000",
      eightyGEligibleAmount: "75,000",
      eightyGIneligibleAmount: "0",
      donationType: "csr",
      projectName: "digital",
      fundType: "fcra",
      modeOfReceipt: "cheque",
      bankAccount: "local",
      transactionReference: "chq",
      chequeBankName: "hdfc",
      location: "mumbai",
      receiptSent: "yes",
      receiptAction: "generated",
    }).map((item) => item.id),
    [302],
  );
  assert.deepEqual(
    filterRecordedDonations(donations, {
      modeOfReceipt: "cash",
      eightyGEligibleAmount: "2,000",
      eightyGIneligibleAmount: "18,000",
    }).map((item) => item.id),
    [301],
  );
});

runTest("Donation receipt numbers use fund type and financial year", () => {
  assert.equal(getFinancialYearLabel("2026-04-01"), "2026-2027");
  assert.equal(getFinancialYearLabel("2027-03-31"), "2026-2027");
  assert.equal(getFundReceiptPrefix({ name: "Local Funds", code: "LC" }), "LC");
  assert.equal(getFundReceiptPrefix({ name: "FCRA Funds", code: "FC" }), "FC");
  assert.equal(getReceiptNumber("Local Funds", "2026-04-14", [], [
    { name: "Local Funds", code: "LC" },
  ]), "LC/2026-2027/001");
  assert.equal(getReceiptNumber("FCRA Funds", "2026-05-01", [
    { receiptNumber: "FC/2026-2027/001" },
    { receiptNumber: "LC/2026-2027/001" },
  ], [
    { name: "FCRA Funds", code: "FC" },
  ]), "FC/2026-2027/002");
});

runTest("Receipt mode controls required bank and reference fields", () => {
  assert.deepEqual(getRequiredDonationFields("Cash"), [
    "donorId",
    "donationDate",
    "donationType",
    "amount",
    "projectId",
    "fundType",
    "modeOfReceipt",
    "location",
  ]);
  assert.deepEqual(getRequiredDonationFields("Cheque"), [
    "donorId",
    "donationDate",
    "donationType",
    "amount",
    "projectId",
    "fundType",
    "modeOfReceipt",
    "location",
    "bankAccount",
    "transactionReference",
    "chequeBankName",
  ]);
});

runTest("Cheque receipts require the cheque bank name", () => {
  const chequeDonation = {
    ...validPendingDonation,
    modeOfReceipt: "Cheque",
    transactionReference: "CHK-1001",
    chequeBankName: "",
  };

  assert.deepEqual(getRequiredDonationFields("Cheque"), [
    "donorId",
    "donationDate",
    "donationType",
    "amount",
    "projectId",
    "fundType",
    "modeOfReceipt",
    "location",
    "bankAccount",
    "transactionReference",
    "chequeBankName",
  ]);
  assert.deepEqual(validateDonationForReceipt(chequeDonation, donors), {
    valid: false,
    errors: ["Name of Bank (cheque) is required for Cheque receipts."],
  });
});

runTest("Donation validation checks donor, amount, required fields, and donation type", () => {
  assert.deepEqual(validateDonationForReceipt(validPendingDonation, donors), {
    valid: true,
    errors: [],
  });

  const invalidDonation = {
    ...validPendingDonation,
    donorId: 999,
    amount: "0",
    transactionReference: "",
    donationType: "CSR Grant",
  };

  assert.deepEqual(validateDonationForReceipt(invalidDonation, donors), {
    valid: false,
    errors: [
      "Donor was not found in donor database.",
      "Donation amount must be greater than 0.",
      "Transaction reference is required for Bank Transfer receipts.",
      "Donation type is not allowed for this donor.",
    ],
  });
});

runTest("Donation receipt buckets follow validation, generation, and postal posting status", () => {
  const pendingValidation = { ...validPendingDonation, id: 201 };
  const pendingGeneration = markDonationValidated({
    ...validPendingDonation,
    id: 202,
  });
  const generatedPostReceipt = {
    ...markDonationValidated({
      ...validPendingDonation,
      id: 203,
      donorId: 2,
      donorName: "Global Aid",
      donorType: "NGO",
      fundType: "FCRA Funds",
      modeOfReceipt: "Cash",
      bankAccount: "",
      transactionReference: "",
    }),
    receiptNumber: "FC/2026-2027/001",
  };
  const generatedEmailReceipt = {
    ...markDonationValidated({
      ...validPendingDonation,
      id: 204,
    }),
    receiptNumber: "LC/2026-2027/001",
  };

  const buckets = getDonationReceiptBuckets(
    [
      pendingValidation,
      pendingGeneration,
      generatedPostReceipt,
      generatedEmailReceipt,
    ],
    donors,
  );

  assert.deepEqual(buckets.pendingValidation.map((item) => item.id), [201]);
  assert.deepEqual(buckets.pendingGeneration.map((item) => item.id), [202]);
  assert.deepEqual(buckets.generated.map((item) => item.id), [203, 204]);
  assert.deepEqual(buckets.pendingPosting.map((item) => item.id), [203]);
});

runTest("Receipt generation requires validation and assigns the next receipt number", () => {
  assert.throws(
    () => generateReceiptForDonation(validPendingDonation, [], [
      { name: "Local Funds", code: "LC" },
    ]),
    /validated/,
  );

  const generated = generateReceiptForDonation(
    markDonationValidated(validPendingDonation),
    [{ receiptNumber: "LC/2026-2027/001" } as any],
    [{ name: "Local Funds", code: "LC" }],
  );

  assert.equal(generated.receiptNumber, "LC/2026-2027/002");
});

runTest("Postal posting requires a generated receipt and stores the posted date", () => {
  assert.throws(
    () => markDonationReceiptPosted(validPendingDonation, "2026-04-15"),
    /generated receipt/,
  );

  const posted = markDonationReceiptPosted(
    {
      ...markDonationValidated(validPendingDonation),
      receiptNumber: "LC/2026-2027/001",
    },
    "2026-04-15",
  );

  assert.equal(posted.receiptPosted, "Yes");
  assert.equal(posted.receiptPostedDate, "2026-04-15");
});
