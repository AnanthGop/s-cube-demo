import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

const expenseCreate = readJson<any[]>(
  "../json_files/ExpenseVoucher/create.json",
);
const bankCreate = readJson<any[]>("../json_files/BankVoucher/create.json");
const reviewApprove = readJson<any[]>(
  "../json_files/Requisitions/review_approve.json",
);

runTest("Create Expense Voucher has usable dummy rows", () => {
  assert.ok(expenseCreate.length >= 2);
  const voucher = expenseCreate.find((item) => item.id === "EV-DMY-001");
  assert.ok(voucher, "EV-DMY-001 should be present");
  assert.equal(voucher.totalInvoiceAmount, 47200);
  assert.equal(voucher.netAmountPayable, 43200);
  assert.ok(voucher.narration);
});

runTest("Create Bank Voucher has usable dummy rows", () => {
  assert.ok(bankCreate.length >= 2);
  const voucher = bankCreate.find((item) => item.id === "BV-DMY-001");
  assert.ok(voucher, "BV-DMY-001 should be present");
  assert.equal(voucher.partyName, "Asha Properties LLP");
  assert.equal(voucher.netAmountPayable, 108000);
});

runTest("Approve Expense Vouchers has approved rows pending expense voucher", () => {
  const rows = reviewApprove.filter(
    (row) =>
      String(row.status).toLowerCase() === "approved" &&
      (!row.expenseVoucherCreated || row.expenseVoucherCreated === "-"),
  );
  assert.ok(rows.length >= 2);
  assert.ok(rows.some((row) => row.reqId === "CON-APP-001"));
  assert.ok(rows.some((row) => row.reqId === "RNT-APP-001"));
});

runTest("Approve Bank Vouchers has rows pending payment voucher", () => {
  const rows = reviewApprove.filter(
    (row) =>
      String(row.status).toLowerCase() === "approved" &&
      row.expenseVoucherCreated === "Y" &&
      (!row.paymentVoucherCreated || row.paymentVoucherCreated === "-"),
  );
  assert.ok(rows.length >= 2);
  assert.ok(rows.some((row) => row.reqId === "TR-BANK-001"));
  assert.ok(rows.some((row) => row.reqId === "RNT-BANK-001"));
});
