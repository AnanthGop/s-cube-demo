# Consultant Data Files

This folder contains JSON files for storing and managing consultant-related data.

## File Structure

### 1. **records.json**

**Used by:** ConsultantReqPage.tsx  
**Purpose:** Stores consultant requisition records including vendor details, agreement information, and financial data.  
**Data Structure:**

```typescript
interface ConsultantEntry {
  id: string; // Unique ID (e.g., "C001")
  vendorName: string; // Consultant/vendor name
  postingFrequency: string; // Monthly, Quarterly, etc.
  agreementSignedBy: string; // Signatory name
  expenseHead: string; // Expense category
  agreementStartDate: string; // Start date (YYYY-MM-DD)
  agreementEndDate: string; // End date (YYYY-MM-DD)
  autoPosting: "Y" | "N"; // Auto-posting enabled
  autoPostingDate: string; // Date for auto-posting
  attachments: string; // Attachment references
  budgetCode: string; // Budget code
  grossAmount: number; // Gross amount
  gstPercent: number; // GST percentage
  gstAmount: number; // Calculated GST amount
  totalAmount: number; // Total amount (gross + GST)
  tdsRuleName: string; // TDS rule name
  tdsPercent: number; // TDS percentage
}
```

### 2. **journal_voucher_master.json**

**Used by:** ConsultantMapToCoaPage.tsx  
**Purpose:** Stores journal entry configurations for expense and payment vouchers, plus consultant to ledger mappings.  
**Data Structure:**

```typescript
{
  expenseVoucher: Array<{
    ledger: string; // Ledger name or <Consultant Details>
    consultant: string; // Consultant reference (if applicable)
    type: "Debit" | "Credit"; // Entry type
    showTds: boolean; // Show TDS field
  }>;
  paymentVoucher: Array<{
    ledger: string;
    consultant: string;
    type: "Debit" | "Credit";
    showTds: boolean;
  }>;
  consultantMappings: Array<{
    consultantName: string; // Consultant name
    ledgerName: string; // Mapped ledger name
    mappedOn: string; // Mapping date
  }>;
}
```

### 3. **tds_account.json**

**Used by:** ConsultantMapToCoaPage.tsx (TDS Account tab)  
**Purpose:** Stores TDS account mappings and tax deduction rules.  
**Data Structure:**

```typescript
interface TdsAccountMapping {
  accountName: string; // TDS account name (e.g., "TDS Account (194J)")
  type: string; // Account type (e.g., "Liability")
  section: string; // Income Tax section (e.g., "194J")
  rate: number; // TDS rate percentage
  appliedOn: string; // Application date
  description: string; // Description of TDS section
}
```

### 4. **vouchers.json**

**Used by:** ConsultantVouchersPage.tsx  
**Purpose:** Stores generated voucher snapshots for each financial year and consultant.  
**Data Structure:**

```typescript
interface VoucherSnapshot {
  financialYearId: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  consultants: Array<{
    consultantId: string;
    consultantName: string;
    department: string;
    monthlyFees: number;
    tdsPercent: number;
    months: Array<{
      monthIndex: number;
      monthLabel: string;
      expenseVoucher: {
        voucherNo: string;
        date: string;
        amount: number;
        gstAmount: number;
        totalAmount: number;
        status: string;
      };
      paymentVoucher: {
        voucherNo: string;
        date: string;
        grossAmount: number;
        tdsAmount: number;
        netAmount: number;
        status: string;
      };
    }>;
  }>;
  generatedAt: string;
}
```

## Usage

Each JSON file corresponds to a specific page in the Consultant workflow:

- **Consultant Requisitions** → `records.json`
- **Map to Chart of Accounts** → `journal_voucher_master.json` + `tds_account.json`
- **Consultant Vouchers** → `vouchers.json`
- **Consultant Landing Page** → No data file (navigation only)

## Data Flow

1. User creates/edits consultant requisitions → Saved to `records.json`
2. User configures COA mappings and TDS accounts → Saved to `journal_voucher_master.json` and `tds_account.json`
3. System generates vouchers based on requisitions → Saved to `vouchers.json`
4. All data persists across application sessions
