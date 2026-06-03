import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildRentVoucherSnapshots } from "../components/requisitions/rentVoucherUtils.ts";

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
};

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as T;

const rentRecords = readJson<any[]>(
  "../json_files/Requisitions/rent/records.json",
);
const financialYears = readJson<any[]>("../json_files/admin_fy.json");
const tdsRules = readJson<any[]>("../json_files/admin_tds.json");
const persistedVouchers = readJson<any[]>(
  "../json_files/Requisitions/rent/vouchers.json",
);
const journalMappings = readJson<any[]>(
  "../json_files/Requisitions/rent/journal_voucher_master.json",
);
const tdsAccountMappings = readJson<any[]>(
  "../json_files/Requisitions/rent/tds_account.json",
);

const findMonth = (snapshot: any, landlordName: string, monthKey: string) => {
  const landlord = snapshot.landlords.find(
    (item: any) => item.landlordName === landlordName,
  );
  assert.ok(landlord, `${landlordName} should be present in the schedule`);
  const month = landlord.monthlyDetails.find(
    (item: any) => item.monthKey === monthKey,
  );
  assert.ok(month, `${landlordName} should include ${monthKey}`);
  return month;
};

runTest("Rent dummy records cover the full active and inactive master flow", () => {
  assert.equal(rentRecords.length, 5);
  assert.deepEqual(
    rentRecords.map((record) => record.id),
    ["R001", "R002", "R003", "R004", "R005"],
  );
  assert.equal(
    rentRecords.filter((record) => record.activeForJV === "Y").length,
    4,
  );
  assert.ok(
    rentRecords.some(
      (record) =>
        record.renewalIn2Months === "Yes" && record.status === "Renewal Due",
    ),
  );
  assert.ok(
    rentRecords.some(
      (record) =>
        record.securityDepositRefunded === "Y" &&
        record.activeForJV === "N",
    ),
  );
});

runTest("Rent dummy mappings are available for voucher posting", () => {
  const mappedLandlords = journalMappings.map((item) => item.landlordName);
  assert.deepEqual(mappedLandlords, [
    "Asha Properties LLP",
    "Eastview Foundation",
    "Meridian Workspace Pvt Ltd",
    "North Star Trust",
  ]);
  assert.equal(tdsAccountMappings[0].accountName, "TDS Account (194I)");
  assert.equal(tdsAccountMappings[0].type, "Rent of Land and Building");
});

runTest("Rent dummy schedules exercise increments, TDS, and short agreements", () => {
  const snapshots = buildRentVoucherSnapshots(
    rentRecords,
    financialYears,
    tdsRules,
  );
  const fy2026 = snapshots.find(
    (snapshot) => snapshot.financialYearName === "2026-2027",
  );
  assert.ok(fy2026, "FY 2026-2027 schedule should be generated");
  assert.equal(fy2026.landlords.length, 4);

  assert.deepEqual(findMonth(fy2026, "Asha Properties LLP", "2026-04"), {
    monthKey: "2026-04",
    monthLabel: "Apr 2026",
    amount: 52000,
    tdsAmount: 5200,
    netAmount: 46800,
    expenseVoucherNo: "EV-202604-ASHAP",
    paymentVoucherNo: "PV-202604-ASHAP",
  });
  assert.equal(
    findMonth(fy2026, "Asha Properties LLP", "2027-01").amount,
    54600,
  );
  assert.equal(
    findMonth(fy2026, "Meridian Workspace Pvt Ltd", "2026-07").amount,
    39000,
  );
  assert.equal(findMonth(fy2026, "North Star Trust", "2026-06").tdsAmount, 0);
  assert.equal(findMonth(fy2026, "Eastview Foundation", "2026-04").amount, 0);
  assert.equal(findMonth(fy2026, "Eastview Foundation", "2026-05").amount, 22000);
  assert.equal(findMonth(fy2026, "Eastview Foundation", "2026-09").amount, 0);
});

runTest("Persisted rent voucher dummy data includes the current schedule handoff", () => {
  const fy2026 = persistedVouchers.find(
    (snapshot) => snapshot.financialYearName === "2026-2027",
  );
  assert.ok(fy2026, "Persisted voucher data should include FY 2026-2027");
  assert.equal(findMonth(fy2026, "Asha Properties LLP", "2026-06").approved, "Y");
  assert.equal(
    findMonth(fy2026, "Meridian Workspace Pvt Ltd", "2026-06")
      .expenseVoucherCreated,
    "Y",
  );
});

runTest("Rent voucher schedules expose voucher numbers for payable old entries", () => {
  const fy2026 = persistedVouchers.find(
    (snapshot) => snapshot.financialYearName === "2026-2027",
  );
  assert.ok(fy2026, "Persisted voucher data should include FY 2026-2027");

  assert.deepEqual(
    {
      expenseVoucherNo: findMonth(
        fy2026,
        "Asha Properties LLP",
        "2026-04",
      ).expenseVoucherNo,
      paymentVoucherNo: findMonth(
        fy2026,
        "Asha Properties LLP",
        "2026-04",
      ).paymentVoucherNo,
    },
    {
      expenseVoucherNo: "EV-202604-ASHAP",
      paymentVoucherNo: "PV-202604-ASHAP",
    },
  );
  assert.deepEqual(
    {
      expenseVoucherNo: findMonth(
        fy2026,
        "Meridian Workspace Pvt Ltd",
        "2026-05",
      ).expenseVoucherNo,
      paymentVoucherNo: findMonth(
        fy2026,
        "Meridian Workspace Pvt Ltd",
        "2026-05",
      ).paymentVoucherNo,
    },
    {
      expenseVoucherNo: "EV-202605-MERID",
      paymentVoucherNo: "PV-202605-MERID",
    },
  );
  assert.equal(
    findMonth(fy2026, "Eastview Foundation", "2026-04").expenseVoucherNo,
    undefined,
  );
});
