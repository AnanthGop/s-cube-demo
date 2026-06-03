import assert from "node:assert/strict";

import {
  FORM_10BD_COLUMNS,
  buildForm10BDRows,
  buildForm10BDCsv,
  buildForm10BDReconciliation,
  getDeclaredDonationIds,
  getForm10BDEligibility,
  getForm10BEDonationMatches,
  markForm10BDFilingUploaded,
} from "../components/donor/form10bdRules.ts";

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
    donorName: "Asha Mehta",
    donorType: "Individual / HUF",
    kycDocument: "PAN",
    idNumber: "AFZPM1234K",
    address: "14, Prabhadevi Road, Mumbai",
  },
  {
    id: 2,
    donorName: "Rohan Iyer",
    donorType: "Individual / HUF",
    kycDocument: "Aadhaar",
    idNumber: "456712348901",
    address: "22, Indiranagar, Bengaluru",
  },
  {
    id: 3,
    donorName: "Kavita Deshmukh",
    donorType: "Donor without PAN",
    kycDocument: "PAN Unavailable",
    idNumber: "PAN-UNAVAILABLE",
    address: "41, Karve Nagar, Pune",
  },
  {
    id: 4,
    donorName: "Anonymous Local Donor",
    donorType: "Anonymous donor",
    kycDocument: "PAN Unavailable",
    idNumber: "ANONYMOUS",
    address: "Address withheld",
  },
  {
    id: 5,
    donorName: "Metro CSR Private Limited",
    donorType: "Corporate",
    kycDocument: "PAN",
    idNumber: "AAFCM1234P",
    address: "Andheri East, Mumbai",
  },
];

const company: any = {
  id: 10,
  name: "S Cube Foundation",
  eightyGNo: "80G/2026/1234",
  eightyGDate: "31/03/2028",
};

const donations: any[] = [
  {
    id: 101,
    donorId: 1,
    donorName: "Asha Mehta",
    donorType: "Individual / HUF",
    donationDate: "2026-04-14",
    donationType: "General Donation",
    amount: "5000",
    modeOfReceipt: "Bank Transfer",
    projectName: "Solar Grid",
    fundType: "Local Funds",
  },
  {
    id: 102,
    donorId: 5,
    donorName: "Metro CSR Private Limited",
    donorType: "Corporate",
    donationDate: "2026-04-15",
    donationType: "CSR Grant",
    amount: "250000",
    modeOfReceipt: "Cheque",
    projectName: "Digital Literacy",
    fundType: "Local Funds",
  },
  {
    id: 103,
    donorId: 1,
    donorName: "Asha Mehta",
    donorType: "Individual / HUF",
    donationDate: "2026-04-16",
    donationType: "Corpus Donation",
    amount: "2000",
    modeOfReceipt: "Cash",
    projectName: "Corpus",
    fundType: "Local Funds",
  },
  {
    id: 104,
    donorId: 1,
    donorName: "Asha Mehta",
    donorType: "Individual / HUF",
    donationDate: "2026-04-17",
    donationType: "General Donation",
    amount: "2001",
    modeOfReceipt: "Cash",
    projectName: "Solar Grid",
    fundType: "Local Funds",
  },
  {
    id: 105,
    donorId: 2,
    donorName: "Rohan Iyer",
    donorType: "Individual / HUF",
    donationDate: "2026-04-18",
    donationType: "General Donation",
    amount: "1200",
    modeOfReceipt: "Bank Transfer",
    projectName: "Solar Grid",
    fundType: "Local Funds",
  },
  {
    id: 106,
    donorId: 3,
    donorName: "Kavita Deshmukh",
    donorType: "Donor without PAN",
    donationDate: "2026-04-19",
    donationType: "General Donation",
    amount: "1500",
    modeOfReceipt: "Bank Transfer",
    projectName: "Solar Grid",
    fundType: "Local Funds",
  },
  {
    id: 107,
    donorId: 4,
    donorName: "Anonymous Local Donor",
    donorType: "Anonymous donor",
    donationDate: "2026-04-20",
    donationType: "General Donation",
    amount: "2500",
    modeOfReceipt: "Bank Transfer",
    projectName: "Solar Grid",
    fundType: "Local Funds",
  },
];

runTest("Form 10BD eligibility includes only PAN donors and excludes disallowed donations", () => {
  const result = getForm10BDEligibility({
    donations,
    donors,
    filings: [],
    dateFrom: "2026-04-01",
    dateTo: "2026-04-30",
  });

  assert.deepEqual(result.eligible.map((item) => item.donation.id), [
    101,
    102,
    103,
  ]);
  assert.deepEqual(
    result.excluded.map((item) => [item.donation.id, item.reasonCode]),
    [
      [104, "CASH_DONATION_OVER_2000"],
      [105, "DONOR_WITHOUT_PAN"],
      [106, "DONOR_WITHOUT_PAN"],
      [107, "ANONYMOUS_DONOR"],
    ],
  );
});

runTest("Form 10BD eligibility respects date ranges and already uploaded declarations", () => {
  const filings: any[] = [
    {
      id: 9001,
      status: "Generated",
      donationIds: [101],
    },
    {
      id: 9002,
      status: "Uploaded",
      donationIds: [102],
      uploadDate: "2026-05-05",
      attachment: { fileName: "form-10bd.csv" },
    },
  ];

  const result = getForm10BDEligibility({
    donations,
    donors,
    filings,
    dateFrom: "2026-04-14",
    dateTo: "2026-04-15",
  });

  assert.deepEqual(result.eligible.map((item) => item.donation.id), [101]);
  assert.deepEqual(result.excluded.map((item) => item.donation.id), [102]);
  assert.equal(result.excluded[0].reasonCode, "ALREADY_DECLARED");
  assert.deepEqual(getDeclaredDonationIds(filings), new Set([102]));
});

runTest("Form 10BD rows use prescribed columns, PAN ID code, 80G section, and company 80G number", () => {
  const rows = buildForm10BDRows({
    donations: donations.slice(0, 3),
    donors,
    company,
  });

  assert.deepEqual(Object.keys(rows[0]), FORM_10BD_COLUMNS);
  assert.equal(rows[0]["Unique Identification Number of the donor"], "AFZPM1234K");
  assert.equal(rows[0]["ID code"], "1");
  assert.equal(rows[0]["Section code"], "Section 80G");
  assert.equal(rows[0]["Unique Registration Number"], "80G/2026/1234");
  assert.equal(rows[0]["Date of Issuance of Unique Registration Number"], "31/03/2028");
  assert.equal(rows[0]["Donation Type"], "Others");
  assert.equal(rows[1]["Donation Type"], "Specific grant");
  assert.equal(rows[2]["Donation Type"], "Corpus");
  assert.equal(rows[1]["Mode of receipt"], "Electronic modes including account payee cheque/draft");
});

runTest("Form 10BD CSV escapes portal upload columns", () => {
  const csv = buildForm10BDCsv([
    {
      "Sl. No.": "1",
      "Pre Acknowledgement No.": "",
      "Unique Identification Number of the donor": "AFZPM1234K",
      "ID code": "1",
      "Section code": "Section 80G",
      "Unique Registration Number": "80G/2026/1234",
      "Date of Issuance of Unique Registration Number": "31/03/2028",
      "Name of donor": "Asha, Mehta",
      "Address of donor": "14, Prabhadevi Road",
      "Donation Type": "Others",
      "Mode of receipt": "Cash",
      "Amount of donation": "2000",
    },
  ]);

  assert.ok(csv.startsWith(FORM_10BD_COLUMNS.join(",")));
  assert.ok(csv.includes('"Asha, Mehta"'));
  assert.ok(csv.includes('"14, Prabhadevi Road"'));
});

runTest("Uploaded Form 10BD filing stores upload evidence without changing donation IDs", () => {
  const uploaded = markForm10BDFilingUploaded(
    {
      id: 9001,
      status: "Generated",
      donationIds: [101, 102],
    } as any,
    {
      uploadDate: "2026-05-05",
      acknowledgementNumber: "ACK-10BD-001",
      attachment: {
        fileName: "portal-upload-confirmation.pdf",
        storedFileName: "9001.pdf",
        url: "/api/attachments/9001.pdf",
      },
    },
  );

  assert.equal(uploaded.status, "Uploaded");
  assert.equal(uploaded.uploadDate, "2026-05-05");
  assert.equal(uploaded.acknowledgementNumber, "ACK-10BD-001");
  assert.deepEqual(uploaded.donationIds, [101, 102]);
  assert.equal(uploaded.attachment?.fileName, "portal-upload-confirmation.pdf");
});

runTest("Reconciliation ties declared, not declared, and total donations for a financial year", () => {
  const reconciliation = buildForm10BDReconciliation({
    donations,
    donors,
    filings: [
      {
        id: 9001,
        status: "Uploaded",
        donationIds: [101, 102],
        uploadDate: "2026-05-05",
        attachment: { fileName: "form-10bd.csv" },
      } as any,
    ],
    dateFrom: "2026-04-01",
    dateTo: "2027-03-31",
  });

  assert.equal(reconciliation.declaredAmount, 255000);
  assert.equal(reconciliation.notDeclaredAmount, 9201);
  assert.equal(reconciliation.totalAmount, 264201);
  assert.equal(
    reconciliation.notDeclaredGroups.find((group) => group.reasonCode === "CASH_DONATION_OVER_2000")
      ?.amount,
    2001,
  );
  assert.equal(
    reconciliation.notDeclaredGroups.find((group) => group.reasonCode === "DONOR_WITHOUT_PAN")
      ?.amount,
    2700,
  );
  assert.equal(
    reconciliation.notDeclaredGroups.find((group) => group.reasonCode === "ANONYMOUS_DONOR")
      ?.amount,
    2500,
  );
  assert.equal(
    reconciliation.notDeclaredGroups.find((group) => group.reasonCode === "PENDING_10BD_UPLOAD")
      ?.amount,
    2000,
  );
});

runTest("Form 10BE portal files can only match donations already declared in Form 10BD", () => {
  const matches = getForm10BEDonationMatches({
    form10BEFiles: [
      {
        id: 1,
        donorPan: "AFZPM1234K",
        donationAmount: "5000",
        donationDate: "2026-04-14",
        fileName: "Asha-10BE.pdf",
      },
      {
        id: 2,
        donorPan: "AAFCM1234P",
        donationAmount: "250000",
        donationDate: "2026-04-15",
        fileName: "Metro-10BE.pdf",
      },
      {
        id: 3,
        donorPan: "AFZPM1234K",
        donationAmount: "2000",
        donationDate: "2026-04-16",
        fileName: "Cash-10BE.pdf",
      },
    ] as any,
    donations,
    donors,
    filings: [
      {
        id: 9001,
        status: "Uploaded",
        donationIds: [101, 102],
        uploadDate: "2026-05-05",
        attachment: { fileName: "form-10bd.csv" },
      } as any,
    ],
  });

  assert.deepEqual(matches.matched.map((item) => item.donation.id), [101, 102]);
  assert.deepEqual(matches.unmatched.map((item) => item.file.id), [3]);
  assert.equal(matches.unmatched[0].reasonCode, "DONATION_NOT_DECLARED_IN_10BD");
});
