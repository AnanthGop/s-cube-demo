# Travel Module Data Files

This folder contains the JSON data files for the Travel module.

## File Structure

### 1. `records.json`

Stores individual travel entries.

**Interface:**

```typescript
interface TravelEntry {
  id: string;
  dateOfEntry: string; // YYYY-MM-DD
  employeeName: string;
  employeeLedger: string;
  travelStartDate: string; // YYYY-MM-DD
  travelEndDate: string; // YYYY-MM-DD
  frequency: string; // "monthly" | "bi-monthly" | "quarterly" | "half-yearly" | "yearly"
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  amount: string; // Total travel amount
}
```

**Example:**

```json
[
  {
    "id": "1",
    "dateOfEntry": "2024-04-10",
    "employeeName": "John Doe",
    "employeeLedger": "Employee Advances",
    "travelStartDate": "2024-04-01",
    "travelEndDate": "2025-03-31",
    "frequency": "monthly",
    "fromDate": "2024-04-01",
    "toDate": "2025-03-31",
    "amount": "5000"
  }
]
```

### 2. `journal_voucher_master.json`

Maps Chart of Accounts ledgers to Expense and Payment vouchers.

**Interface:**

```typescript
interface JournalVoucherMaster {
  expenseVoucher: Array<{
    ledger?: string;
    employee?: string; // Can be "<Employee Details>" placeholder
    type: "Debit" | "Credit";
  }>;
  paymentVoucher: Array<{
    ledger?: string;
    employee?: string;
    type: "Debit" | "Credit";
  }>;
  employeeMappings: Array<{
    employee: string;
    ledger: string;
  }>;
}
```

**Example:**

```json
{
  "expenseVoucher": [
    {
      "ledger": "Travel Expenses",
      "type": "Debit"
    },
    {
      "employee": "<Employee Details>",
      "type": "Credit"
    }
  ],
  "paymentVoucher": [
    {
      "employee": "<Employee Details>",
      "type": "Debit"
    },
    {
      "ledger": "Bank of India",
      "type": "Credit"
    }
  ],
  "employeeMappings": []
}
```

### 3. `vouchers.json`

Stores generated travel vouchers organized by financial year.

**Interface:**

```typescript
interface TravelVoucherSnapshot {
  fy: string;
  employees: Array<{
    employeeName: string;
    employeeLedger: string;
    months: Array<{
      month: number;
      monthName: string;
      vouchers: Array<{
        voucherId: string;
        voucherType: "Expense Voucher" | "Payment Voucher";
        amount: number;
        entries: TravelEntry[];
      }>;
    }>;
  }>;
}
```

**Example:**

```json
[
  {
    "fy": "2024-25",
    "employees": [
      {
        "employeeName": "John Doe",
        "employeeLedger": "Employee Advances",
        "months": [
          {
            "month": 3,
            "monthName": "April 2024",
            "vouchers": [
              {
                "voucherId": "EXP-2024-04-001",
                "voucherType": "Expense Voucher",
                "amount": 5000,
                "entries": [
                  {
                    "id": "1",
                    "dateOfEntry": "2024-04-10",
                    "employeeName": "John Doe",
                    "employeeLedger": "Employee Advances",
                    "travelStartDate": "2024-04-01",
                    "travelEndDate": "2025-03-31",
                    "frequency": "monthly",
                    "fromDate": "2024-04-01",
                    "toDate": "2025-03-31",
                    "amount": "5000"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
```

## Key Differences from Consultant Module

1. **No TDS**: Travel module does not include TDS calculations or TDS account mappings
2. **Employee-centric**: Uses `employeeName` and `employeeLedger` instead of vendor details
3. **Simplified Vouchers**: Only `amount` field, no `tdsAmount` or `netAmount` calculations
4. **Date Range**: Uses `travelStartDate` and `travelEndDate` to define the travel period

## Usage

These files are read and written by:

- `TravelLandingPage.tsx` - Main navigation hub
- `TravelVouchersPage.tsx` - Voucher generation and display
- `TravelMapToCoaPage.tsx` - Journal entry configuration
- `travelVoucherUtils.ts` - Voucher calculation logic
