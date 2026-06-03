import assert from "node:assert/strict";

import {
  DONOR_ADDRESS_FIELD_GRID_CLASS,
  DONOR_FORM_FIELD_ORDER,
  getAvailableKycDocuments,
  getDefaultKycDocument,
  getInitialDonorFormData,
  getDonorAddAutoOpenDecision,
  getNextDonorSerial,
  sanitizeDonorFormData,
  selectDefaultFundType,
  shouldRequireKycAndIdNumber,
  shouldShowCinNumberField,
  shouldShowContactPersonFields,
  shouldShowVerifyPanButton,
  shouldUseBlankKycDocument,
  upsertDonorRecord,
} from "../components/donor/donorRules.ts";

const fundTypes = [
  { id: 1, name: "Local Funds", code: "LOCAL-01", status: "Active" },
  { id: 2, name: "FCRA Funds", code: "FCRA-01", status: "Active" },
  { id: 3, name: "General Fund", code: "GEN-01", status: "Active" },
];

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
};

runTest("Indian citizens default to PAN and can pick Aadhaar", () => {
  assert.equal(getDefaultKycDocument("Individual / HUF", "Indian citizen"), "PAN");
  assert.deepEqual(getAvailableKycDocuments("Individual / HUF", "Indian citizen"), [
    "PAN",
    "Aadhaar",
  ]);
});

runTest("Individual foreign citizens default to Passport", () => {
  assert.equal(getDefaultKycDocument("Individual / HUF", "Foreign citizen"), "Passport");
  assert.deepEqual(getAvailableKycDocuments("Individual / HUF", "Foreign citizen"), [
    "Passport",
  ]);
});

runTest("Foreign Corporate and NGO donors leave KYC document blank", () => {
  assert.equal(getDefaultKycDocument("Corporate", "Foreign citizen"), "");
  assert.equal(getDefaultKycDocument("NGO", "Foreign citizen"), "");
  assert.deepEqual(getAvailableKycDocuments("Corporate", "Foreign citizen"), []);
  assert.deepEqual(getAvailableKycDocuments("NGO", "Foreign citizen"), []);
  assert.equal(shouldUseBlankKycDocument("Corporate", "Foreign citizen"), true);
  assert.equal(shouldUseBlankKycDocument("NGO", "Foreign citizen"), true);
  assert.equal(shouldUseBlankKycDocument("Individual / HUF", "Foreign citizen"), false);
  assert.equal(shouldRequireKycAndIdNumber("Corporate", "Foreign citizen"), false);
  assert.equal(shouldRequireKycAndIdNumber("NGO", "Foreign citizen"), false);
  assert.equal(shouldRequireKycAndIdNumber("Individual / HUF", "Foreign citizen"), true);
});

runTest("Sanitizing foreign Corporate and NGO donors clears KYC but keeps manual ID number", () => {
  const corporate = sanitizeDonorFormData({
    ...getInitialDonorFormData(fundTypes),
    donorType: "Corporate",
    citizenStatus: "Foreign citizen",
    kycDocument: "Passport",
    idNumber: "P12345",
  });

  const ngo = sanitizeDonorFormData({
    ...getInitialDonorFormData(fundTypes),
    donorType: "NGO",
    citizenStatus: "Foreign citizen",
    kycDocument: "Passport",
    idNumber: "N12345",
  });

  assert.equal(corporate.kycDocument, "");
  assert.equal(corporate.idNumber, "P12345");
  assert.equal(ngo.kycDocument, "");
  assert.equal(ngo.idNumber, "N12345");
});

runTest("Donor without PAN and anonymous donor default to PAN Unavailable", () => {
  assert.equal(
    getDefaultKycDocument("Donor without PAN", "Indian citizen"),
    "PAN Unavailable",
  );
  assert.equal(
    getDefaultKycDocument("Anonymous donor", "Foreign citizen"),
    "PAN Unavailable",
  );
});

runTest("Anonymous foreign donors can still switch from PAN Unavailable to Passport if needed", () => {
  assert.deepEqual(getAvailableKycDocuments("Anonymous donor", "Foreign citizen"), [
    "PAN Unavailable",
    "Passport",
  ]);
});

runTest("Fund type defaults are selected from the matching master entries", () => {
  assert.equal(selectDefaultFundType("Indian citizen", fundTypes), "Local Funds");
  assert.equal(selectDefaultFundType("Foreign citizen", fundTypes), "FCRA Funds");
});

runTest("Corporate and NGO donors show contact person fields", () => {
  assert.equal(shouldShowContactPersonFields("Corporate"), true);
  assert.equal(shouldShowContactPersonFields("NGO"), true);
  assert.equal(shouldShowContactPersonFields("Individual / HUF"), false);
  assert.equal(shouldShowContactPersonFields("Donor without PAN"), false);
});

runTest("Donor form places Mode of Receipt after Email ID and Address after it", () => {
  const emailIndex = DONOR_FORM_FIELD_ORDER.indexOf("emailId");
  const modeIndex = DONOR_FORM_FIELD_ORDER.indexOf("modeOfReceipt");
  const cinIndex = DONOR_FORM_FIELD_ORDER.indexOf("cinNumber");
  const addressIndex = DONOR_FORM_FIELD_ORDER.indexOf("address");

  assert.equal(modeIndex, emailIndex + 1);
  assert.equal(cinIndex, modeIndex + 1);
  assert.ok(addressIndex > modeIndex);
});

runTest("Address field spans the full donor form row", () => {
  assert.equal(DONOR_ADDRESS_FIELD_GRID_CLASS, "md:col-span-2 lg:col-span-3");
});

runTest("Verify PAN button is only visible for PAN KYC documents", () => {
  assert.equal(shouldShowVerifyPanButton("PAN"), true);
  assert.equal(shouldShowVerifyPanButton("Aadhaar"), false);
  assert.equal(shouldShowVerifyPanButton("Passport"), false);
  assert.equal(shouldShowVerifyPanButton("PAN Unavailable"), false);
  assert.equal(shouldShowVerifyPanButton(""), false);
});

runTest("CIN Number field is only visible for Corporate donors", () => {
  assert.equal(shouldShowCinNumberField("Corporate"), true);
  assert.equal(shouldShowCinNumberField("NGO"), false);
  assert.equal(shouldShowCinNumberField("Individual / HUF"), false);
  assert.equal(shouldShowCinNumberField("Donor without PAN"), false);
  assert.equal(shouldShowCinNumberField("Anonymous donor"), false);
});

runTest("Donor form initializes and clears CIN Number for non-corporate donors", () => {
  assert.equal(getInitialDonorFormData(fundTypes).cinNumber, "");

  const sanitized = sanitizeDonorFormData({
    ...getInitialDonorFormData(fundTypes),
    donorType: "NGO",
    cinNumber: "U12345MH2024NPL123456",
  });

  assert.equal(sanitized.cinNumber, "");
});

runTest("Donor add auto-open token is consumed after opening once", () => {
  assert.deepEqual(getDonorAddAutoOpenDecision(1774000000000), {
    shouldOpen: true,
    nextToken: 0,
  });
  assert.deepEqual(getDonorAddAutoOpenDecision(0), {
    shouldOpen: false,
    nextToken: 0,
  });
  assert.deepEqual(getDonorAddAutoOpenDecision(-1), {
    shouldOpen: false,
    nextToken: 0,
  });
  assert.deepEqual(getDonorAddAutoOpenDecision(undefined), {
    shouldOpen: false,
    nextToken: 0,
  });
});

runTest("Next donor serial uses DON prefix and the highest existing sequence", () => {
  assert.equal(getNextDonorSerial([]), "DON-001");
  assert.equal(
    getNextDonorSerial([
      { id: 1, donorId: "DON-001" },
      { id: 2, donorId: "DON-009" },
      { id: 3, donorId: "LEGACY" },
    ]),
    "DON-010",
  );
  assert.equal(
    getNextDonorSerial([{ id: 1 }, { id: 2 }, { id: 3 }]),
    "DON-004",
  );
});

runTest("Upsert replaces existing donor rows and appends new donors", () => {
  const existing = [
    { id: 100, donorName: "Alpha Foundation", donorType: "NGO" },
  ];

  const updated = upsertDonorRecord(existing, {
    id: 100,
    donorName: "Alpha Foundation Trust",
    donorType: "NGO",
  });

  assert.deepEqual(updated, [
    { id: 100, donorName: "Alpha Foundation Trust", donorType: "NGO" },
  ]);

  const appended = upsertDonorRecord(updated, {
    id: 200,
    donorName: "Priya Rao",
    donorType: "Individual / HUF",
  });

  assert.deepEqual(appended, [
    { id: 100, donorName: "Alpha Foundation Trust", donorType: "NGO" },
    { id: 200, donorName: "Priya Rao", donorType: "Individual / HUF" },
  ]);
});
