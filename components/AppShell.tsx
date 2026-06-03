import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Building2,
  MapPin,
  Database,
  Map,
  FileText,
  Archive,
  Table,
  ShieldCheck,
  User,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CreditCard,
  Wallet,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  Settings,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

// Import data service for localStorage operations
import { loadData, saveData, initializeModuleData } from "../src/services/dataService";

// Admin Module Components
import { AddUserPage, type UserRecord } from "./admin/AddUserPage";
import { AddCompanyPage } from "./admin/AddCompanyPage";
import { AddLocationPage } from "./admin/AddLocationPage";
import { AddGrantPage } from "./admin/AddGrantPage";
import { GrantMasterPage } from "./admin/GrantMasterPage";
import { GrantAllocationPage } from "./admin/GrantAllocationPage";
import { MasterDataPage } from "./admin/MasterDataPage";
import { MapExpensesAdminPage } from "./admin/MapExpensesAdminPage";
import { MapExpensesPage } from "./requisitions/RentMapToCoaPage";
import { MasterDataForm } from "./admin/MasterDataForm";
import { DataBackupPage } from "./admin/DataBackupPage";
import { ChartOfAccountsPage } from "./admin/ChartOfAccountsPage";
import { TDSMasterPage } from "./admin/TDSMasterPage";

// Requisitions Module Components
import { ConsultantReqPage } from "./requisitions/ConsultantReqPage";
import { ConsultantLandingPage } from "./requisitions/ConsultantLandingPage";
import { ConsultantVouchersPage } from "./requisitions/ConsultantVouchersPage";
import { ConsultantMapToCoaPage } from "./requisitions/ConsultantMapToCoaPage";
import { ITSpendReqPage } from "./requisitions/ITSpendReqPage";
import { TravelReqPage } from "./requisitions/TravelReqPage";
import { TravelLandingPage } from "./requisitions/TravelLandingPage";
import { TravelVouchersPage } from "./requisitions/TravelVouchersPage";
import { TravelMapToCoaPage } from "./requisitions/TravelMapToCoaPage";
import { TravelPerDiemPage } from "./requisitions/TravelPerDiemPage";
import { TravelExpensePage } from "./requisitions/TravelExpensePage";
import { RentReqPage } from "./requisitions/RentReqPage";
import { RentLandingPage } from "./requisitions/RentLandingPage";
import { RentVouchersPage } from "./requisitions/RentVouchersPage";
import {
  ApproveReqPage,
  REVIEW_REQUISITIONS_SUBTAB,
  buildReviewRequisitionRows,
  countRowsToAction,
} from "./requisitions/ApproveReqPage";
import { ApprovalChainPage } from "./requisitions/ApprovalChainPage";
import { ProfilePage } from "./ProfilePage";

// Voucher Module Components
import { CreateVoucher } from "./vouchers/CreateVoucher";
import { ApproveVoucher } from "./vouchers/ApproveVoucher";
import { ApproveExpenseVoucherPage } from "./vouchers/ApproveExpenseVoucherPage";
import { ApprovePaymentVoucherPage } from "./vouchers/ApprovePaymentVoucherPage";
import { PaymentIntegrationStatus } from "./reconciliation/PaymentIntegrationStatus";

// Reconciliation & Cash Flow Components
import { UploadEntries } from "./reconciliation/UploadEntries";
import { MapEntries } from "./reconciliation/MapEntries";
import { CashFlowPage } from "./cashflow/CashFlowPage";
import { BudgetSummaryPage } from "./cashflow/BudgetSummaryPage";
import { BudgetsPage } from "./cashflow/BudgetsPage";
import { ForecastsPage } from "./budget/ForecastsPage";
import { BeneficiaryDirectoryPage } from "./beneficiaries/BeneficiaryDirectoryPage";
import { BatchesPage } from "./beneficiaries/BatchesPage";
import { AllocateFeesPage } from "./beneficiaries/AllocateFeesPage";
import { CollectFeesPage } from "./beneficiaries/CollectFeesPage";
import { FunderAllocationPage } from "./beneficiaries/FunderAllocationPage";
import { DonorDatabasePage } from "./donor/DonorDatabasePage";
import { DonationRecordsPage } from "./donor/DonationRecordsPage";
import { DonationReceiptsPage } from "./donor/DonationReceiptsPage";
import { Form10BD10BEPage } from "./donor/Form10BD10BEPage";
import { EmployeeDirectoryPage } from "./hrms/EmployeeDirectoryPage";
import { PayrollPage } from "./hrms/PayrollPage";
import { AssetPurchasesPage } from "./fixedassets/AssetPurchasesPage";
import { AssetDisposalPage } from "./fixedassets/AssetDisposalPage";
import AssetRegisterPage from "./fixedassets/AssetRegisterPage";
import DepreciationHub from "./fixedassets/DepreciationHub";
import { FixedAssetsMapToCoaPage } from "./fixedassets/FixedAssetsMapToCoaPage";
import { ProcurementModulePage } from "./procurement/ProcurementModulePage";
import donorDatabaseSeed from "../json_files/donor_database.json";
import donationsSeed from "../json_files/donations.json";
import adminFySeed from "../json_files/admin_fy.json";
import adminTdsSeed from "../json_files/admin_tds.json";
import rentRecordsSeed from "../json_files/Requisitions/rent/records.json";
import rentJournalVoucherMappingsSeed from "../json_files/Requisitions/rent/journal_voucher_master.json";
import rentTdsAccountSeed from "../json_files/Requisitions/rent/tds_account.json";
import rentVouchersSeed from "../json_files/Requisitions/rent/vouchers.json";
import consultantRecordsSeed from "../json_files/Requisitions/consultant/records.json";
import consultantTdsAccountSeed from "../json_files/Requisitions/consultant/tds_account.json";
import consultantVouchersSeed from "../json_files/Requisitions/consultant/vouchers.json";
import consultantJournalVoucherMappingsSeed from "../json_files/Requisitions/consultant/journal_voucher_master.json";
import travelRecordsSeed from "../json_files/Requisitions/travel/records.json";
import travelVouchersSeed from "../json_files/Requisitions/travel/vouchers.json";
import travelJournalVoucherMappingsSeed from "../json_files/Requisitions/travel/journal_voucher_master.json";
import travelPerDiemPolicySeed from "../json_files/Requisitions/travel/per_diem_policy.json";
import reviewApproveSeed from "../json_files/Requisitions/review_approve.json";
import expenseVoucherCreateSeed from "../json_files/ExpenseVoucher/create.json";
import expenseVoucherApproveSeed from "../json_files/ExpenseVoucher/approve.json";
import bankVoucherCreateSeed from "../json_files/BankVoucher/create.json";
import bankVoucherApproveSeed from "../json_files/BankVoucher/approve.json";

// Financial Reports Components
import BalanceSheetPage from "./reports/BalanceSheetPage";
import IncomeExpenditurePage from "./reports/IncomeExpenditurePage";
import FundBasedIEPage from "./reports/FundBasedIEPage";
import ReceiptsPaymentsPage from "./reports/ReceiptsPaymentsPage";
import FixedAssetsPage from "./reports/FixedAssetsPage";
import Note1ShareCapitalPage from "./reports/Note1ShareCapitalPage";
import Note2ReservesPage from "./reports/Note2ReservesPage";
import Note3CurrentLiabilitiesPage from "./reports/Note3SecuredLoansPage";
import Note4NonCurrentAssetsPage from "./reports/Note4NonCurrentAssetsPage";
import Note5CurrentAssetsPage from "./reports/Note5CurrentAssetsPage";
import Note6DonationsGrantsPage from "./reports/Note6DonationsGrantsPage";
import Note7OtherIncomePage from "./reports/Note7OtherIncomePage";
import Note8SalariesBenefitsPage from "./reports/Note8SalariesBenefitsPage";
import Note9ProgramExpensesPage from "./reports/Note9ProgramExpensesPage";
import Note10GeneralExpensesPage from "./reports/Note10GeneralExpensesPage";
import Note11PreviousYearFiguresPage from "./reports/Note11PreviousYearFiguresPage";
import Note12RestrictedFundPage from "./reports/Note12RestrictedFundPage";
import Note13GrantFundsFixedAssetsPage from "./reports/Note13GrantFundsFixedAssetsPage";
import Note13ASelfFundedFixedAssetsPage from "./reports/Note13ASelfFundedFixedAssetsPage";
import { TestLlmsPage } from "./reports/TestLlmsPage";
import {
  DEFAULT_POST_LOGIN_NAV,
  NAV_LOCAL_KEY,
  NAV_SESSION_KEY,
} from "../src/appNavigation";

interface AppShellProps {
  user: string | null;
  onLogout: () => void;
  initialTab?: string;
}

const API_BASE_URL = "http://localhost:3001/api";

let appShellBootCache: { mode: "disk" | "local"; state: any } | null = null;
let appShellBootPromise: Promise<{
  mode: "disk" | "local";
  state: any;
}> | null = null;
const persistenceSignatureCache: Record<string, string> = {};

const primePersistenceSignatureCache = (state: any) => {
  if (!state || typeof state !== "object") return;
  Object.keys(state).forEach((moduleId) => {
    try {
      persistenceSignatureCache[moduleId] = JSON.stringify(
        state[moduleId] ?? null,
      );
    } catch {
      persistenceSignatureCache[moduleId] = "";
    }
  });
};

const FIXED_ASSETS_PURCHASES_SEED = [{"id":1700000001,"assetId":"AST-2023-00001","dateOfPurchase":"15/04/2023","invoiceNumber":"INV-VEH-2023-001","invoiceDate":"15/04/2023","partyName":"Tata Motors Ltd","location":"Mumbai Office","fundType":"Local Funds","assetType":"Vehicles","amountBeforeGst":"850000","gstAmount":"153000","totalInvoiceValue":"1003000","quantity":1,"narration":"Tata Safari - Project field use"},{"id":1700000002,"assetId":"AST-2023-00002","dateOfPurchase":"10/06/2023","invoiceNumber":"INV-OE-2023-002","invoiceDate":"10/06/2023","partyName":"Canon India Pvt Ltd","location":"Delhi Hub","fundType":"FCRA Funds","assetType":"Office Equipment","amountBeforeGst":"45000","gstAmount":"8100","totalInvoiceValue":"53100","quantity":1,"narration":"Canon ImageRunner Advance photocopier"},{"id":1700000003,"assetId":"AST-2023-00003","dateOfPurchase":"20/07/2023","invoiceNumber":"INV-COMP-2023-003","invoiceDate":"20/07/2023","partyName":"Dell Technologies India","location":"Bengaluru Center","fundType":"FCRA Funds","assetType":"Computers","amountBeforeGst":"55000","gstAmount":"9900","totalInvoiceValue":"64900","quantity":1,"narration":"Dell Inspiron 15 laptop - Programme team"},{"id":1700000004,"assetId":"AST-2023-00004","dateOfPurchase":"20/07/2023","invoiceNumber":"INV-COMP-2023-003","invoiceDate":"20/07/2023","partyName":"Dell Technologies India","location":"Mumbai Office","fundType":"FCRA Funds","assetType":"Computers","amountBeforeGst":"55000","gstAmount":"9900","totalInvoiceValue":"64900","quantity":1,"narration":"Dell Inspiron 15 laptop - Programme team"},{"id":1700000005,"assetId":"AST-2023-00005","dateOfPurchase":"05/09/2023","invoiceNumber":"INV-VEH-2023-004","invoiceDate":"05/09/2023","partyName":"Mahindra & Mahindra Ltd","location":"Bengaluru Center","fundType":"Local Funds","assetType":"Vehicles","amountBeforeGst":"920000","gstAmount":"165600","totalInvoiceValue":"1085600","quantity":1,"narration":"Mahindra Bolero pickup - Field operations"},{"id":1700000006,"assetId":"AST-2023-00006","dateOfPurchase":"15/11/2023","invoiceNumber":"INV-OE-2023-005","invoiceDate":"15/11/2023","partyName":"Godrej & Boyce Mfg Co","location":"Delhi Hub","fundType":"Local Funds","assetType":"Office Equipment","amountBeforeGst":"32000","gstAmount":"5760","totalInvoiceValue":"37760","quantity":1,"narration":"Godrej steel almirah - Records storage"},{"id":1700000007,"assetId":"AST-2023-00007","dateOfPurchase":"28/02/2024","invoiceNumber":"INV-COMP-2023-006","invoiceDate":"28/02/2024","partyName":"HP India Sales Pvt Ltd","location":"Mumbai Office","fundType":"Local Funds","assetType":"Computers","amountBeforeGst":"68000","gstAmount":"12240","totalInvoiceValue":"80240","quantity":1,"narration":"HP EliteBook 840 G9 - Finance & Admin"},{"id":1700000008,"assetId":"AST-2024-00001","dateOfPurchase":"12/04/2024","invoiceNumber":"INV-VEH-2024-001","invoiceDate":"12/04/2024","partyName":"Maruti Suzuki India Ltd","location":"Mumbai Office","fundType":"Local Funds","assetType":"Vehicles","amountBeforeGst":"750000","gstAmount":"135000","totalInvoiceValue":"885000","quantity":1,"narration":"Maruti Ertiga - Staff transport"},{"id":1700000009,"assetId":"AST-2024-00002","dateOfPurchase":"25/05/2024","invoiceNumber":"INV-COMP-2024-002","invoiceDate":"25/05/2024","partyName":"Apple India Pvt Ltd","location":"Delhi Hub","fundType":"FCRA Funds","assetType":"Computers","amountBeforeGst":"120000","gstAmount":"21600","totalInvoiceValue":"141600","quantity":1,"narration":"MacBook Pro M3 - Executive use"},{"id":1700000010,"assetId":"AST-2024-00003","dateOfPurchase":"18/07/2024","invoiceNumber":"INV-OE-2024-003","invoiceDate":"18/07/2024","partyName":"Samsung India Electronics","location":"Bengaluru Center","fundType":"FCRA Funds","assetType":"Office Equipment","amountBeforeGst":"38000","gstAmount":"6840","totalInvoiceValue":"44840","quantity":1,"narration":"Samsung 55 inch Smart display board - Conference room"},{"id":1700000011,"assetId":"AST-2024-00004","dateOfPurchase":"03/09/2024","invoiceNumber":"INV-COMP-2024-004","invoiceDate":"03/09/2024","partyName":"Lenovo India Pvt Ltd","location":"Bengaluru Center","fundType":"Local Funds","assetType":"Computers","amountBeforeGst":"48500","gstAmount":"8730","totalInvoiceValue":"57230","quantity":1,"narration":"Lenovo ThinkPad E14 - Field coordinator"},{"id":1700000012,"assetId":"AST-2024-00005","dateOfPurchase":"22/10/2024","invoiceNumber":"INV-VEH-2024-005","invoiceDate":"22/10/2024","partyName":"Toyota Kirloskar Motors","location":"Mumbai Office","fundType":"FCRA Funds","assetType":"Vehicles","amountBeforeGst":"1250000","gstAmount":"225000","totalInvoiceValue":"1475000","quantity":1,"narration":"Toyota Innova Crysta - Senior management"},{"id":1700000013,"assetId":"AST-2024-00006","dateOfPurchase":"15/01/2025","invoiceNumber":"INV-OE-2025-006","invoiceDate":"15/01/2025","partyName":"Epson India Pvt Ltd","location":"Delhi Hub","fundType":"Local Funds","assetType":"Office Equipment","amountBeforeGst":"22000","gstAmount":"3960","totalInvoiceValue":"25960","quantity":1,"narration":"Epson L3210 multifunction printer"},{"id":1700000014,"assetId":"AST-2024-00007","dateOfPurchase":"20/03/2025","invoiceNumber":"INV-COMP-2025-007","invoiceDate":"20/03/2025","partyName":"Dell Technologies India","location":"Bengaluru Center","fundType":"FCRA Funds","assetType":"Computers","amountBeforeGst":"52000","gstAmount":"9360","totalInvoiceValue":"61360","quantity":1,"narration":"Dell OptiPlex 3000 desktop - Branch operations"},{"id":1700000015,"assetId":"AST-2025-00001","dateOfPurchase":"08/04/2025","invoiceNumber":"INV-VEH-2025-001","invoiceDate":"08/04/2025","partyName":"Tata Motors Ltd","location":"Mumbai Office","fundType":"Local Funds","assetType":"Vehicles","amountBeforeGst":"1450000","gstAmount":"261000","totalInvoiceValue":"1711000","quantity":1,"narration":"Tata Nexon EV - Green initiative fleet"},{"id":1700000016,"assetId":"AST-2025-00002","dateOfPurchase":"30/05/2025","invoiceNumber":"INV-COMP-2025-002","invoiceDate":"30/05/2025","partyName":"HP India Sales Pvt Ltd","location":"Delhi Hub","fundType":"FCRA Funds","assetType":"Computers","amountBeforeGst":"75000","gstAmount":"13500","totalInvoiceValue":"88500","quantity":1,"narration":"HP ZBook Firefly 14 G10 - Design team"},{"id":1700000017,"assetId":"AST-2025-00003","dateOfPurchase":"14/07/2025","invoiceNumber":"INV-OE-2025-003","invoiceDate":"14/07/2025","partyName":"LG Electronics India","location":"Bengaluru Center","fundType":"Local Funds","assetType":"Office Equipment","amountBeforeGst":"58000","gstAmount":"10440","totalInvoiceValue":"68440","quantity":1,"narration":"LG 4K projector - Training centre"},{"id":1700000018,"assetId":"AST-2025-00004","dateOfPurchase":"22/09/2025","invoiceNumber":"INV-COMP-2025-004","invoiceDate":"22/09/2025","partyName":"Lenovo India Pvt Ltd","location":"Delhi Hub","fundType":"FCRA Funds","assetType":"Computers","amountBeforeGst":"62000","gstAmount":"11160","totalInvoiceValue":"73160","quantity":1,"narration":"Lenovo ThinkPad X1 Carbon - Director field visits"},{"id":1700000019,"assetId":"AST-2025-00005","dateOfPurchase":"10/11/2025","invoiceNumber":"INV-VEH-2025-005","invoiceDate":"10/11/2025","partyName":"Mahindra & Mahindra Ltd","location":"Bengaluru Center","fundType":"Local Funds","assetType":"Vehicles","amountBeforeGst":"1100000","gstAmount":"198000","totalInvoiceValue":"1298000","quantity":1,"narration":"Mahindra XUV700 - South zone operations"},{"id":1700000020,"assetId":"AST-2025-00006","dateOfPurchase":"05/01/2026","invoiceNumber":"INV-OE-2026-006","invoiceDate":"05/01/2026","partyName":"Godrej & Boyce Mfg Co","location":"Mumbai Office","fundType":"Local Funds","assetType":"Office Equipment","amountBeforeGst":"85000","gstAmount":"15300","totalInvoiceValue":"100300","quantity":1,"narration":"Godrej workstation furniture set - HR department"}];
const FIXED_ASSETS_DEPRECIATION_RATES_IT_SEED = [{"id":1773938092980,"fy":"2023-2024","assetType":"Office Equipment","depreciationRate":"15"},{"id":1773938366067.397,"fy":"2024-2025","assetType":"Office Equipment","depreciationRate":"15"},{"id":1773938374213.048,"fy":"2025-2026","assetType":"Office Equipment","depreciationRate":"15"},{"id":1773938790670,"fy":"2023-2024","assetType":"Vehicles","depreciationRate":"10"},{"id":1773938798969,"fy":"2023-2024","assetType":"Computers & Peripherals","depreciationRate":"30"},{"id":1773938803583.4666,"fy":"2024-2025","assetType":"Vehicles","depreciationRate":"10"},{"id":1773938803583.4683,"fy":"2024-2025","assetType":"Computers & Peripherals","depreciationRate":"30"},{"id":1773938849540.3135,"fy":"2025-2026","assetType":"Vehicles","depreciationRate":"10"},{"id":1773938849540.3215,"fy":"2025-2026","assetType":"Computers & Peripherals","depreciationRate":"30"}];
const FIXED_ASSETS_DEPRECIATION_RATES_CA_SEED = [{"id":1773938137455,"fy":"2023-2024","assetType":"Office Equipment","usefulLife":"3","salvageValue":"5"},{"id":1773938368543.0098,"fy":"2024-2025","assetType":"Office Equipment","usefulLife":"3","salvageValue":"5"},{"id":1773938376348.7314,"fy":"2025-2026","assetType":"Office Equipment","usefulLife":"3","salvageValue":"5"},{"id":1773938828732,"fy":"2023-2024","assetType":"Vehicles","usefulLife":"10","salvageValue":"5"},{"id":1773938837899,"fy":"2023-2024","assetType":"Computers & Peripherals","usefulLife":"3","salvageValue":"5"},{"id":1773938844887.5818,"fy":"2024-2025","assetType":"Vehicles","usefulLife":"10","salvageValue":"5"},{"id":1773938844887.7913,"fy":"2024-2025","assetType":"Computers & Peripherals","usefulLife":"3","salvageValue":"5"},{"id":1773938851633.1316,"fy":"2025-2026","assetType":"Vehicles","usefulLife":"10","salvageValue":"5"},{"id":1773938851634.183,"fy":"2025-2026","assetType":"Computers & Peripherals","usefulLife":"3","salvageValue":"5"}];
const BENEFICIARIES_DIRECTORY_SEED = [{"id":1773902185307,"name":"sandhya","age":18,"education":"below 10th Pass","gender":"female","caste":"SC","contactDetails":"556644331","address":"dsfdsfsdf","financialStatus":"BPL","location":"Mumbai Office","batchNumber":"Mumbai-02","referredBy":"self"},{"id":1773911387337,"name":"Ananth","age":20,"education":"12th pass","gender":"male","caste":"SC","contactDetails":"1234567890","address":"abdc","financialStatus":"BPL","location":"Mumbai Office","batchNumber":"Mumbai-02","referredBy":"self"},{"id":1773911430168,"name":"Rajesh","age":21,"education":"below 10th Pass","gender":"male","caste":"SC","contactDetails":"1234560000","address":"abcd","financialStatus":"BPL","location":"Bengaluru Center","batchNumber":"BLR-02","referredBy":"self"},{"id":1773911481745,"name":"Gopal","age":17,"education":"graduate","gender":"male","caste":"SC","contactDetails":"7894561330","address":"xcvb","financialStatus":"BPL","location":"Bengaluru Center","batchNumber":"BLR-02","referredBy":"self"},{"id":1773911524869,"name":"Vignesh","age":18,"education":"below 10th Pass","gender":"male","caste":"SC","contactDetails":"123654789","address":"bnmvj","financialStatus":"BPL","location":"Delhi Hub","batchNumber":"DEL-02","referredBy":"self"}];
const BENEFICIARIES_BATCHES_SEED = [{"id":1773900490692,"location":"Mumbai Office","batchNumber":"Mumbai-01","batchStartDate":"01/04/2026","batchEndDate":"15/05/2026"},{"id":1773900515305,"location":"Delhi Hub","batchNumber":"Delhi-01","batchStartDate":"15/04/2026","batchEndDate":"31/05/2026"},{"id":1773900539835,"location":"Mumbai Office","batchNumber":"Mumbai-02","batchStartDate":"01/06/2026","batchEndDate":"15/07/2026"},{"id":1773900592889,"location":"Bengaluru Center","batchNumber":"BLR-01","batchStartDate":"01/04/2026","batchEndDate":"31/05/2026"},{"id":1773900616827,"location":"Bengaluru Center","batchNumber":"BLR-02","batchStartDate":"01/06/2026","batchEndDate":"31/07/2026","batchStatus":"active"},{"id":1773900652947,"location":"Delhi Hub","batchNumber":"DEL-02","batchStartDate":"01/06/2026","batchEndDate":"31/07/2026"}];
const BENEFICIARIES_FEES_SEED = [{"id":1773907755955,"location":"Mumbai Office","feesApplicable":"Yes","feeAmount":"1000"},{"id":1773907762580,"location":"Delhi Hub","feesApplicable":"No","feeAmount":""},{"id":1773907770199,"location":"Bengaluru Center","feesApplicable":"Yes","feeAmount":"5000"}];
const BENEFICIARIES_COLLECTIONS_SEED = [{"beneficiaryId":1773902185307,"amountCollected":"500","collectionDate":"2026-03-15","receiptNumber":"RCPT-1773902185307","id":1773912598860},{"id":1773912612549,"beneficiaryId":1773911387337,"amountCollected":"200","collectionDate":"2026-03-18","receiptNumber":"RCPT-1773911387337-001","createdAt":"2026-03-19T09:30:12.549Z"},{"id":1773912643350,"beneficiaryId":1773911387337,"amountCollected":"800","collectionDate":"2026-03-19","receiptNumber":"RCPT-1773911387337-002","createdAt":"2026-03-19T09:30:43.350Z"}];
const BENEFICIARIES_FUNDER_ALLOCATIONS_SEED = [{"batchId":1773900515305,"funderName":"Tech Innovation","allocatedAt":"2026-03-19T10:13:07.999Z"},{"batchId":1773900592889,"funderName":"Tech Innovation","allocatedAt":"2026-03-19T10:13:07.999Z"},{"batchId":1773900490692,"funderName":"UNESCO Grant","allocatedAt":"2026-03-19T10:13:11.529Z"}];
const HRMS_EMPLOYEES_SEED = [{"id":1,"name":"Aarav Sharma","dateOfBirth":"11/04/1992","dateOfJoining":"15/01/2021","dateOfLeaving":"","contactNo":"+91 9876543210","address":"Andheri East, Mumbai, Maharashtra","pan":"AASPS1234K","designation":"Finance Executive","location":"Mumbai Office","department":"Finance","grossSalaryPerMonth":"65000","annualCTC":"780000","employeeStatus":"active"},{"id":2,"name":"Priya Nair","dateOfBirth":"23/09/1990","dateOfJoining":"01/08/2020","dateOfLeaving":"","contactNo":"+91 9811122233","address":"Powai, Mumbai, Maharashtra","pan":"AAAPN4567L","designation":"HR Manager","location":"Mumbai Office","department":"HR","grossSalaryPerMonth":"98000","annualCTC":"1176000","employeeStatus":"active"},{"id":3,"name":"Rohan Gupta","dateOfBirth":"05/02/1994","dateOfJoining":"20/06/2022","dateOfLeaving":"","contactNo":"+91 9822233344","address":"Dwarka, New Delhi, Delhi","pan":"AAGPG6789M","designation":"Program Coordinator","location":"Delhi Hub","department":"Programs","grossSalaryPerMonth":"72000","annualCTC":"864000","employeeStatus":"active"},{"id":4,"name":"Sneha Iyer","dateOfBirth":"14/12/1991","dateOfJoining":"11/11/2019","dateOfLeaving":"","contactNo":"+91 9833344455","address":"Indiranagar, Bengaluru, Karnataka","pan":"AAAPI2345N","designation":"Accounts Manager","location":"Bengaluru Center","department":"Accounts","grossSalaryPerMonth":"105000","annualCTC":"1260000","employeeStatus":"active"},{"id":5,"name":"Vikram Singh","dateOfBirth":"29/07/1989","dateOfJoining":"10/04/2018","dateOfLeaving":"","contactNo":"+91 9844455566","address":"Karol Bagh, New Delhi, Delhi","pan":"AAAPS3456P","designation":"Operations Lead","location":"Delhi Hub","department":"Operations","grossSalaryPerMonth":"112000","annualCTC":"1344000","employeeStatus":"active"},{"id":6,"name":"Neha Kulkarni","dateOfBirth":"18/03/1995","dateOfJoining":"01/02/2023","dateOfLeaving":"","contactNo":"+91 9855566677","address":"Banashankari, Bengaluru, Karnataka","pan":"AAAPK4567Q","designation":"MIS Analyst","location":"Bengaluru Center","department":"MIS","grossSalaryPerMonth":"58000","annualCTC":"696000","employeeStatus":"active"},{"id":7,"name":"Aditya Verma","dateOfBirth":"08/06/1993","dateOfJoining":"15/09/2021","dateOfLeaving":"","contactNo":"+91 9866677788","address":"Chembur, Mumbai, Maharashtra","pan":"AAAPV5678R","designation":"Procurement Officer","location":"Mumbai Office","department":"Procurement","grossSalaryPerMonth":"69000","annualCTC":"828000","employeeStatus":"active"},{"id":8,"name":"Pooja Reddy","dateOfBirth":"02/10/1996","dateOfJoining":"05/12/2022","dateOfLeaving":"","contactNo":"+91 9877788899","address":"Yelahanka, Bengaluru, Karnataka","pan":"AAAPR6789S","designation":"Field Coordinator","location":"Bengaluru Center","department":"Field Operations","grossSalaryPerMonth":"52000","annualCTC":"624000","employeeStatus":"active"},{"id":9,"name":"Manish Tiwari","dateOfBirth":"27/01/1988","dateOfJoining":"09/05/2017","dateOfLeaving":"30/11/2024","contactNo":"+91 9888899900","address":"Lajpat Nagar, New Delhi, Delhi","pan":"AAAPT7890T","designation":"Admin Supervisor","location":"Delhi Hub","department":"Administration","grossSalaryPerMonth":"76000","annualCTC":"912000","employeeStatus":"resigned"},{"id":10,"name":"Kavya Menon","dateOfBirth":"19/08/1997","dateOfJoining":"03/07/2023","dateOfLeaving":"","contactNo":"+91 9899900011","address":"Saket, New Delhi, Delhi","pan":"AAAPM8901U","designation":"HR Executive","location":"Delhi Hub","department":"HR","grossSalaryPerMonth":"54000","annualCTC":"648000","employeeStatus":"active"}];
const HRMS_PAYROLL_SEED = [{"id":1773917697470,"month":"2026-02","employeeCount":9,"totalGrossAmount":"685000","generatedOn":"19/03/2026","registerEntries":[{"grossSalaryPerMonth":"65000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"2333.33","netSalary":"60666.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":1,"employeeName":"Aarav Sharma","designation":"Finance Executive","department":"Finance","location":"Mumbai Office"},{"grossSalaryPerMonth":"98000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"5633.33","netSalary":"90366.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":2,"employeeName":"Priya Nair","designation":"HR Manager","department":"HR","location":"Mumbai Office"},{"grossSalaryPerMonth":"72000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"3033.33","netSalary":"66966.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":3,"employeeName":"Rohan Gupta","designation":"Program Coordinator","department":"Programs","location":"Delhi Hub"},{"grossSalaryPerMonth":"105000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"6333.33","netSalary":"96666.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":4,"employeeName":"Sneha Iyer","designation":"Accounts Manager","department":"Accounts","location":"Bengaluru Center"},{"grossSalaryPerMonth":"112000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"7033.33","netSalary":"102966.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":5,"employeeName":"Vikram Singh","designation":"Operations Lead","department":"Operations","location":"Delhi Hub"},{"grossSalaryPerMonth":"58000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"1633.33","netSalary":"54366.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":6,"employeeName":"Neha Kulkarni","designation":"MIS Analyst","department":"MIS","location":"Bengaluru Center"},{"grossSalaryPerMonth":"69000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"2733.33","netSalary":"64266.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":7,"employeeName":"Aditya Verma","designation":"Procurement Officer","department":"Procurement","location":"Mumbai Office"},{"grossSalaryPerMonth":"52000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"1033.33","netSalary":"48966.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":8,"employeeName":"Pooja Reddy","designation":"Field Coordinator","department":"Field Operations","location":"Bengaluru Center"},{"grossSalaryPerMonth":"54000","professionTax":"200","employeeProvidentFund":"1800","employeeEsic":"0","tds":"1233.33","netSalary":"50766.67","companyProvidentFund":"1800","companyEsic":"0","employeeId":10,"employeeName":"Kavya Menon","designation":"HR Executive","department":"HR","location":"Delhi Hub"}]},{"id":1773916801834,"month":"2026-01","employeeCount":9,"totalGrossAmount":"685000","generatedOn":"19/03/2026"}];

const INITIAL_DEFAULTS = {
  admin_fund: [
    {
      id: 1,
      name: "General Fund",
      code: "GF-01",
      status: "Active",
      creator: "Admin",
      date: "01/10/2023",
    },
    {
      id: 2,
      name: "Infrastructure Fund",
      code: "IF-22",
      status: "Active",
      creator: "Admin",
      date: "05/11/2023",
    },
  ],
  admin_grant: [
    {
      id: "GR-001",
      nameOfGrantor: "UNESCO",
      name: "UNESCO Grant",
      code: "UN-2024",
      periodStart: "2024-04-01",
      periodEnd: "2027-03-31",
      approvedGrantAmount: 5000000,
      grantReceivedTillDate: 2500000,
      balanceGrantReceivable: 2500000,
      fucFrequency: "Quarterly",
      projectReportFrequency: "Half-Yearly",
      auditedFUC: "Y",
      auditedFUCDate: "2025-03-31",
      status: "Active",
      creator: "Admin",
      date: "15/10/2023",
    },
    {
      id: "GR-002",
      nameOfGrantor: "Tech Innovation Foundation",
      name: "Tech Innovation",
      code: "TECH-X",
      periodStart: "2023-12-01",
      periodEnd: "2025-11-30",
      approvedGrantAmount: 2000000,
      grantReceivedTillDate: 1200000,
      balanceGrantReceivable: 800000,
      fucFrequency: "Half-Yearly",
      projectReportFrequency: "Quarterly",
      auditedFUC: "N",
      auditedFUCDate: "",
      status: "Active",
      creator: "Admin",
      date: "01/12/2023",
    },
  ],
  "grant/mou": [],
  "grant/budget": [],
  "grant/fuc": [],
  "grant/reports": [],
  "grant/coa": [],
  "grant/utilization": [],
  "grant/allocation": [],
  admin_fy: [
    {
      id: 1,
      name: "2023-2024",
      startDate: "01/04/2023",
      endDate: "31/03/2024",
      status: "Close",
      creator: "Admin",
      date: "01/04/2023",
    },
    {
      id: 2,
      name: "2024-2025",
      startDate: "01/04/2024",
      endDate: "31/03/2025",
      status: "Open",
      creator: "Admin",
      date: "01/04/2024",
    },
    {
      id: 3,
      name: "2025-2026",
      startDate: "01/04/2025",
      endDate: "31/03/2026",
      status: "Open",
      creator: "Admin",
      date: "01/04/2025",
    },
  ],
  admin_tds: [
    {
      id: 1,
      fy: "2024-2025",
      type: "Professional Fees",
      section: "194J",
      rate: 10,
      threshold: 30000,
      status: "Active",
    },
    {
      id: 2,
      fy: "2024-2025",
      type: "Contractors (Indiv/HUF)",
      section: "194C",
      rate: 1,
      threshold: 100000,
      status: "Active",
    },
    {
      id: 3,
      fy: "2024-2025",
      type: "Rent - Land & Bldg",
      section: "194I",
      rate: 10,
      threshold: 240000,
      status: "Active",
    },
    {
      id: 4,
      fy: "2024-2025",
      type: "Commission/Brokerage",
      section: "194H",
      rate: 5,
      threshold: 15000,
      status: "Active",
    },
    {
      id: 5,
      fy: "2024-2025",
      type: "Contractors (Others/Non-Indiv)",
      section: "194C",
      rate: 2,
      threshold: 100000,
      status: "Active",
    },
    {
      id: 101,
      fy: "2025-2026",
      type: "Contractors (Individual/HUF)",
      section: "194C",
      rate: 1,
      threshold: 30000,
      status: "Active",
    },
    {
      id: 102,
      fy: "2025-2026",
      type: "Contractors (Others)",
      section: "194C",
      rate: 2,
      threshold: 30000,
      status: "Active",
    },
    {
      id: 103,
      fy: "2025-2026",
      type: "Fees for Professional Services",
      section: "194J",
      rate: 10,
      threshold: 30000,
      status: "Active",
    },
    {
      id: 104,
      fy: "2025-2026",
      type: "Fees for Technical Services",
      section: "194J",
      rate: 2,
      threshold: 30000,
      status: "Active",
    },
    {
      id: 105,
      fy: "2025-2026",
      type: "Rent of Land and Building",
      section: "194I",
      rate: 10,
      threshold: 240000,
      status: "Active",
    },
    {
      id: 106,
      fy: "2025-2026",
      type: "Rent of Plant and Machinery",
      section: "194I",
      rate: 2,
      threshold: 240000,
      status: "Active",
    },
    {
      id: 107,
      fy: "2025-2026",
      type: "Commission or Brokerage",
      section: "194H",
      rate: 5,
      threshold: 15000,
      status: "Active",
    },
    {
      id: 108,
      fy: "2025-2026",
      type: "Interest other than Interest on Securities",
      section: "194A",
      rate: 10,
      threshold: 40000,
      status: "Active",
    },
    {
      id: 109,
      fy: "2025-2026",
      type: "Purchase of Goods",
      section: "194Q",
      rate: 0.1,
      threshold: 5000000,
      status: "Active",
    },
    {
      id: 110,
      fy: "2025-2026",
      type: "Transfer of Immovable Property",
      section: "194-IA",
      rate: 1,
      threshold: 5000000,
      status: "Active",
    },
    {
      id: 111,
      fy: "2025-2026",
      type: "Business Perquisites",
      section: "194R",
      rate: 10,
      threshold: 20000,
      status: "Active",
    },
    {
      id: 112,
      fy: "2025-2026",
      type: "Insurance Commission",
      section: "194D",
      rate: 5,
      threshold: 15000,
      status: "Active",
    },
  ],
  admin_function: [
    {
      id: 1,
      name: "Administration",
      code: "ADM-01",
      status: "Active",
      creator: "Admin",
      date: "20/09/2023",
    },
    {
      id: 2,
      name: "Field Operations",
      code: "OPS-99",
      status: "Active",
      creator: "Admin",
      date: "10/10/2023",
    },
  ],
  admin_project: [
    {
      id: 1,
      name: "Solar Grid 1",
      code: "SOL-1",
      locations: ["Mumbai Office", "Bengaluru Center"],
      status: "Active",
      creator: "Admin",
      date: "12/11/2023",
    },
    {
      id: 2,
      name: "Digital Literacy",
      code: "DIG-LIT",
      locations: ["Delhi Hub"],
      status: "Active",
      creator: "Active",
      date: "15/12/2023",
    },
  ],
  admin_user: [
    {
      id: 1,
      name: "John Finance",
      email: "john.f@s3.org",
      type: "Employee",
      role: "Finance",
      fund: "GF-01",
      grant: "UN-2024",
      func: "ADM-01",
      proj: "SOL-1",
      status: "Active",
      creator: "Admin",
      date: "01/10/2023",
    },
    {
      id: 2,
      name: "Sarah Admin",
      email: "sarah.a@s3.org",
      type: "Employee",
      role: "Admin",
      fund: "IF-22",
      grant: "TECH-X",
      func: "OPS-99",
      proj: "DIG-LIT",
      status: "Active",
      creator: "Admin",
      date: "15/11/2023",
    },
  ],
  admin_location: [
    {
      id: 1,
      region: "West",
      state: "Maharashtra",
      city: "Mumbai",
      address: "456 Nariman Point, Mumbai 400021",
      name: "Mumbai Office",
      status: "Active",
      creator: "Admin",
      date: "01/01/2024",
    },
    {
      id: 2,
      region: "North",
      state: "Delhi",
      city: "New Delhi",
      address: "123 Connaught Place, New Delhi 110001",
      name: "Delhi Hub",
      status: "Active",
      creator: "Admin",
      date: "15/01/2024",
    },
    {
      id: 3,
      region: "South",
      state: "Karnataka",
      city: "Bengaluru",
      address: "789 MG Road, Bengaluru 560001",
      name: "Bengaluru Center",
      status: "Active",
      creator: "Admin",
      date: "20/01/2024",
    },
  ],
  admin_company: [
    {
      id: 1,
      name: "Tata Trusts",
      orgType: "Trust",
      pan: "AAAAA0000P",
      tan: "MUMB00123C",
      gst: "27AAAAA0000P1Z5",
      csr1: "CSR00001234",
      incorpNo: "IT-1919-MUM",
      registeredUnder: "Indian Trusts Act, 1882",
      eightyGNo: "80G/2023/1234",
      eightyGDate: "31/03/2028",
      twelveANo: "12A/MUM/2022",
      twelveADate: "31/12/2027",
      fcraNo: "083780001",
      fcraDate: "30/06/2026",
      darpanId: "MH/2017/0112233",
      contact: "+91 22 6665 8282",
      email: "talktous@tatatrusts.org",
      website: "https://www.tatatrusts.org",
      address: "Bombay House, 24, Homi Mody Street, Mumbai 400001",
      status: "Active",
      creator: "Admin",
      date: "01/01/2023",
    },
    {
      id: 2,
      name: "Reliance Foundation",
      orgType: "Section 8 Company",
      pan: "BBBBB1111Q",
      tan: "MUMB11223D",
      gst: "27BBBBB1111Q1Z6",
      csr1: "CSR00005678",
      incorpNo: "U85110MH2010NPL207270",
      registeredUnder: "Companies Act, 2013",
      eightyGNo: "80G/REL/2023",
      eightyGDate: "01/01/2029",
      twelveANo: "12A/REL/2021",
      twelveADate: "15/05/2026",
      fcraNo: "083781112",
      fcraDate: "20/08/2025",
      darpanId: "MH/2018/0223344",
      contact: "+91 22 4477 0000",
      email: "contactus@reliancefoundation.org",
      website: "https://www.reliancefoundation.org",
      address: "Maker Chambers IV, Nariman Point, Mumbai 400021",
      status: "Active",
      creator: "Admin",
      date: "15/02/2023",
    },
  ],
  chart_of_accounts: [
    {
      master: "Assets",
      groups: [
        {
          name: "Current Assets",
          ledgers: ["Cash in Hand", "Bank Balance - Chase"],
        },
        { name: "Fixed Assets", ledgers: ["Office Equipment", "Vehicles"] },
      ],
    },
    {
      master: "Liabilities",
      groups: [
        {
          name: "Current Liabilities",
          ledgers: ["Accounts Payable", "Short-term Loans"],
        },
      ],
    },
    {
      master: "Income",
      groups: [
        {
          name: "Grant Income",
          ledgers: ["UNESCO Disbursement", "Direct Donor Contribution"],
        },
      ],
    },
    {
      master: "Expenditure",
      groups: [
        {
          name: "Personnel Services",
          ledgers: ["Base Salary", "Overtime Pay"],
        },
        { name: "Operational Costs", ledgers: ["Office Rent", "Electricity"] },
      ],
    },
  ],
  admin_mapping: [],
  req_consultants: [],
  req_it: [],
  "Requisitions/consultant": consultantRecordsSeed,
  "Requisitions/consultant/tds_account": consultantTdsAccountSeed,
  "Requisitions/consultant/vouchers": consultantVouchersSeed,
  "Requisitions/consultant/journal_voucher_master": consultantJournalVoucherMappingsSeed,
  "travel/records": travelRecordsSeed,
  "travel/vouchers": travelVouchersSeed,
  "travel/journal_voucher_master": travelJournalVoucherMappingsSeed,
  "travel/per_diem_policy": travelPerDiemPolicySeed,
  "travel/expenses": [],
  // Legacy keys kept for backward-read compatibility.
  "requisitions/travel/records": [],
  "requisitions/travel/vouchers": [],
  "requisitions/travel/journal_voucher_master": [],
  "requisitions/travel/per_diem_policy": [],
  "Requisitions/travel/records": travelRecordsSeed,
  "Requisitions/travel/vouchers": travelVouchersSeed,
  "Requisitions/travel/journal_voucher_master": travelJournalVoucherMappingsSeed,
  "Requisitions/travel/per_diem_policy": travelPerDiemPolicySeed,
  "Requisitions/rent/records": rentRecordsSeed,
  "Requisitions/rent/journal_voucher_master": rentJournalVoucherMappingsSeed,
  "Requisitions/rent/tds_account": rentTdsAccountSeed,
  "Requisitions/rent/vouchers": rentVouchersSeed,
  "Requisitions/review_approve": reviewApproveSeed,
  vouchers_expense: [],
  vouchers_bank: [],
  "ExpenseVoucher/create": expenseVoucherCreateSeed,
  "ExpenseVoucher/approve": expenseVoucherApproveSeed,
  "BankVoucher/create": bankVoucherCreateSeed,
  "BankVoucher/approve": bankVoucherApproveSeed,
  fixed_assets_purchases: FIXED_ASSETS_PURCHASES_SEED,
  fixed_assets_disposals: [],
  "fixed_assets/journal_voucher_master": {},
  fixed_assets_depreciation_rates_it: FIXED_ASSETS_DEPRECIATION_RATES_IT_SEED,
  fixed_assets_depreciation_rates_ca: FIXED_ASSETS_DEPRECIATION_RATES_CA_SEED,
  fixed_assets_depreciation_register: [],
  beneficiaries_directory: BENEFICIARIES_DIRECTORY_SEED,
  beneficiaries_batches: BENEFICIARIES_BATCHES_SEED,
  beneficiaries_fees: BENEFICIARIES_FEES_SEED,
  beneficiaries_collections: BENEFICIARIES_COLLECTIONS_SEED,
  beneficiaries_funder_allocations: BENEFICIARIES_FUNDER_ALLOCATIONS_SEED,
  donor_database: donorDatabaseSeed,
  donations: donationsSeed,
  form_10bd_filings: [],
  form_10be_files: [],
  hrms_employees: HRMS_EMPLOYEES_SEED,
  hrms_payroll: HRMS_PAYROLL_SEED,
  recon_entries: [],
  cash_flow: [],
  payroll_budget: [],
  "procure/data": {
    vendors: [],
    requisitions: [],
    quotations: [],
    purchaseOrders: [],
    grns: [],
  },
};

const RENT_SEEDED_MODULES = [
  "Requisitions/rent/records",
  "Requisitions/rent/journal_voucher_master",
  "Requisitions/rent/tds_account",
  "Requisitions/rent/vouchers",
] as const;

const CONSULTANT_TRAVEL_SEEDED_MODULES = [
  "Requisitions/consultant",
  "Requisitions/consultant/tds_account",
  "Requisitions/consultant/vouchers",
  "Requisitions/consultant/journal_voucher_master",
  "travel/records",
  "travel/vouchers",
  "travel/journal_voucher_master",
  "travel/per_diem_policy",
  "Requisitions/travel/records",
  "Requisitions/travel/vouchers",
  "Requisitions/travel/journal_voucher_master",
  "Requisitions/travel/per_diem_policy",
] as const;

const VOUCHER_SEEDED_MODULES = [
  "Requisitions/review_approve",
  "ExpenseVoucher/create",
  "ExpenseVoucher/approve",
  "BankVoucher/create",
  "BankVoucher/approve",
] as const;

const getSeedRecordKey = (item: any) =>
  String(item?.id || item?.reqId || "").trim();

const mergeMissingSeedRows = (current: any, seed: any) => {
  if (!Array.isArray(seed)) return current;
  if (!Array.isArray(current) || current.length === 0) return seed;

  const existingKeys = new Set(current.map(getSeedRecordKey).filter(Boolean));
  const missingRows = seed.filter((item) => {
    const key = getSeedRecordKey(item);
    return key && !existingKeys.has(key);
  });

  return missingRows.length > 0 ? [...current, ...missingRows] : current;
};

const TRAVEL_NAME_MODULES = [
  "travel/records",
  "travel/vouchers",
  "Requisitions/travel/records",
  "Requisitions/travel/vouchers",
  "Requisitions/review_approve",
  "ExpenseVoucher/create",
  "ExpenseVoucher/approve",
  "BankVoucher/create",
  "BankVoucher/approve",
] as const;

const replaceTravelDummyNames = (value: any): any => {
  if (typeof value === "string") {
    return value
      .replaceAll("Sandhya", "Seaside")
      .replaceAll("SANDH", "SEASIDE")
      .replaceAll("Ananth", "Alpha")
      .replaceAll("ANANT", "ALPHA");
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const replaced = replaceTravelDummyNames(item);
      if (replaced !== item) changed = true;
      return replaced;
    });
    return changed ? next : value;
  }
  if (value && typeof value === "object") {
    let changed = false;
    const next: Record<string, any> = {};
    Object.entries(value).forEach(([key, item]) => {
      const nextKey = replaceTravelDummyNames(key);
      const replaced = replaceTravelDummyNames(item);
      if (nextKey !== key || replaced !== item) changed = true;
      next[nextKey] = replaced;
    });
    return changed ? next : value;
  }
  return value;
};

const migrateTravelDummyNames = async (state: any) => {
  for (const moduleId of TRAVEL_NAME_MODULES) {
    const current = state[moduleId];
    const migrated = replaceTravelDummyNames(current);
    if (migrated !== current) {
      state[moduleId] = migrated;
      await saveData(moduleId, migrated);
    }
  }
};

const hydrateEmptyRentSeedModules = async (state: any) => {
  for (const moduleId of [
    ...RENT_SEEDED_MODULES,
    ...CONSULTANT_TRAVEL_SEEDED_MODULES,
    ...VOUCHER_SEEDED_MODULES,
  ]) {
    const current = state[moduleId];
    if ((VOUCHER_SEEDED_MODULES as readonly string[]).includes(moduleId)) {
      const merged = mergeMissingSeedRows(current, INITIAL_DEFAULTS[moduleId]);
      if (merged !== current) {
        state[moduleId] = merged;
        await saveData(moduleId, merged);
      }
      continue;
    }
    if (Array.isArray(current) && current.length > 0) continue;
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      Object.keys(current).length > 0
    ) {
      continue;
    }
    state[moduleId] = INITIAL_DEFAULTS[moduleId];
    await saveData(moduleId, INITIAL_DEFAULTS[moduleId]);
  }
  await migrateTravelDummyNames(state);
};

const hydrateRentSupportSeedModules = async (state: any) => {
  const currentFys = Array.isArray(state.admin_fy) ? state.admin_fy : [];
  const fyNames = new Set(
    currentFys.map((item: any) => String(item?.name || "").trim()),
  );
  const missingFys = (adminFySeed as any[]).filter(
    (item) => !fyNames.has(String(item?.name || "").trim()),
  );
  if (missingFys.length > 0) {
    state.admin_fy = [...currentFys, ...missingFys];
    await saveData("admin_fy", state.admin_fy);
  }

  const currentTds = Array.isArray(state.admin_tds) ? state.admin_tds : [];
  const tdsKeys = new Set(
    currentTds.map(
      (item: any) =>
        `${String(item?.fy || "").trim()}|${String(item?.type || "").trim()}|${String(item?.section || "").trim()}`,
    ),
  );
  const missingTds = (adminTdsSeed as any[]).filter((item) => {
    const key = `${String(item?.fy || "").trim()}|${String(item?.type || "").trim()}|${String(item?.section || "").trim()}`;
    return !tdsKeys.has(key);
  });
  if (missingTds.length > 0) {
    state.admin_tds = [...currentTds, ...missingTds];
    await saveData("admin_tds", state.admin_tds);
  }
};

const TABS = [
  { id: "ACCOUNTING", label: "Accounting", icon: Table },
  { id: "BUDGET", label: "Budget", icon: LayoutDashboard },
  { id: "GRANTS", label: "Grants", icon: FileText },
  { id: "FIXED_ASSETS", label: "Fixed Assets", icon: Building2 },
  { id: "INVESTMENTS", label: "Investments", icon: TrendingUp },
  { id: "PROCUREMENT", label: "Procurement", icon: ShoppingCart },
  { id: "DONOR_MGMT", label: "Donor Management", icon: Users },
  { id: "HRMS", label: "PAYROLL INTEGRATION", icon: Users },
  { id: "REPORTING", label: "Reporting", icon: Archive },
  { id: "BENEFICIARIES", label: "Beneficiaries", icon: Users },
  { id: "ADMIN", label: "Admin", icon: Settings },
  { id: "PROFILE", label: "Profile", icon: User },
];

const PROCUREMENT_MENU_ITEMS = [
  "Vendor Empanelment",
  "Purchase Requisitions",
  "Quotation Comparison",
  "Approve Quotation",
  "Purchase Orders",
  "Delivery & GRN Tracking",
  "Procurement Dashboard",
];

export const AppShell: React.FC<AppShellProps> = ({
  user,
  onLogout,
  initialTab = "ACCOUNTING",
}) => {
  const DONOR_SEED_HYDRATED_KEY = "s3_erp_donor_seed_hydrated";
  const readInitialNav = () => {
    try {
      const raw =
        sessionStorage.getItem(NAV_SESSION_KEY) ||
        localStorage.getItem(NAV_LOCAL_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        activeTab?: string;
        activeSubTab?: string;
        rentView?: "landing" | "summary" | "renewals" | "mapcoa" | "vouchers";
        consultantView?:
          | "landing"
          | "summary"
          | "renewals"
          | "mapcoa"
          | "vouchers";
        travelView?:
          | "landing"
          | "summary"
          | "mapcoa"
          | "vouchers"
          | "perdiem"
          | "expense";
      };
      const legacyTabMap: Record<string, string> = {
        REQUISITIONS: "ACCOUNTING",
        "EXPENSE VOUCHER": "ACCOUNTING",
        "BANK VOUCHER": "ACCOUNTING",
        "PAYMENT VOUCHER": "ACCOUNTING",
        "BANK RECONCILIATION": "ACCOUNTING",
        "CASH FLOW": "ACCOUNTING",
      };
      const normalizedTab =
        legacyTabMap[parsed.activeTab || ""] || parsed.activeTab;

      const legacySubTabMap: Record<string, string> = {
        "Consultant Req": "Consultant",
        Travel: "Travel",
        "IT Spend Req": "Travel",
        "Review & Approve": REVIEW_REQUISITIONS_SUBTAB,
        "Review & Approve Req": REVIEW_REQUISITIONS_SUBTAB,
        "Approve Vouchers": "Approve Expense Vouchers",
        "Upload Entries": "Upload Bank Entries",
        "Map Entries": "Map Bank Entries",
      };

      return {
        activeTab: normalizedTab,
        activeSubTab:
          legacySubTabMap[parsed.activeSubTab || ""] || parsed.activeSubTab,
        rentView: parsed.rentView,
        consultantView: parsed.consultantView,
        travelView: parsed.travelView,
      };
    } catch {
      return null;
    }
  };

  const initialNav = readInitialNav();
  const [activeTab, setActiveTab] = useState(
    (initialNav?.activeTab || initialTab).toUpperCase(),
  );
  const [activeSubTab, setActiveSubTab] = useState(
    initialNav?.activeSubTab || DEFAULT_POST_LOGIN_NAV.activeSubTab,
  );
  const [isAdminCreating, setIsAdminCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editingGrant, setEditingGrant] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [rentView, setRentView] = useState<
    "landing" | "summary" | "renewals" | "mapcoa" | "vouchers"
  >(
    (
      initialNav?.rentView === "landing" ||
        initialNav?.rentView === "summary" ||
        initialNav?.rentView === "renewals" ||
        initialNav?.rentView === "mapcoa" ||
        initialNav?.rentView === "vouchers"
    ) ?
      initialNav.rentView
    : "landing",
  );
  const [rentRefreshKey, setRentRefreshKey] = useState(0);
  const [consultantView, setConsultantView] = useState<
    "landing" | "summary" | "renewals" | "mapcoa" | "vouchers"
  >(
    (
      initialNav?.consultantView === "landing" ||
        initialNav?.consultantView === "summary" ||
        initialNav?.consultantView === "renewals" ||
        initialNav?.consultantView === "mapcoa" ||
        initialNav?.consultantView === "vouchers"
    ) ?
      initialNav.consultantView
    : "landing",
  );
  const [travelView, setTravelView] = useState<
    "landing" | "summary" | "mapcoa" | "vouchers" | "perdiem" | "expense"
  >(
    (
      initialNav?.travelView === "landing" ||
        initialNav?.travelView === "summary" ||
        initialNav?.travelView === "mapcoa" ||
        initialNav?.travelView === "vouchers" ||
        initialNav?.travelView === "perdiem" ||
        initialNav?.travelView === "expense"
    ) ?
      initialNav.travelView
    : "landing",
  );
  const [travelDefaultVoucher, setTravelDefaultVoucher] = useState<
    | {
        voucherType:
          | "Expense Voucher"
          | "Per Diem Voucher"
          | "Payment Voucher"
          | "Advance Voucher";
        reqId: string;
        note?: "Advance" | "Balance";
      }
    | undefined
  >(undefined);
  const [persistenceMode, setPersistenceMode] = useState<"disk" | "local">(
    "local",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [appState, setAppState] = useState<any>(INITIAL_DEFAULTS);
  const [autoOpenDonorAddToken, setAutoOpenDonorAddToken] = useState(0);
  const didHydrateNav = useRef(false);

  const loadInitialAppData = useCallback(async () => {
    // Since we're using localStorage directly, we don't need to check health or make API calls
    // We'll directly load data from localStorage
    
    const loadedState: any = { ...INITIAL_DEFAULTS };
    const modules = Object.keys(INITIAL_DEFAULTS);

    // Load data for each module from localStorage
    for (const moduleId of modules) {
      try {
        // Initialize module data if it doesn't exist
        await initializeModuleData(moduleId, INITIAL_DEFAULTS[moduleId]);
        
        // Load existing data
        loadedState[moduleId] = await loadData(moduleId);
      } catch (err) {
        console.error(`Error loading data for module ${moduleId}:`, err);
        // If there's an error, use the default data
        loadedState[moduleId] = INITIAL_DEFAULTS[moduleId];
      }
    }
    await hydrateEmptyRentSeedModules(loadedState);
    await hydrateRentSupportSeedModules(loadedState);

    // Check for local saved state
    const localSaved = localStorage.getItem("s3_erp_local_state");
    if (localSaved) {
      try {
        const parsedState = JSON.parse(localSaved);
        const shouldHydrateDonorSeed =
          localStorage.getItem(DONOR_SEED_HYDRATED_KEY) !== "true" &&
          (!Array.isArray(parsedState.donor_database) ||
            parsedState.donor_database.length === 0) &&
          (!Array.isArray(parsedState.donations) ||
            parsedState.donations.length === 0);

        if (shouldHydrateDonorSeed) {
          parsedState.donor_database = donorDatabaseSeed;
          parsedState.donations = donationsSeed;
          localStorage.setItem(DONOR_SEED_HYDRATED_KEY, "true");
          localStorage.setItem(
            "s3_erp_local_state",
            JSON.stringify({ ...INITIAL_DEFAULTS, ...parsedState }),
          );
        }
        await hydrateEmptyRentSeedModules(parsedState);
        await hydrateRentSupportSeedModules(parsedState);
        localStorage.setItem(
          "s3_erp_local_state",
          JSON.stringify({ ...INITIAL_DEFAULTS, ...parsedState }),
        );

        return {
          mode: "local" as const,
          state: { ...INITIAL_DEFAULTS, ...parsedState },
        };
      } catch (e) {
        return { mode: "local" as const, state: INITIAL_DEFAULTS };
      }
    }

    return { mode: "local" as const, state: loadedState };
  }, []);

  const getDDMMYYYY = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const initApp = useCallback(async () => {
    setIsLoading(true);
    try {
      if (appShellBootCache) {
        setPersistenceMode(appShellBootCache.mode);
        setAppState(appShellBootCache.state);
        return;
      }

      if (!appShellBootPromise) {
        appShellBootPromise = loadInitialAppData();
      }

      const bootData = await appShellBootPromise;
      if (bootData) {
        appShellBootCache = bootData;
        setPersistenceMode(bootData.mode);
        setAppState(bootData.state);
      }
      primePersistenceSignatureCache(bootData.state);
    } catch (err) {
      appShellBootPromise = null;
      setPersistenceMode("local");
      setAppState(INITIAL_DEFAULTS);
      primePersistenceSignatureCache(INITIAL_DEFAULTS);
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialAppData]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    try {
      const raw =
        sessionStorage.getItem(NAV_SESSION_KEY) ||
        localStorage.getItem(NAV_LOCAL_KEY);
      if (!raw) {
        didHydrateNav.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as {
        activeTab?: string;
        activeSubTab?: string;
        rentView?: "landing" | "summary" | "renewals" | "mapcoa" | "vouchers";
        consultantView?:
          | "landing"
          | "summary"
          | "renewals"
          | "mapcoa"
          | "vouchers";
        travelView?:
          | "landing"
          | "summary"
          | "mapcoa"
          | "vouchers"
          | "perdiem"
          | "expense";
      };
      if (parsed.activeTab) setActiveTab(parsed.activeTab);
      if (parsed.activeSubTab) setActiveSubTab(parsed.activeSubTab);
      if (
        parsed.rentView === "landing" ||
        parsed.rentView === "summary" ||
        parsed.rentView === "renewals" ||
        parsed.rentView === "mapcoa" ||
        parsed.rentView === "vouchers"
      ) {
        setRentView(parsed.rentView);
      }
      if (
        parsed.consultantView === "landing" ||
        parsed.consultantView === "summary" ||
        parsed.consultantView === "renewals" ||
        parsed.consultantView === "mapcoa" ||
        parsed.consultantView === "vouchers"
      ) {
        setConsultantView(parsed.consultantView);
      }
      if (
        parsed.travelView === "landing" ||
        parsed.travelView === "summary" ||
        parsed.travelView === "mapcoa" ||
        parsed.travelView === "vouchers" ||
        parsed.travelView === "perdiem" ||
        parsed.travelView === "expense"
      ) {
        setTravelView(parsed.travelView);
      }
    } catch {
      // ignore malformed session data
    } finally {
      didHydrateNav.current = true;
    }
  }, []);

  useEffect(() => {
    if (!didHydrateNav.current) return;
    const payload = JSON.stringify({
      activeTab,
      activeSubTab,
      rentView,
      consultantView,
      travelView,
    });
    try {
      sessionStorage.setItem(NAV_SESSION_KEY, payload);
    } catch {}
    try {
      localStorage.setItem(NAV_LOCAL_KEY, payload);
    } catch {}
  }, [activeTab, activeSubTab, rentView, consultantView, travelView]);

  const saveToPersistence = useCallback(
    async (moduleId: string, data: any) => {
      let nextSignature = "";
      try {
        nextSignature = JSON.stringify(data ?? null);
      } catch {
        nextSignature = "";
      }

      if (persistenceSignatureCache[moduleId] === nextSignature) return;
      persistenceSignatureCache[moduleId] = nextSignature;

      setAppState((prev: any = {}) => {
        let prevSignature = "";
        try {
          prevSignature = JSON.stringify(prev?.[moduleId] ?? null);
        } catch {
          prevSignature = "";
        }

        if (prevSignature === nextSignature) return prev;

        const nextState = { ...prev, [moduleId]: data };
        if (persistenceMode === "local") {
          localStorage.setItem("s3_erp_local_state", JSON.stringify(nextState));
        }
        return nextState;
      });

      if (persistenceMode === "disk") {
        try {
          // Save to localStorage instead of API
          await saveData(moduleId, data);
        } catch (err) {
          console.error(`Error saving data for module ${moduleId}:`, err);
        }
      }
    },
    [persistenceMode],
  );

  const handleUpdateConsultantVouchers = useCallback(
    (data: any) => saveToPersistence("Requisitions/consultant/vouchers", data),
    [saveToPersistence],
  );

  const handleUpdateExpenseVouchers = useCallback(
    (data: any) => saveToPersistence("ExpenseVoucher/create", data),
    [saveToPersistence],
  );

  const handleUpdateBankVouchers = useCallback(
    (data: any) => saveToPersistence("BankVoucher/create", data),
    [saveToPersistence],
  );

  const handleUpdateRentVouchers = useCallback(
    (data: any) => saveToPersistence("Requisitions/rent/vouchers", data),
    [saveToPersistence],
  );

  const handleUpdateTravelVouchers = useCallback(
    (data: any) => saveToPersistence("travel/vouchers", data),
    [saveToPersistence],
  );

  const handleUpdateTravelRecords = useCallback(
    (data: any) => saveToPersistence("travel/records", data),
    [saveToPersistence],
  );

  const handleApproveRow = useCallback(
    (
      _reqId: string,
      sourceType: "Consultant" | "Rent" | "Travel",
      requestor: string,
      monthKey: string,
      options: { autoExpenseVoucher: boolean; autoBankVoucher: boolean },
    ) => {
      const name = requestor.trim().toLowerCase();
      if (sourceType === "Rent") {
        const current: any[] = appState["Requisitions/rent/vouchers"] || [];
        const updated = current.map((snapshot: any) => ({
          ...snapshot,
          landlords: (snapshot.landlords || []).map((landlord: any) => {
            if (
              String(landlord.landlordName || "")
                .trim()
                .toLowerCase() !== name
            )
              return landlord;
            return {
              ...landlord,
              monthlyDetails: (landlord.monthlyDetails || []).map(
                (detail: any) => {
                  if (detail.monthKey !== monthKey) return detail;
                  return {
                    ...detail,
                    approved: "Y",
                    ...(options.autoExpenseVoucher ?
                      { expenseVoucherCreated: "Y" }
                    : {}),
                    ...(options.autoBankVoucher ?
                      { paymentVoucherCreated: "Y" }
                    : {}),
                  };
                },
              ),
            };
          }),
        }));
        handleUpdateRentVouchers(updated);
      } else if (sourceType === "Consultant") {
        const current: any[] =
          appState["Requisitions/consultant/vouchers"] || [];
        const updated = current.map((snapshot: any) => ({
          ...snapshot,
          consultants: (snapshot.consultants || []).map((consultant: any) => {
            if (
              String(consultant.consultantName || "")
                .trim()
                .toLowerCase() !== name
            )
              return consultant;
            return {
              ...consultant,
              monthlyDetails: (consultant.monthlyDetails || []).map(
                (detail: any) => {
                  if (detail.monthKey !== monthKey) return detail;
                  return {
                    ...detail,
                    approved: "Y",
                    ...(options.autoExpenseVoucher ?
                      { expenseVoucherCreated: "Y" }
                    : {}),
                    ...(options.autoBankVoucher ?
                      { paymentVoucherCreated: "Y" }
                    : {}),
                  };
                },
              ),
            };
          }),
        }));
        handleUpdateConsultantVouchers(updated);
      } else if (sourceType === "Travel") {
        const currentRecords: any[] =
          appState["travel/records"] ||
          appState["Requisitions/travel/records"] ||
          [];
        const updatedRecords = currentRecords.map((record: any) =>
          String(record.id || "").trim() === _reqId.trim() ?
            {
              ...record,
              status: "Approved",
              ...(options.autoExpenseVoucher ?
                { expenseVoucherCreated: "Y" }
              : {}),
              ...(options.autoBankVoucher ?
                { paymentVoucherCreated: "Y" }
              : {}),
            }
          : record,
        );
        handleUpdateTravelRecords(updatedRecords);

        // Create expense / payment voucher entries if requested
        if (options.autoExpenseVoucher || options.autoBankVoucher) {
          const travelRec = currentRecords.find(
            (r: any) => String(r.id || "").trim() === _reqId.trim(),
          );
          const travelExp = (appState["travel/expenses"] || []).find(
            (e: any) => String(e.reqId || "").trim() === _reqId.trim(),
          );
          const amount =
            travelExp ?
              travelExp.actualTicketCost +
              travelExp.actualLodgingCost +
              travelExp.actualLocalConveyance +
              (travelExp.reqPerDiemAmount || 0)
            : Number(travelRec?.totalAmount || travelRec?.travelAmount || 0);
          const today = new Date().toISOString().slice(0, 10);
          const payee = requestor;
          const project = String(travelRec?.projectName || "-");

          if (options.autoExpenseVoucher) {
            const existing: any[] = appState["vouchers_expense"] || [];
            const maxNum = existing.reduce((acc: number, v: any) => {
              const n = Number(String(v.id || "").replace(/[^\d]/g, ""));
              return Number.isFinite(n) ? Math.max(acc, n) : acc;
            }, 0);
            const newExpVoucher = {
              id: `TEV-${String(maxNum + 1).padStart(3, "0")}`,
              date: today,
              amount,
              payee,
              status: "Pending Review",
              linkedReq: _reqId,
              linkedExpId: travelExp?.expId || "",
              project,
              sourceType: "Travel",
            };
            saveToPersistence("vouchers_expense", [...existing, newExpVoucher]);
          }

          if (options.autoBankVoucher) {
            const expVouchers: any[] = appState["vouchers_expense"] || [];
            const linkedExpVoucher = expVouchers.find(
              (v: any) => String(v.linkedReq || "").trim() === _reqId.trim(),
            );
            const existing: any[] = appState["vouchers_bank"] || [];
            const maxNum = existing.reduce((acc: number, v: any) => {
              const n = Number(String(v.id || "").replace(/[^\d]/g, ""));
              return Number.isFinite(n) ? Math.max(acc, n) : acc;
            }, 0);
            const newBankVoucher = {
              id: `TPV-${String(maxNum + 1).padStart(3, "0")}`,
              date: today,
              amount,
              payee,
              status: "Pending Review",
              linkedReq: _reqId,
              linkedExpId: travelExp?.expId || "",
              linkedExpVoucherId: linkedExpVoucher?.id || "",
              project,
              sourceType: "Travel",
            };
            saveToPersistence("vouchers_bank", [...existing, newBankVoucher]);
          }
        }
      }
    },
    [
      appState,
      handleUpdateRentVouchers,
      handleUpdateConsultantVouchers,
      handleUpdateTravelRecords,
      saveToPersistence,
    ],
  );

  const handleResetRow = useCallback(
    (
      _reqId: string,
      sourceType: "Consultant" | "Rent" | "Travel",
      requestor: string,
      monthKey: string,
    ) => {
      const name = requestor.trim().toLowerCase();
      if (sourceType === "Rent") {
        const current: any[] = appState["Requisitions/rent/vouchers"] || [];
        const updated = current.map((snapshot: any) => ({
          ...snapshot,
          landlords: (snapshot.landlords || []).map((landlord: any) => {
            if (
              String(landlord.landlordName || "")
                .trim()
                .toLowerCase() !== name
            )
              return landlord;
            return {
              ...landlord,
              monthlyDetails: (landlord.monthlyDetails || []).map(
                (detail: any) => {
                  if (detail.monthKey !== monthKey) return detail;
                  const next = { ...detail };
                  delete next.approved;
                  delete next.expenseVoucherCreated;
                  delete next.paymentVoucherCreated;
                  return next;
                },
              ),
            };
          }),
        }));
        handleUpdateRentVouchers(updated);
      } else if (sourceType === "Consultant") {
        const current: any[] =
          appState["Requisitions/consultant/vouchers"] || [];
        const updated = current.map((snapshot: any) => ({
          ...snapshot,
          consultants: (snapshot.consultants || []).map((consultant: any) => {
            if (
              String(consultant.consultantName || "")
                .trim()
                .toLowerCase() !== name
            )
              return consultant;
            return {
              ...consultant,
              monthlyDetails: (consultant.monthlyDetails || []).map(
                (detail: any) => {
                  if (detail.monthKey !== monthKey) return detail;
                  const next = { ...detail };
                  delete next.approved;
                  delete next.expenseVoucherCreated;
                  delete next.paymentVoucherCreated;
                  return next;
                },
              ),
            };
          }),
        }));
        handleUpdateConsultantVouchers(updated);
      } else if (sourceType === "Travel") {
        // Reset travel record back to Pending
        const currentRecords: any[] =
          appState["travel/records"] ||
          appState["Requisitions/travel/records"] ||
          [];
        const updatedRecords = currentRecords.map((record: any) => {
          if (String(record.id || "").trim() !== _reqId.trim()) return record;
          const next = {
            ...record,
            status: "Pending",
            expenseStatus: "Not Submitted",
          };
          delete next.expenseVoucherCreated;
          delete next.paymentVoucherCreated;
          return next;
        });
        handleUpdateTravelRecords(updatedRecords);
        // Reset linked expense record back to Draft
        const currentExpenses: any[] = appState["travel/expenses"] || [];
        const updatedExpenses = currentExpenses.map((exp: any) =>
          String(exp.reqId || "").trim() === _reqId.trim() ?
            { ...exp, expenseStatus: "Draft" }
          : exp,
        );
        saveToPersistence("travel/expenses", updatedExpenses);
        // Remove any expense and payment vouchers linked to this req
        const filteredExpVouchers = (appState["vouchers_expense"] || []).filter(
          (v: any) => String(v.linkedReq || "").trim() !== _reqId.trim(),
        );
        saveToPersistence("vouchers_expense", filteredExpVouchers);
        const filteredBankVouchers = (appState["vouchers_bank"] || []).filter(
          (v: any) => String(v.linkedReq || "").trim() !== _reqId.trim(),
        );
        saveToPersistence("vouchers_bank", filteredBankVouchers);
      }
    },
    [
      appState,
      handleUpdateRentVouchers,
      handleUpdateConsultantVouchers,
      handleUpdateTravelRecords,
      saveToPersistence,
    ],
  );

  const handleSaveReviewSnapshot = useCallback(
    (rows: any[]) => {
      saveToPersistence("Requisitions/review_approve", rows);
      // Optional: show a success message to user
      console.log(`✓ Saved ${rows.length} review requisitions to snapshot`);
    },
    [saveToPersistence],
  );

  // Memoize consultant data arrays to prevent unnecessary re-renders
  const consultantRecords = useMemo(
    () => appState["Requisitions/consultant"] || appState.req_consultants || [],
    [appState["Requisitions/consultant"], appState.req_consultants],
  );

  const consultantFinancialYears = useMemo(
    () => appState.admin_fy || [],
    [appState.admin_fy],
  );

  const consultantTdsAccountMappings = useMemo(
    () => appState["Requisitions/consultant/tds_account"] || [],
    [appState["Requisitions/consultant/tds_account"]],
  );

  const consultantVouchersData = useMemo(
    () => appState["Requisitions/consultant/vouchers"] || [],
    [appState["Requisitions/consultant/vouchers"]],
  );

  const consultantJournalVoucherMappings = useMemo(
    () => appState["Requisitions/consultant/journal_voucher_master"] || [],
    [appState["Requisitions/consultant/journal_voucher_master"]],
  );

  const travelRecords = useMemo(
    () =>
      appState["travel/records"] ||
      appState["Requisitions/travel/records"] ||
      [],
    [appState["travel/records"], appState["Requisitions/travel/records"]],
  );

  const travelFinancialYears = useMemo(
    () => appState.admin_fy || [],
    [appState.admin_fy],
  );

  const travelVouchersData = useMemo(
    () =>
      appState["travel/vouchers"] ||
      appState["Requisitions/travel/vouchers"] ||
      [],
    [appState["travel/vouchers"], appState["Requisitions/travel/vouchers"]],
  );

  const travelJournalVoucherMappings = useMemo(
    () =>
      appState["travel/journal_voucher_master"] ||
      appState["Requisitions/travel/journal_voucher_master"] ||
      [],
    [
      appState["travel/journal_voucher_master"],
      appState["Requisitions/travel/journal_voucher_master"],
    ],
  );
  const travelPerDiemPolicies = useMemo(
    () =>
      appState["travel/per_diem_policy"] ||
      appState["requisitions/travel/per_diem_policy"] ||
      [],
    [
      appState["travel/per_diem_policy"],
      appState["requisitions/travel/per_diem_policy"],
    ],
  );

  const travelExpenseRecords = useMemo(
    () => appState["travel/expenses"] || [],
    [appState["travel/expenses"]],
  );

  const rentRecords = useMemo(
    () => appState["Requisitions/rent/records"] || [],
    [appState["Requisitions/rent/records"]],
  );

  const rentFinancialYears = useMemo(
    () => appState.admin_fy || [],
    [appState.admin_fy],
  );

  const rentTdsRules = useMemo(
    () => appState.admin_tds || [],
    [appState.admin_tds],
  );

  const rentTdsAccountMappings = useMemo(
    () => appState["Requisitions/rent/tds_account"] || [],
    [appState["Requisitions/rent/tds_account"]],
  );

  const rentVouchersData = useMemo(
    () => appState["Requisitions/rent/vouchers"] || [],
    [appState["Requisitions/rent/vouchers"]],
  );

  const rentJournalVoucherMappings = useMemo(
    () => appState["Requisitions/rent/journal_voucher_master"] || [],
    [appState["Requisitions/rent/journal_voucher_master"]],
  );

  const fixedAssetsJournalVoucherMappings = useMemo(
    () => appState["fixed_assets/journal_voucher_master"] || {},
    [appState["fixed_assets/journal_voucher_master"]],
  );
  const reviewRequisitionRows = useMemo(
    () =>
      buildReviewRequisitionRows({
        consultantRecords,
        consultantVouchersData,
        rentRecords,
        rentVouchersData,
        travelRecords,
        travelExpenseRecords,
        projects: appState.admin_project || [],
        funds: appState.admin_fund || [],
        grants: appState.admin_grant || [],
        functions: appState.admin_function || [],
        users: appState.admin_user || [],
      }),
    [
      consultantRecords,
      consultantVouchersData,
      rentRecords,
      rentVouchersData,
      travelRecords,
      travelExpenseRecords,
      appState.admin_project,
      appState.admin_fund,
      appState.admin_grant,
      appState.admin_function,
      appState.admin_user,
    ],
  );

  const reviewRequisitionActionCount = useMemo(
    () => countRowsToAction(reviewRequisitionRows),
    [reviewRequisitionRows],
  );

  const reviewApproveData = useMemo(
    () => appState["Requisitions/review_approve"] || [],
    [appState["Requisitions/review_approve"]],
  );

  useEffect(() => {
    setIsAdminCreating(false);
    if (!didHydrateNav.current) return;

    const tabDefaults: Record<string, string> = {
      ADMIN: "User Master",
      ACCOUNTING: "Cash Flow Summary",
      BUDGET: "Budget Allocation",
      GRANTS: "Grant Master",
      FIXED_ASSETS: "Asset Purchases",
      INVESTMENTS: "Investment Portfolio",
      PROCUREMENT: "Vendor Empanelment",
      DONOR_MGMT: "Donor Database",
      HRMS: "Employee Directory",
      BENEFICIARIES: "Beneficiary Directory",
      REPORTING: "Balance Sheet",
      PROFILE: "",
    };

    const tabItems: Record<string, string[]> = {
      ADMIN: [
        "User Master",
        "Company Master",
        "Location Master",
        "Fund Type Master",
        "Function Master",
        "Project Master",
        "Financial Year Master",
        "Chart of Accounts Master",
        "Map Expenses",
        "TDS Master",
        "Data Backup/JSON",
      ],
      ACCOUNTING: [
        "Cash Flow Summary",
        "Create Expense Voucher",
        "Approve Expense Vouchers",
        "Create Bank Voucher",
        "Approve Bank Vouchers",
        "Voucher Status",
        "Consultant",
        "Travel",
        "Rent",
        REVIEW_REQUISITIONS_SUBTAB,
        "Payment Integration Status",
        "Upload Bank Entries",
        "Map Bank Entries",
      ],
      BUDGET: ["Budget Allocation", "Variance Analysis", "Forecasts"],
      GRANTS: ["Grant Master", "Grant Allocation"],
      FIXED_ASSETS: [
        "Asset Register",
        "Asset Purchases",
        "Asset Disposal",
        "Map to Chart of Accounts",
        "Depreciation",
        "Maintenance",
      ],
      INVESTMENTS: [
        "Investment Portfolio",
        "Market Valuation",
        "Income Tracking",
      ],
      PROCUREMENT: PROCUREMENT_MENU_ITEMS,
      DONOR_MGMT: [
        "Donor Database",
        "Add Donations",
        "Donation receipts",
        "Form 10BD & Form 10BE",
      ],
      HRMS: ["Employee Directory", "Attendance", "Payroll"],
      BENEFICIARIES: [
        "Beneficiary Directory",
        "Batches",
        "Fee Master",
        "Collect Fees",
        "Funder Allocation",
        "Impact Tracking",
      ],
      REPORTING: [
        "Balance Sheet",
        "Income & Expenditure",
        "Fund-wise Income & Expenditure",
        "Receipts & Payments",
        "Fixed Assets Schedule",
        "Test LLMs",
        "Note 1 - Share Capital",
        "Note 2 - Reserves and Surplus",
        "Note 3 - Current Liabilities",
        "Note 4 - Non-Current Assets",
        "Note 5 - Current Assets",
        "Note 6 - Donations & Grants",
        "Note 7 - Other Income",
        "Note 8 - Salaries & Benefits",
        "Note 9 - Program Expenses",
        "Note 10 - General Expenses",
        "Note 11 - Previous Year's Figures",
        "Note 12 - Restricted Fund Movement",
        "Note 13 - Grant Funds Fixed Assets",
        "Note 13A - Self Funded Fixed Assets",
      ],
      PROFILE: [],
    };

    const items = tabItems[activeTab] || [];
    // Only auto-correct invalid subtabs, don't change valid ones
    if (items.length > 0 && !items.includes(activeSubTab)) {
      const nextDefault = tabDefaults[activeTab];
      if (nextDefault && nextDefault !== activeSubTab) {
        setActiveSubTab(nextDefault);
      }
    }
  }, [activeTab, activeSubTab]);

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const renderSidebarSubMenu = () => {
    if (activeTab === "ADMIN") {
      const ADMIN_SECTIONS = [
        {
          title: "General Masters",
          icon: Database,
          items: [
            "Company Master",
            "Function Master",
            "Location Master",
            "Project Master",
            "User Master",
          ],
        },
        {
          title: "Accounting Masters",
          icon: Table,
          items: [
            "Chart of Accounts Master",
            "Financial Year Master",
            "Fund Type Master",
            "Map Expenses",
            "TDS Master",
          ].sort(),
        },
        {
          title: "System",
          icon: ShieldCheck,
          items: ["Data Backup/JSON"],
        },
      ];

      return (
        <div className="space-y-4">
          {ADMIN_SECTIONS.map((section) => {
            const isCollapsed = collapsedGroups.has(section.title);
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="space-y-1">
                <button
                  onClick={() => toggleGroupCollapse(section.title)}
                  className="w-full px-4 py-2 flex items-center justify-between group hover:bg-brand-500/5 rounded-xl transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={14}
                      className="text-brand-500"
                    />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-300 ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 pl-4 overflow-hidden">
                      {section.items.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setActiveSubTab(sub);
                            setIsAdminCreating(false);
                          }}
                          className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeSubTab === sub ? "bg-brand-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/10"}`}>
                          {isSidebarCollapsed ? sub.charAt(0) : sub}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "ACCOUNTING") {
      const requisitionGroups = [
        {
          label: "Recurring Expenses",
          items: [
            { label: "Consultants", value: "Consultant" },
            { label: "Rent", value: "Rent" },
          ],
        },
        {
          label: "Non-Recurring Expenses",
          items: [{ label: "Travel", value: "Travel" }],
        },
      ];

      const ACCOUNTING_SECTIONS = [
        {
          title: "Requisitions",
          icon: FileText,
          items: [],
        },
        {
          title: "Vouchers",
          icon: CreditCard,
          items: [
            "Create Expense Voucher",
            "Approve Expense Vouchers",
            "Create Bank Voucher",
            "Approve Bank Vouchers",
          ],
        },
        {
          title: "Reconciliation",
          icon: RefreshCw,
          items: [
            "Payment Integration Status",
            "Upload Bank Entries",
            "Map Bank Entries",
          ],
        },
        {
          title: "Cash Flow & Budget",
          icon: TrendingUp,
          items: ["Cash Flow Summary"],
        },
      ];

      return (
        <div className="space-y-4">
          {ACCOUNTING_SECTIONS.map((section) => {
            const isCollapsed = collapsedGroups.has(section.title);
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="space-y-1">
                <button
                  onClick={() => toggleGroupCollapse(section.title)}
                  className="w-full px-4 py-2 flex items-center justify-between group hover:bg-brand-500/5 rounded-xl transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={14}
                      className="text-brand-500"
                    />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-300 ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 pl-4 overflow-hidden">
                      {section.title === "Requisitions" ?
                        <>
                          {requisitionGroups.map((group) => (
                            <div
                              key={group.label}
                              className="space-y-1">
                              <div className="px-4 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                {group.label}
                              </div>
                              {group.items.map((item) => (
                                <button
                                  key={item.value}
                                  onClick={() => {
                                    setActiveSubTab(item.value);
                                    if (item.value === "Rent") {
                                      setRentView("landing");
                                      setRentRefreshKey((prev) => prev + 1);
                                    }
                                    if (item.value === "Consultant") {
                                      setConsultantView("landing");
                                    }
                                    if (item.value === "Travel") {
                                      setTravelView("landing");
                                    }
                                    setIsAdminCreating(false);
                                  }}
                                  className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeSubTab === item.value ? "bg-brand-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/10"}`}>
                                  {isSidebarCollapsed ? item.label.charAt(0) : item.label}
                                </button>
                              ))}
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setActiveSubTab(REVIEW_REQUISITIONS_SUBTAB);
                              setIsAdminCreating(false);
                            }}
                            className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeSubTab === REVIEW_REQUISITIONS_SUBTAB ? "bg-brand-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/10"}`}>
                            {isSidebarCollapsed ?
                              REVIEW_REQUISITIONS_SUBTAB.charAt(0)
                            : `${REVIEW_REQUISITIONS_SUBTAB} (${reviewRequisitionActionCount})`}
                          </button>
                        </>
                      : section.items.map((sub) => {
                          const displayLabel =
                            sub === REVIEW_REQUISITIONS_SUBTAB ?
                              `${sub} (${reviewRequisitionActionCount})`
                            : sub;
                          return (
                            <button
                              key={sub}
                              onClick={() => {
                                setActiveSubTab(sub);
                                if (sub === "Rent") {
                                  setRentView("landing");
                                  setRentRefreshKey((prev) => prev + 1);
                                }
                                if (sub === "Consultant") {
                                  setConsultantView("landing");
                                }
                                if (sub === "Travel") {
                                  setTravelView("landing");
                                }
                                setIsAdminCreating(false);
                              }}
                              className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeSubTab === sub ? "bg-brand-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/10"}`}>
                              {isSidebarCollapsed ? sub.charAt(0) : displayLabel}
                            </button>
                          );
                        })
                      }
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "REPORTING") {
      const REPORTING_SECTIONS = [
        {
          title: "Financial Reports",
          icon: FileText,
          items: [
            "Balance Sheet",
            "Income & Expenditure",
            "Fund-wise Income & Expenditure",
            "Receipts & Payments",
            "Fixed Assets Schedule",
          ],
        },
        {
          title: "Notes to Accounts",
          icon: FileText,
          items: [
            "Note 1 - Share Capital",
            "Note 2 - Reserves and Surplus",
            "Note 3 - Current Liabilities",
            "Note 4 - Non-Current Assets",
            "Note 5 - Current Assets",
            "Note 6 - Donations & Grants",
            "Note 7 - Other Income",
            "Note 8 - Salaries & Benefits",
            "Note 9 - Program Expenses",
            "Note 10 - General Expenses",
            "Note 11 - Previous Year's Figures",
            "Note 12 - Restricted Fund Movement",
            "Note 13 - Grant Funds Fixed Assets",
            "Note 13A - Self Funded Fixed Assets",
          ],
        },
        {
          title: "Donor Reports",
          icon: Users,
          items: [],
        },
        {
          title: "Grant Reports",
          icon: Archive,
          items: ["Test LLMs"],
        },
      ];

      return (
        <div className="space-y-4">
          {REPORTING_SECTIONS.map((section) => {
            const isCollapsed = collapsedGroups.has(section.title);
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="space-y-1">
                <button
                  onClick={() => toggleGroupCollapse(section.title)}
                  className="w-full px-4 py-2 flex items-center justify-between group hover:bg-brand-500/5 rounded-xl transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={14}
                      className="text-brand-500"
                    />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-300 ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && section.items.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 pl-4 overflow-hidden">
                      {section.items.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setActiveSubTab(sub);
                            setIsAdminCreating(false);
                          }}
                          className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeSubTab === sub ? "bg-brand-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/10"}`}>
                          {isSidebarCollapsed ? sub.charAt(0) : sub}
                        </button>
                      ))}
                    </motion.div>
                  )}
                  {!isCollapsed && section.items.length === 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 py-2 pl-8 text-xs text-slate-400 italic overflow-hidden">
                      Coming Soon
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      );
    }

    const simpleMenuMap: Record<string, string[]> = {
      BUDGET: ["Budget Allocation", "Variance Analysis", "Forecasts"],
      GRANTS: ["Grant Master", "Grant Allocation"],
      FIXED_ASSETS: [
        "Asset Register",
        "Asset Purchases",
        "Asset Disposal",
        "Map to Chart of Accounts",
        "Depreciation",
        "Maintenance",
      ],
      INVESTMENTS: [
        "Investment Portfolio",
        "Market Valuation",
        "Income Tracking",
      ],
      PROCUREMENT: PROCUREMENT_MENU_ITEMS,
      HRMS: ["Employee Directory", "Attendance", "Payroll"],
      DONOR_MGMT: [
        "Donor Database",
        "Add Donations",
        "Donation receipts",
        "Form 10BD & Form 10BE",
      ],
      BENEFICIARIES: [
        "Beneficiary Directory",
        "Batches",
        "Fee Master",
        "Collect Fees",
        "Funder Allocation",
        "Impact Tracking",
      ],
    };

    const currentSubMenu = simpleMenuMap[activeTab] || [];
    if (currentSubMenu.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="px-4 mb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Navigation
        </div>
        {currentSubMenu.map((sub) => (
          <button
            key={sub}
            onClick={() => {
              setActiveSubTab(sub);
              setIsAdminCreating(false);
            }}
            className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeSubTab === sub ? "bg-brand-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-brand-500/10"}`}>
            {isSidebarCollapsed ? sub.charAt(0) : sub}
          </button>
        ))}
      </div>
    );
  };

  const renderMainContent = () => {
    if (isLoading)
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full"
          />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Initializing S³ Core...
          </span>
        </div>
      );

    const theme = "brand-600";

    if (activeTab === "ADMIN") {
      if (activeSubTab === "Data Backup/JSON")
        return (
          <DataBackupPage
            appState={appState}
            onImport={saveToPersistence}
            onReset={() => {
              localStorage.removeItem("s3_erp_local_state");
              window.location.reload();
            }}
            themeColor={theme}
          />
        );
      if (activeSubTab === "Chart of Accounts Master")
        return (
          <ChartOfAccountsPage
            data={appState.chart_of_accounts}
            onUpdate={(d) => saveToPersistence("chart_of_accounts", d)}
            themeColor={theme}
          />
        );
      if (activeSubTab === "Map Expenses")
        return (
          <MapExpensesAdminPage
            themeColor={theme}
            chartOfAccounts={appState.chart_of_accounts}
            mappingData={appState.admin_mapping}
            onSaveMapping={(d) => saveToPersistence("admin_mapping", d)}
          />
        );
      if (activeSubTab === "TDS Master")
        return (
          <TDSMasterPage
            data={appState.admin_tds}
            fyList={appState.admin_fy}
            onUpdate={(d) => saveToPersistence("admin_tds", d)}
            themeColor={theme}
          />
        );

      const entityMap: any = {
        "User Master": "User",
        "Company Master": "Company",
        "Location Master": "Location",
        "Fund Type Master": "Fund Type",
        "Function Master": "Function",
        "Project Master": "Project",
        "Financial Year Master": "Financial Year",
      };
      const moduleIdMap: any = {
        "User Master": "admin_user",
        "Company Master": "admin_company",
        "Location Master": "admin_location",
        "Fund Type Master": "admin_fund",
        "Function Master": "admin_function",
        "Project Master": "admin_project",
        "Financial Year Master": "admin_fy",
      };

      if (isAdminCreating) {
        if (activeSubTab === "User Master")
          return (
            <AddUserPage
              onCancel={() => {
                setIsAdminCreating(false);
                setEditingUser(null);
              }}
              onSave={(userRecord) => {
                const existingUsers = appState.admin_user || [];
                const isEditingUser = typeof userRecord.id === "number";
                const nextUser = {
                  ...userRecord,
                  id: isEditingUser ? userRecord.id : Date.now(),
                  creator:
                    isEditingUser ?
                      userRecord.creator || user || "Admin"
                    : user || "Admin",
                  date:
                    isEditingUser ?
                      userRecord.date || getDDMMYYYY()
                    : getDDMMYYYY(),
                };

                const nextUsers =
                  isEditingUser ?
                    existingUsers.map((item: any) =>
                      item.id === nextUser.id ? { ...item, ...nextUser } : item,
                    )
                  : [...existingUsers, nextUser];

                saveToPersistence("admin_user", nextUsers);
                setEditingUser(null);
                setIsAdminCreating(false);
              }}
              masterLists={{
                funds: appState.admin_fund,
                grants: appState.admin_grant,
                functions: appState.admin_function,
                projects: appState.admin_project,
              }}
              initialUser={editingUser ?? undefined}
              themeColor={theme}
            />
          );
        if (activeSubTab === "Company Master")
          return (
            <AddCompanyPage
              onCancel={() => setIsAdminCreating(false)}
              masterLists={{
                funds: appState.admin_fund,
                grants: appState.admin_grant,
                functions: appState.admin_function,
                projects: appState.admin_project,
              }}
              themeColor={theme}
            />
          );
        if (activeSubTab === "Location Master")
          return (
            <AddLocationPage
              onCancel={() => setIsAdminCreating(false)}
              themeColor={theme}
              onSave={(item) =>
                saveToPersistence(moduleIdMap[activeSubTab], [
                  ...(appState[moduleIdMap[activeSubTab]] || []),
                  {
                    ...item,
                    id: Date.now(),
                    creator: user || "Admin",
                    date: getDDMMYYYY(),
                  },
                ])
              }
            />
          );

        if (activeSubTab === "Grant Master")
          return (
            <AddGrantPage
              onCancel={() => {
                setIsAdminCreating(false);
                setEditingGrant(null);
              }}
              themeColor={theme}
              initialGrant={editingGrant ?? undefined}
              existingGrants={appState.admin_grant || []}
              mouRecords={appState["grant/mou"] || []}
              budgetRecords={appState["grant/budget"] || []}
              fucRecords={appState["grant/fuc"] || []}
              reportRecords={appState["grant/reports"] || []}
              coaMappings={appState["grant/coa"] || []}
              utilizationRecords={appState["grant/utilization"] || []}
              onSaveDetails={(grant) => {
                const existing: any[] = appState.admin_grant || [];
                const idx = existing.findIndex((g: any) => g.id === grant.id);
                const next =
                  idx >= 0 ?
                    existing.map((g: any, i: number) =>
                      i === idx ? { ...g, ...grant } : g,
                    )
                  : [...existing, grant];
                saveToPersistence("admin_grant", next);
              }}
              onSaveMOU={(recs) => saveToPersistence("grant/mou", recs)}
              onSaveBudget={(recs) => saveToPersistence("grant/budget", recs)}
              onSaveFUC={(recs) => saveToPersistence("grant/fuc", recs)}
              onSaveReports={(recs) => saveToPersistence("grant/reports", recs)}
              onSaveCOA={(recs) => saveToPersistence("grant/coa", recs)}
              onSaveUtilization={(recs) =>
                saveToPersistence("grant/utilization", recs)
              }
            />
          );

        return (
          <MasterDataForm
            entityName={entityMap[activeSubTab]}
            onCancel={() => setIsAdminCreating(false)}
            themeColor={theme}
            locationsList={appState.admin_location}
            onSave={(item) =>
              saveToPersistence(moduleIdMap[activeSubTab], [
                ...(appState[moduleIdMap[activeSubTab]] || []),
                {
                  ...item,
                  id: Date.now(),
                  creator: user || "Admin",
                  date: getDDMMYYYY(),
                },
              ])
            }
          />
        );
      }

      return (
        <MasterDataPage
          entityName={entityMap[activeSubTab]}
          onAddNew={() => {
            setEditingUser(null);
            setIsAdminCreating(true);
          }}
          data={appState[moduleIdMap[activeSubTab]] || []}
          onUpdate={(newData) =>
            saveToPersistence(moduleIdMap[activeSubTab], newData)
          }
          onEditItem={
            activeSubTab === "User Master" ?
              (item) => {
                setEditingUser(item as UserRecord);
                setIsAdminCreating(true);
              }
            : undefined
          }
          themeColor={theme}
        />
      );
    }

    if (activeTab === "GRANTS") {
      if (isAdminCreating && activeSubTab === "Grant Master") {
        return (
          <AddGrantPage
            onCancel={() => {
              setIsAdminCreating(false);
              setEditingGrant(null);
            }}
            themeColor={theme}
            initialGrant={editingGrant ?? undefined}
            existingGrants={appState.admin_grant || []}
            mouRecords={appState["grant/mou"] || []}
            budgetRecords={appState["grant/budget"] || []}
            fucRecords={appState["grant/fuc"] || []}
            reportRecords={appState["grant/reports"] || []}
            coaMappings={appState["grant/coa"] || []}
            utilizationRecords={appState["grant/utilization"] || []}
            onSaveDetails={(grant) => {
              const existing: any[] = appState.admin_grant || [];
              const idx = existing.findIndex((g: any) => g.id === grant.id);
              const next =
                idx >= 0 ?
                  existing.map((g: any, i: number) =>
                    i === idx ? { ...g, ...grant } : g,
                  )
                : [...existing, grant];
              saveToPersistence("admin_grant", next);
            }}
            onSaveMOU={(recs) => saveToPersistence("grant/mou", recs)}
            onSaveBudget={(recs) => saveToPersistence("grant/budget", recs)}
            onSaveFUC={(recs) => saveToPersistence("grant/fuc", recs)}
            onSaveReports={(recs) => saveToPersistence("grant/reports", recs)}
            onSaveCOA={(recs) => saveToPersistence("grant/coa", recs)}
            onSaveUtilization={(recs) =>
              saveToPersistence("grant/utilization", recs)
            }
          />
        );
      }

      if (activeSubTab === "Grant Master")
        return (
          <GrantMasterPage
            grants={appState.admin_grant || []}
            coaMappings={appState["grant/coa"] || []}
            utilizationRecords={appState["grant/utilization"] || []}
            onAddNew={() => {
              setEditingGrant(null);
              setIsAdminCreating(true);
            }}
            onEditGrant={(g) => {
              setEditingGrant(g);
              setIsAdminCreating(true);
            }}
            onUpdateGrants={(d) => saveToPersistence("admin_grant", d)}
            onSaveCOA={(d) => saveToPersistence("grant/coa", d)}
            onSaveUtilization={(d) => saveToPersistence("grant/utilization", d)}
            themeColor={theme}
          />
        );

      if (activeSubTab === "Grant Allocation")
        return (
          <GrantAllocationPage
            allocations={appState["grant/allocation"] || []}
            locations={appState.admin_location || []}
            grants={appState.admin_grant || []}
            onUpdate={(d) => saveToPersistence("grant/allocation", d)}
            themeColor={theme}
            currentUser={user || "Admin"}
          />
        );

      return (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
          Select an item from the menu
        </div>
      );
    }

    if (activeTab === "ACCOUNTING") {
      if (activeSubTab === "Consultant") {
        const userOptions = (appState.admin_user || [])
          .map((user: any) => String(user?.name || "").trim())
          .filter((name: string) => name.length > 0);
        const consultantLocationOptions = (appState.admin_location || [])
          .map((loc: any) => String(loc?.name || "").trim())
          .filter((name: string) => name.length > 0);
        if (consultantView === "landing") {
          return (
            <ConsultantLandingPage
              data={consultantRecords}
              onOpenSummary={() => setConsultantView("summary")}
              onOpenRenewals={() => setConsultantView("renewals")}
              onOpenVouchers={() => setConsultantView("vouchers")}
              onOpenMapToCoa={() => setConsultantView("mapcoa")}
              isDarkMode={isDarkMode}
            />
          );
        }
        if (consultantView === "vouchers") {
          return (
            <ConsultantVouchersPage
              themeColor={theme}
              consultantRecords={consultantRecords}
              financialYears={consultantFinancialYears}
              tdsAccountMappings={consultantTdsAccountMappings}
              vouchersData={consultantVouchersData}
              journalVoucherMappings={consultantJournalVoucherMappings}
              onUpdateVouchersData={handleUpdateConsultantVouchers}
              onBackToLanding={() => setConsultantView("landing")}
            />
          );
        }
        if (consultantView === "mapcoa") {
          return (
            <ConsultantMapToCoaPage
              themeColor={theme}
              consultantRecords={consultantRecords}
              chartOfAccounts={appState.chart_of_accounts || []}
              tdsRules={appState.admin_tds || []}
              journalVoucherMappings={consultantJournalVoucherMappings}
              tdsAccountMappings={consultantTdsAccountMappings}
              onUpdateJournalVoucherMappings={(d) =>
                saveToPersistence(
                  "requisitions/consultant/journal_voucher_master",
                  d,
                )
              }
              onUpdateTdsAccountMappings={(d) =>
                saveToPersistence("Requisitions/consultant/tds_account", d)
              }
              onBackToLanding={() => setConsultantView("landing")}
            />
          );
        }
        return (
          <ConsultantReqPage
            themeColor={theme}
            data={consultantRecords}
            filterMode={consultantView === "renewals" ? "renewals" : "all"}
            userOptions={userOptions}
            locationOptions={consultantLocationOptions}
            tdsAccountMappings={consultantTdsAccountMappings}
            onBackToLanding={() => setConsultantView("landing")}
            onUpdate={async (nextData) => {
              await saveToPersistence("Requisitions/consultant", nextData);
            }}
          />
        );
      }
      if (activeSubTab === "Travel") {
        const employeeOptions = (appState.admin_user || [])
          .map((user: any) => String(user?.name || "").trim())
          .filter((name: string) => name.length > 0);
        const consultantOptions = consultantRecords.map((cons: any) =>
          String(cons?.vendorName || "").trim(),
        );
        const projectOptions = (appState.admin_project || [])
          .map((proj: any) => String(proj?.name || "").trim())
          .filter((name: string) => name.length > 0);
        const locationOptions = (appState.admin_location || [])
          .map((loc: any) => String(loc?.name || "").trim())
          .filter((name: string) => name.length > 0);
        const wrapTravelView = (content: React.ReactNode) => (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/70 shadow-xl p-6 md:p-8">
            {content}
          </div>
        );

        if (travelView === "landing") {
          return (
            <TravelLandingPage
              data={travelRecords}
              onOpenSummary={() => setTravelView("summary")}
              onOpenExpenseSubmission={() => setTravelView("expense")}
              onOpenVouchers={() => setTravelView("vouchers")}
              onOpenMapToCoa={() => setTravelView("mapcoa")}
              onOpenPerDiem={() => setTravelView("perdiem")}
              perDiemCount={travelPerDiemPolicies.length}
              isDarkMode={isDarkMode}
            />
          );
        }
        if (travelView === "summary") {
          return wrapTravelView(
            <TravelReqPage
              themeColor={theme}
              data={travelRecords}
              journalVoucherMappings={travelJournalVoucherMappings}
              employeeOptions={employeeOptions}
              consultantOptions={consultantOptions}
              projectOptions={
                projectOptions.length > 0 ?
                  projectOptions
                : ["Project A", "Project B", "Project C"]
              }
              locationOptions={
                locationOptions.length > 0 ?
                  locationOptions
                : ["Delhi-HO", "Mumbai", "Bangalore"]
              }
              onBackToLanding={() => setTravelView("landing")}
              onUpdate={async (nextData) => {
                await saveToPersistence("travel/records", nextData);
              }}
              defaultVoucher={travelDefaultVoucher}
              onDefaultVoucherConsumed={() =>
                setTravelDefaultVoucher(undefined)
              }
            />,
          );
        }
        if (travelView === "vouchers") {
          return wrapTravelView(
            <TravelVouchersPage
              themeColor={theme}
              travelRecords={travelRecords}
              financialYears={travelFinancialYears}
              vouchersData={travelVouchersData}
              journalVoucherMappings={travelJournalVoucherMappings}
              onUpdateVouchersData={handleUpdateTravelVouchers}
              onBackToLanding={() => setTravelView("landing")}
            />,
          );
        }
        if (travelView === "mapcoa") {
          return wrapTravelView(
            <TravelMapToCoaPage
              travelRecords={travelRecords}
              chartOfAccounts={appState.chart_of_accounts || []}
              journalVoucherMappings={travelJournalVoucherMappings}
              onUpdateJournalVoucherMappings={(d) =>
                saveToPersistence("travel/journal_voucher_master", d)
              }
              onBackToLanding={() => setTravelView("landing")}
            />,
          );
        }
        if (travelView === "perdiem") {
          return wrapTravelView(
            <TravelPerDiemPage
              themeColor={theme}
              data={travelPerDiemPolicies}
              onBackToLanding={() => setTravelView("landing")}
              onUpdate={(nextData) =>
                saveToPersistence("travel/per_diem_policy", nextData)
              }
            />,
          );
        }
        if (travelView === "expense") {
          return wrapTravelView(
            <TravelExpensePage
              themeColor={theme}
              travelRecords={travelRecords}
              expenseRecords={travelExpenseRecords}
              onBackToLanding={() => setTravelView("landing")}
              onUpdateExpenses={async (nextData) => {
                await saveToPersistence("travel/expenses", nextData);
              }}
              onUpdateRequisitions={async (nextData) => {
                await saveToPersistence("travel/records", nextData);
              }}
            />,
          );
        }
        return wrapTravelView(<div>Travel Summary View (Coming Soon)</div>);
      }
      if (activeSubTab === "Rent") {
        const rentLocationOptions = (appState.admin_location || [])
          .map((location: any) => String(location?.name || "").trim())
          .filter((name: string) => name.length > 0);
        if (rentView === "landing") {
          return (
            <RentLandingPage
              data={rentRecords}
              onOpenSummary={() => setRentView("summary")}
              onOpenRenewals={() => setRentView("renewals")}
              onOpenVouchers={() => setRentView("vouchers")}
              onOpenMapToCoa={() => setRentView("mapcoa")}
              isDarkMode={isDarkMode}
            />
          );
        }
        if (rentView === "vouchers") {
          return (
            <RentVouchersPage
              themeColor={theme}
              rentRecords={rentRecords}
              financialYears={rentFinancialYears}
              tdsRules={rentTdsRules}
              tdsAccountMappings={rentTdsAccountMappings}
              vouchersData={rentVouchersData}
              journalVoucherMappings={rentJournalVoucherMappings}
              onUpdateVouchersData={handleUpdateRentVouchers}
              refreshKey={rentRefreshKey}
              onBackToLanding={() => setRentView("landing")}
            />
          );
        }
        if (rentView === "mapcoa") {
          return (
            <MapExpensesPage
              themeColor={theme}
              rentRecords={rentRecords}
              chartOfAccounts={appState.chart_of_accounts || []}
              tdsRules={rentTdsRules}
              journalVoucherMappings={rentJournalVoucherMappings}
              tdsAccountMappings={rentTdsAccountMappings}
              onUpdateJournalVoucherMappings={(d) =>
                saveToPersistence("Requisitions/rent/journal_voucher_master", d)
              }
              onUpdateTdsAccountMappings={(d) =>
                saveToPersistence("Requisitions/rent/tds_account", d)
              }
              onBackToLanding={() => setRentView("landing")}
            />
          );
        }
        return (
          <RentReqPage
            themeColor={theme}
            data={rentRecords}
            locations={rentLocationOptions}
            filterMode={rentView === "renewals" ? "renewals" : "all"}
            onBackToLanding={() => setRentView("landing")}
            onUpdate={async (nextData) => {
              // Ensure nav state is set (only if not already set) to prevent navigation jumps
              if (
                activeTab !== "ACCOUNTING" ||
                activeSubTab !== "Rent" ||
                (rentView !== "summary" && rentView !== "renewals")
              ) {
                setActiveTab("ACCOUNTING");
                setActiveSubTab("Rent");
                setRentView("summary");

                // Preserve in sessionStorage
                try {
                  const payload = JSON.stringify({
                    activeTab: "ACCOUNTING",
                    activeSubTab: "Rent",
                    rentView: "summary",
                    consultantView,
                  });
                  sessionStorage.setItem(NAV_SESSION_KEY, payload);
                  localStorage.setItem(NAV_LOCAL_KEY, payload);
                } catch {}
              }

              // Save the data
              await saveToPersistence("Requisitions/rent/records", nextData);
            }}
          />
        );
      }
      if (activeSubTab === REVIEW_REQUISITIONS_SUBTAB)
        return (
          <ApproveReqPage
            mode="review"
            themeColor={theme}
            rows={reviewRequisitionRows}
            consultantData={consultantRecords}
            rentData={rentRecords}
            travelData={travelRecords}
            travelExpenseRecords={travelExpenseRecords}
            chartOfAccounts={appState.chart_of_accounts || []}
            onApproveRow={handleApproveRow}
            onResetRow={handleResetRow}
            onSaveSnapshot={handleSaveReviewSnapshot}
          />
        );
      if (activeSubTab === "Create Expense Voucher")
        return (
          <CreateVoucher
            type="Expense"
            themeColor={theme}
            fundTypes={appState.admin_fund}
            chartOfAccounts={appState.chart_of_accounts}
            locationsList={appState.admin_location}
            mappingData={appState.admin_mapping}
            data={appState["ExpenseVoucher/create"] || []}
            onUpdate={handleUpdateExpenseVouchers}
          />
        );
      if (activeSubTab === "Create Bank Voucher")
        return (
          <CreateVoucher
            type="Bank"
            themeColor={theme}
            fundTypes={appState.admin_fund}
            chartOfAccounts={appState.chart_of_accounts}
            locationsList={appState.admin_location}
            mappingData={appState.admin_mapping}
            data={appState["BankVoucher/create"] || []}
            onUpdate={handleUpdateBankVouchers}
          />
        );
      if (activeSubTab === "Approve Expense Vouchers")
        return (
          <ApproveExpenseVoucherPage
            themeColor={theme}
            data={reviewApproveData}
            consultantData={consultantRecords}
            rentData={rentRecords}
            travelData={travelRecords}
            onCreateExpenseVoucher={(reqId, sourceType) => {
              console.log(
                `Creating expense voucher for ${reqId} (${sourceType})`,
              );
              // TODO: Implement expense voucher creation logic
            }}
          />
        );
      if (activeSubTab === "Payment Integration Status")
        return <PaymentIntegrationStatus themeColor={theme} />;
      if (activeSubTab === "Approve Bank Vouchers")
        return (
          <ApprovePaymentVoucherPage
            themeColor={theme}
            data={reviewApproveData}
            consultantData={consultantRecords}
            rentData={rentRecords}
            travelData={travelRecords}
            chartOfAccounts={appState.chart_of_accounts || []}
            onCreatePaymentVoucher={(reqId, sourceType) => {
              console.log(
                `Creating payment voucher for ${reqId} (${sourceType})`,
              );
              // TODO: Implement payment voucher creation logic
            }}
          />
        );
      if (activeSubTab === "Upload Bank Entries")
        return <UploadEntries themeColor={theme} />;
      if (activeSubTab === "Map Bank Entries")
        return <MapEntries themeColor={theme} />;
      if (activeSubTab === "Cash Flow Summary")
        return (
          <CashFlowPage
            themeColor={theme}
            consultantVouchers={consultantVouchersData}
            travelVouchers={travelVouchersData}
            travelRecords={travelRecords}
            travelExpenses={travelExpenseRecords}
            rentVouchers={rentVouchersData}
            consultantRecords={consultantRecords}
            rentRecords={rentRecords}
          />
        );
    }

    if (activeTab === "FIXED_ASSETS") {
      const fixedAssetTypes = ((appState.chart_of_accounts || []) as any[])
        .filter(
          (master) => String(master?.master || "").toLowerCase() === "assets",
        )
        .flatMap((master) => master?.groups || [])
        .filter(
          (group) =>
            String(group?.name || "").toLowerCase() === "fixed assets",
        )
        .flatMap((group) => group?.ledgers || []);

      if (activeSubTab === "Asset Register") {
        return (
          <AssetRegisterPage
            fyList={appState.admin_fy || []}
            purchases={appState.fixed_assets_purchases || []}
            depreciationRegister={
              appState.fixed_assets_depreciation_register || []
            }
            disposals={appState.fixed_assets_disposals || []}
            themeColor={theme}
          />
        );
      }

      if (activeSubTab === "Asset Purchases") {
        return (
          <AssetPurchasesPage
            data={appState.fixed_assets_purchases || []}
            onUpdate={(newData) =>
              saveToPersistence("fixed_assets_purchases", newData)
            }
            assetTypes={fixedAssetTypes}
            locationsList={appState.admin_location || []}
            fundTypes={appState.admin_fund || []}
            themeColor={theme}
          />
        );
      }

      if (activeSubTab === "Asset Disposal") {
        return (
          <AssetDisposalPage
            purchases={appState.fixed_assets_purchases || []}
            disposals={appState.fixed_assets_disposals || []}
            onUpdate={(newData) =>
              saveToPersistence("fixed_assets_disposals", newData)
            }
            themeColor={theme}
          />
        );
      }

      if (activeSubTab === "Map to Chart of Accounts") {
        return (
          <FixedAssetsMapToCoaPage
            chartOfAccounts={appState.chart_of_accounts || []}
            journalVoucherMappings={fixedAssetsJournalVoucherMappings}
            onUpdateJournalVoucherMappings={(newData) =>
              saveToPersistence("fixed_assets/journal_voucher_master", newData)
            }
          />
        );
      }

      if (activeSubTab === "Depreciation") {
        return (
          <DepreciationHub
            fyList={appState.admin_fy || []}
            assetTypes={fixedAssetTypes}
            purchases={appState.fixed_assets_purchases || []}
            depreciationRatesIT={
              appState.fixed_assets_depreciation_rates_it || []
            }
            depreciationRatesCA={
              appState.fixed_assets_depreciation_rates_ca || []
            }
            depreciationRegister={
              appState.fixed_assets_depreciation_register || []
            }
            onUpdateIT={(newData) =>
              saveToPersistence("fixed_assets_depreciation_rates_it", newData)
            }
            onUpdateCA={(newData) =>
              saveToPersistence("fixed_assets_depreciation_rates_ca", newData)
            }
            onUpdateRegister={(newData) =>
              saveToPersistence("fixed_assets_depreciation_register", newData)
            }
            themeColor={theme}
          />
        );
      }

      return (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
          Select an item from the menu
        </div>
      );
    }

    if (activeTab === "BENEFICIARIES") {
      if (activeSubTab === "Beneficiary Directory") {
        return (
          <BeneficiaryDirectoryPage
            data={appState.beneficiaries_directory || []}
            locationsList={appState.admin_location || []}
            batchesList={appState.beneficiaries_batches || []}
            onUpdate={(newData) =>
              saveToPersistence("beneficiaries_directory", newData)
            }
            themeColor={theme}
          />
        );
      }
      if (activeSubTab === "Batches") {
        return (
          <BatchesPage
            data={appState.beneficiaries_batches || []}
            locationsList={appState.admin_location || []}
            beneficiariesList={appState.beneficiaries_directory || []}
            onUpdate={(newData) =>
              saveToPersistence("beneficiaries_batches", newData)
            }
            themeColor={theme}
          />
        );
      }
      if (activeSubTab === "Fee Master") {
        return (
          <AllocateFeesPage
            data={appState.beneficiaries_fees || []}
            locationsList={appState.admin_location || []}
            onUpdate={(newData) => saveToPersistence("beneficiaries_fees", newData)}
            themeColor={theme}
          />
        );
      }
      if (activeSubTab === "Collect Fees") {
        return (
          <CollectFeesPage
            beneficiaries={appState.beneficiaries_directory || []}
            feeMaster={appState.beneficiaries_fees || []}
            collections={appState.beneficiaries_collections || []}
            onUpdate={(newData) =>
              saveToPersistence("beneficiaries_collections", newData)
            }
            themeColor={theme}
          />
        );
      }
      if (activeSubTab === "Funder Allocation") {
        return (
          <FunderAllocationPage
            batches={appState.beneficiaries_batches || []}
            funders={appState.admin_grant || []}
            allocations={appState.beneficiaries_funder_allocations || []}
            onUpdate={(newData) =>
              saveToPersistence("beneficiaries_funder_allocations", newData)
            }
            themeColor={theme}
          />
        );
      }

      return (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
          Select an item from the menu
        </div>
      );
    }

    if (activeTab === "DONOR_MGMT") {
      if (activeSubTab === "Donor Database") {
        return (
          <DonorDatabasePage
            data={appState.donor_database || []}
            fundTypes={appState.admin_fund || []}
            onUpdate={(newData) => saveToPersistence("donor_database", newData)}
            themeColor={theme}
            autoOpenAddToken={autoOpenDonorAddToken}
            onAutoOpenAddConsumed={setAutoOpenDonorAddToken}
          />
        );
      }

      if (activeSubTab === "Add Donations") {
        return (
          <DonationRecordsPage
            donors={appState.donor_database || []}
            donations={appState.donations || []}
            fundTypes={appState.admin_fund || []}
            projects={appState.admin_project || []}
            chartOfAccounts={appState.chart_of_accounts || []}
            locations={appState.admin_location || []}
            companies={appState.admin_company || []}
            onUpdate={(newData) => saveToPersistence("donations", newData)}
            onAddDonor={() => {
              setActiveSubTab("Donor Database");
              setAutoOpenDonorAddToken(Date.now());
            }}
            themeColor={theme}
          />
        );
      }

      if (activeSubTab === "Donation receipts") {
        return (
          <DonationReceiptsPage
            donors={appState.donor_database || []}
            donations={appState.donations || []}
            fundTypes={appState.admin_fund || []}
            onUpdate={(newData) => saveToPersistence("donations", newData)}
            themeColor={theme}
          />
        );
      }

      if (activeSubTab === "Form 10BD & Form 10BE") {
        return (
          <Form10BD10BEPage
            donors={appState.donor_database || []}
            donations={appState.donations || []}
            companies={appState.admin_company || []}
            form10BDFilings={appState.form_10bd_filings || []}
            form10BEFiles={appState.form_10be_files || []}
            onUpdateForm10BDFilings={(newData) =>
              saveToPersistence("form_10bd_filings", newData)
            }
            onUpdateForm10BEFiles={(newData) =>
              saveToPersistence("form_10be_files", newData)
            }
            themeColor={theme}
          />
        );
      }

      return (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
          Select an item from the menu
        </div>
      );
    }

    if (activeTab === "HRMS") {
      if (activeSubTab === "Employee Directory") {
        return (
          <EmployeeDirectoryPage
            data={appState.hrms_employees || []}
            locationsList={appState.admin_location || []}
            onUpdate={(newData) => saveToPersistence("hrms_employees", newData)}
            themeColor={theme}
          />
        );
      }
      if (activeSubTab === "Payroll") {
        return (
          <PayrollPage
            employees={appState.hrms_employees || []}
            payrollRuns={appState.hrms_payroll || []}
            fundTypes={appState.admin_fund || []}
            onUpdate={(newData) => saveToPersistence("hrms_payroll", newData)}
            themeColor={theme}
          />
        );
      }

      return (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
          Select an item from the menu
        </div>
      );
    }

    if (activeTab === "PROCUREMENT") {
      const legacyProcurementData = {
        vendors: appState.procurement_vendors || [],
        requisitions: appState.procurement_requisitions || [],
        quotations: appState.procurement_quotations || [],
        purchaseOrders: appState.procurement_purchase_orders || [],
        grns: appState.procurement_grn || [],
      };
      const procurementData = appState["procure/data"] || legacyProcurementData;
      const updateProcurementData = (
        key: "vendors" | "requisitions" | "quotations" | "purchaseOrders" | "grns",
        value: any[],
      ) => {
        const next = {
          ...procurementData,
          [key]: value,
        };
        saveToPersistence("procure/data", next);
      };

      return (
        <ProcurementModulePage
          activeSubTab={activeSubTab}
          vendors={procurementData.vendors || []}
          requisitions={procurementData.requisitions || []}
          quotations={procurementData.quotations || []}
          purchaseOrders={procurementData.purchaseOrders || []}
          grns={procurementData.grns || []}
          onVendorsChange={(next) => updateProcurementData("vendors", next)}
          onRequisitionsChange={(next) =>
            updateProcurementData("requisitions", next)
          }
          onQuotationsChange={(next) =>
            updateProcurementData("quotations", next)
          }
          onPurchaseOrdersChange={(next) =>
            updateProcurementData("purchaseOrders", next)
          }
          onGrnsChange={(next) => updateProcurementData("grns", next)}
        />
      );
    }

    if (activeTab === "BUDGET") {
      if (activeSubTab === "Budget Allocation")
        return (
          <BudgetsPage
            fyList={appState.admin_fy}
            chartOfAccounts={appState.chart_of_accounts}
            themeColor={theme}
            locationsList={appState.admin_location}
            payrollBudget={appState.payroll_budget}
            users={appState.admin_user || []}
            onSavePayroll={(data) => saveToPersistence("payroll_budget", data)}
          />
        );
      if (activeSubTab === "Variance Analysis")
        return (
          <BudgetSummaryPage
            themeColor={theme}
            users={appState.admin_user || []}
          />
        );
      if (activeSubTab === "Forecasts")
        return (
          <ForecastsPage
            themeColor={theme}
            users={appState.admin_user || []}
          />
        );

      return (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
          Select an item from the menu
        </div>
      );
    }

    if (activeTab === "REPORTING") {
      if (activeSubTab === "Balance Sheet")
        return (
          <BalanceSheetPage
            onNavigateToNote={(noteRef) => {
              const noteMap: Record<string, string> = {
                "1": "Note 1 - Share Capital",
                "2": "Note 2 - Reserves and Surplus",
                "3": "Note 3 - Current Liabilities",
                "4": "Note 4 - Non-Current Assets",
                "5": "Note 5 - Current Assets",
                "13": "Note 13 - Grant Funds Fixed Assets",
                "13A": "Note 13A - Self Funded Fixed Assets",
                "13&13A": "Note 13 - Grant Funds Fixed Assets",
              };
              const tabName = noteMap[noteRef];
              if (tabName) {
                setActiveSubTab(tabName);
              }
            }}
          />
        );
      if (activeSubTab === "Income & Expenditure")
        return (
          <IncomeExpenditurePage
            onNavigateToNote={(noteRef) => {
              const noteMap: Record<string, string> = {
                "6": "Note 6 - Donations & Grants",
                "7": "Note 7 - Other Income",
                "8": "Note 8 - Salaries & Benefits",
                "9": "Note 9 - Program Expenses",
                "10": "Note 10 - General Expenses",
                "13A": "Note 13A - Self Funded Fixed Assets",
              };
              const tabName = noteMap[noteRef];
              if (tabName) {
                setActiveSubTab(tabName);
              }
            }}
          />
        );
      if (activeSubTab === "Fund-wise Income & Expenditure")
        return <FundBasedIEPage />;
      if (activeSubTab === "Receipts & Payments")
        return <ReceiptsPaymentsPage />;
      if (activeSubTab === "Fixed Assets Schedule") return <FixedAssetsPage />;
      if (activeSubTab === "Note 1 - Share Capital")
        return (
          <Note1ShareCapitalPage
            onBack={() => setActiveSubTab("Balance Sheet")}
          />
        );
      if (activeSubTab === "Note 2 - Reserves and Surplus")
        return (
          <Note2ReservesPage onBack={() => setActiveSubTab("Balance Sheet")} />
        );
      if (activeSubTab === "Note 3 - Current Liabilities")
        return (
          <Note3CurrentLiabilitiesPage
            onBack={() => setActiveSubTab("Balance Sheet")}
          />
        );
      if (activeSubTab === "Note 4 - Non-Current Assets")
        return (
          <Note4NonCurrentAssetsPage
            onBack={() => setActiveSubTab("Balance Sheet")}
          />
        );
      if (activeSubTab === "Note 5 - Current Assets")
        return (
          <Note5CurrentAssetsPage
            onBack={() => setActiveSubTab("Balance Sheet")}
          />
        );
      if (activeSubTab === "Note 6 - Donations & Grants")
        return (
          <Note6DonationsGrantsPage
            onBack={() => setActiveSubTab("Income & Expenditure")}
          />
        );
      if (activeSubTab === "Note 7 - Other Income")
        return (
          <Note7OtherIncomePage
            onBack={() => setActiveSubTab("Income & Expenditure")}
          />
        );
      if (activeSubTab === "Note 8 - Salaries & Benefits")
        return (
          <Note8SalariesBenefitsPage
            onBack={() => setActiveSubTab("Income & Expenditure")}
          />
        );
      if (activeSubTab === "Note 9 - Program Expenses")
        return (
          <Note9ProgramExpensesPage
            onBack={() => setActiveSubTab("Income & Expenditure")}
          />
        );
      if (activeSubTab === "Note 10 - General Expenses")
        return (
          <Note10GeneralExpensesPage
            onBack={() => setActiveSubTab("Income & Expenditure")}
          />
        );
      if (activeSubTab === "Note 11 - Previous Year's Figures")
        return (
          <Note11PreviousYearFiguresPage
            onBack={() => setActiveSubTab("Income & Expenditure")}
          />
        );
      if (activeSubTab === "Note 12 - Restricted Fund Movement")
        return (
          <Note12RestrictedFundPage
            onBack={() => setActiveSubTab("Balance Sheet")}
          />
        );
      if (activeSubTab === "Note 13 - Grant Funds Fixed Assets")
        return (
          <Note13GrantFundsFixedAssetsPage
            onBack={() => setActiveSubTab("Balance Sheet")}
          />
        );
      if (activeSubTab === "Note 13A - Self Funded Fixed Assets")
        return (
          <Note13ASelfFundedFixedAssetsPage
            onNavigateToBalanceSheet={() => setActiveSubTab("Balance Sheet")}
            onNavigateToIncomeStatement={() =>
              setActiveSubTab("Income & Expenditure")
            }
          />
        );
      if (activeSubTab === "Test LLMs")
        return <TestLlmsPage themeColor={theme} />;
    }

    if (activeTab === "PROFILE")
      return (
        <ProfilePage
          user={user}
          themeColor={theme}
        />
      );

    return (
      <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
        Select an item from the menu
      </div>
    );
  };

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden transition-colors duration-500 ${isDarkMode ? "dark bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Header */}
      <header className="h-16 shrink-0 z-50 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm">
              S³
            </div>
            <span className="font-black tracking-tighter uppercase text-sm hidden md:block">
              Enterprise ERP
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isActive ? "text-brand-600" : (
                    "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )
                }`}>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  />
                )}
                <Icon
                  size={14}
                  className="relative z-10"
                />
                <span className="relative z-10 hidden lg:block">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-black">
              {user?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black leading-none">
                {user || "Admin"}
              </span>
              <span
                className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 ${persistenceMode === "disk" ? "text-emerald-500" : "text-amber-500"}`}>
                {persistenceMode === "disk" ? "Sync Active" : "Local Mode"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {isDarkMode ?
              <Sun size={18} />
            : <Moon size={18} />}
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {activeTab !== "PROFILE" && (
            <motion.aside
              initial={false}
              animate={{ width: isSidebarCollapsed ? 80 : 280 }}
              className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">
                    {activeTab}
                  </motion.span>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-600 transition-colors">
                  {isSidebarCollapsed ?
                    <ChevronRight size={16} />
                  : <ChevronLeft size={16} />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                {renderSidebarSubMenu()}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${persistenceMode === "disk" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                  />
                  {!isSidebarCollapsed && (
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      {persistenceMode === "disk" ?
                        "Cloud Connected"
                      : "Local Storage"}
                    </span>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
          <motion.div
            key={`${activeTab}-${activeSubTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mx-auto min-h-full ${
              (
                activeSubTab === "Budget Allocation" ||
                activeSubTab === "Variance Analysis" ||
                activeSubTab === "Forecasts" ||
                activeSubTab === "Asset Purchases" ||
                activeSubTab === "Asset Disposal" ||
                activeSubTab === "Form 10BD & Form 10BE" ||
                activeSubTab === REVIEW_REQUISITIONS_SUBTAB
              ) ?
                "max-w-full"
              : (
                activeTab === "ACCOUNTING" &&
                (activeSubTab === "Cash Flow Summary" ||
                  activeSubTab === "Create Expense Voucher" ||
                  activeSubTab === "Create Bank Voucher")
              ) ?
                "max-w-7xl"
              : "max-w-6xl"
            }`}>
            {renderMainContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
