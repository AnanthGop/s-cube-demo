import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildConsultantVoucherSnapshots,
  countConsultantVoucherEligibleEntries,
} from "../components/requisitions/consultantVoucherUtils.ts";
import {
  buildTravelVoucherSnapshots,
  normalizeTravelEmployeeMappings,
} from "../components/requisitions/travelVoucherUtils.ts";

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

const financialYears = readJson<any[]>("../json_files/admin_fy.json");
const consultantRecords = readJson<any[]>(
  "../json_files/Requisitions/consultant/records.json",
);
const consultantTds = readJson<any[]>(
  "../json_files/Requisitions/consultant/tds_account.json",
);
const persistedConsultantVouchers = readJson<any[]>(
  "../json_files/Requisitions/consultant/vouchers.json",
);
const travelRecords = readJson<any[]>(
  "../json_files/Requisitions/travel/records.json",
);
const persistedTravelVouchers = readJson<any[]>(
  "../json_files/Requisitions/travel/vouchers.json",
);

const findConsultantMonth = (
  snapshot: any,
  consultantName: string,
  monthKey: string,
) => {
  const consultant = snapshot.consultants.find(
    (item: any) => item.consultantName === consultantName,
  );
  assert.ok(consultant, `${consultantName} should be present`);
  const month = consultant.monthlyDetails.find(
    (item: any) => item.monthKey === monthKey,
  );
  assert.ok(month, `${consultantName} should include ${monthKey}`);
  return month;
};

const findTravelMonth = (snapshot: any, employeeName: string, monthKey: string) => {
  const employee = snapshot.employees.find(
    (item: any) => item.employeeName === employeeName,
  );
  assert.ok(employee, `${employeeName} should be present`);
  const month = employee.monthlyDetails.find(
    (item: any) => item.monthKey === monthKey,
  );
  assert.ok(month, `${employeeName} should include ${monthKey}`);
  return month;
};

runTest("Consultant schedules expose EV/PV numbers for payable old entries", () => {
  const snapshots = buildConsultantVoucherSnapshots(
    consultantRecords,
    financialYears,
    consultantTds,
  );
  const fy2026 = snapshots.find(
    (snapshot) => snapshot.financialYearName === "2026-2027",
  );
  assert.ok(fy2026, "FY 2026-2027 consultant schedule should be generated");
  const month = findConsultantMonth(fy2026, "Consultant A", "2026-04");
  assert.equal(month.expenseVoucherNo, "EV-202604-CONSU");
  assert.equal(month.paymentVoucherNo, "PV-202604-CONSU");
});

runTest("Consultant landing voucher count follows auto-posting eligibility", () => {
  assert.equal(
    countConsultantVoucherEligibleEntries(consultantRecords),
    2,
  );
});

runTest("Persisted consultant vouchers include voucher numbers", () => {
  const fy2026 = persistedConsultantVouchers.find(
    (snapshot) => snapshot.financialYearName === "2026-2027",
  );
  assert.ok(fy2026, "Persisted consultant vouchers should include FY 2026-2027");
  const month = findConsultantMonth(fy2026, "Consultant A", "2026-04");
  assert.equal(month.expenseVoucherNo, "EV-202604-CONSU");
  assert.equal(month.paymentVoucherNo, "PV-202604-CONSU");
});

runTest("Travel schedules expose EV/PV numbers for payable old entries", () => {
  assert.ok(travelRecords.length > 0, "Travel seed records should exist");
  const snapshots = buildTravelVoucherSnapshots(travelRecords, financialYears);
  const fy2026 = snapshots.find(
    (snapshot) => snapshot.financialYearName === "2026-2027",
  );
  assert.ok(fy2026, "FY 2026-2027 travel schedule should be generated");
  const month = findTravelMonth(fy2026, "Seaside", "2026-04");
  assert.equal(month.expenseVoucherNo, "EV-202604-SEASIDE");
  assert.equal(month.paymentVoucherNo, "PV-202604-SEASIDE");
});

runTest("Persisted travel vouchers include voucher numbers", () => {
  const fy2026 = persistedTravelVouchers.find(
    (snapshot) => snapshot.financialYearName === "2026-2027",
  );
  assert.ok(fy2026, "Persisted travel vouchers should include FY 2026-2027");
  const month = findTravelMonth(fy2026, "Seaside", "2026-04");
  assert.equal(month.expenseVoucherNo, "EV-202604-SEASIDE");
  assert.equal(month.paymentVoucherNo, "PV-202604-SEASIDE");
});

runTest("Travel voucher mapping normalization accepts standalone object data", () => {
  const mappings = normalizeTravelEmployeeMappings({
    employeeMappings: [{ employee: "Sandhya", ledger: "Travel Payable" }],
  });
  assert.deepEqual(mappings, [
    {
      employeeName: "Sandhya",
      ledgerName: "Travel Payable",
    },
  ]);
});
