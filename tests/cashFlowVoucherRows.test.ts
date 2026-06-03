import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildConsultantCashFlowTransactions,
  buildRentCashFlowTransactions,
  buildTravelCashFlowTransactions,
  parseCashFlowDate,
} from "../components/cashflow/cashFlowVoucherUtils.ts";

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

const from = parseCashFlowDate("01/04/2026");
const to = parseCashFlowDate("30/06/2026");
assert.ok(from);
assert.ok(to);

const consultantVouchers = readJson<any[]>(
  "../json_files/Requisitions/consultant/vouchers.json",
);
const rentVouchers = readJson<any[]>(
  "../json_files/Requisitions/rent/vouchers.json",
);
const travelVouchers = readJson<any[]>(
  "../json_files/Requisitions/travel/vouchers.json",
);

runTest("Cash flow consultant bucket has voucher rows and totals", () => {
  const rows = buildConsultantCashFlowTransactions(
    consultantVouchers,
    from,
    to,
  );
  assert.ok(rows.length >= 3);
  assert.ok(rows.some((row) => row.ref === "EV-202604-CONSU"));
  assert.equal(
    rows.reduce((sum, row) => sum + row.amount, 0),
    70800,
  );
});

runTest("Cash flow rent bucket has voucher rows and totals", () => {
  const rows = buildRentCashFlowTransactions(rentVouchers, from, to);
  assert.ok(rows.length >= 6);
  assert.ok(rows.some((row) => row.ref === "EV-202604-ASHAP"));
  assert.equal(
    rows.reduce((sum, row) => sum + row.amount, 0),
    362000,
  );
});

runTest("Cash flow travel bucket has voucher rows and totals", () => {
  const rows = buildTravelCashFlowTransactions(travelVouchers, from, to);
  assert.ok(rows.length >= 4);
  assert.ok(rows.some((row) => row.ref === "EV-202604-SEASIDE"));
  assert.ok(rows.some((row) => row.ref === "EV-202606-ALPHA"));
  assert.equal(
    rows.reduce((sum, row) => sum + row.amount, 0),
    67500,
  );
});
