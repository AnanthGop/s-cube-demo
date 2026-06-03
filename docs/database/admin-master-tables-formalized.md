# Admin Master Tables Formalized

## Final User Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links user to an enterprise |
| user_code | varchar(50) | No | Optional employee or user code |
| full_name | varchar(150) | Yes | User full name |
| email | varchar(150) | Yes | Official email; should be unique within enterprise |
| mobile_no | varchar(30) | No | Contact number |
| user_type | varchar(30) | Yes | Employee, Consultant, etc. |
| login_name | varchar(100) | No | Login ID if separate from email |
| password_hash | varchar(255) | No | Only if system stores internal authentication |
| status | varchar(30) | Yes | Business status such as Active, Inactive, Locked |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Company Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links every company record to an enterprise |
| company_code | varchar(50) | Yes | Unique business code for the company |
| org_name | varchar(200) | Yes | Organisation / company name |
| org_type | varchar(50) | Yes | Trust, Section 8 Company, Society, Corporate, etc. |
| pan | varchar(20) | No | PAN number |
| tan | varchar(20) | No | TAN number |
| gst | varchar(20) | No | GST number |
| csr1 | varchar(50) | No | CSR 1 registration number |
| incorp_no | varchar(100) | No | Incorporation / trust registration number |
| registered_under | varchar(150) | No | Governing act / authority |
| eighty_g_no | varchar(100) | No | 80G approval number |
| eighty_g_date | date | No | 80G validity date |
| twelve_a_no | varchar(100) | No | 12A approval number |
| twelve_a_date | date | No | 12A validity date |
| fcra_no | varchar(100) | No | FCRA registration number |
| fcra_date | date | No | FCRA validity date |
| darpan_id | varchar(100) | No | NGO Darpan ID |
| contact | varchar(30) | No | Contact number |
| email | varchar(150) | No | Official email |
| website | varchar(250) | No | Website URL |
| address | text | No | Registered address |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Location Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links location to an enterprise |
| location_code | varchar(50) | Yes | Unique business code for the location |
| location_name | varchar(150) | Yes | Office or branch name |
| region | varchar(50) | No | North, South, East, West, etc. |
| state | varchar(100) | Yes | State name |
| city | varchar(100) | Yes | City or district |
| address | text | No | Full address |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Fund Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links fund to an enterprise |
| fund_code | varchar(50) | Yes | Unique fund code |
| fund_name | varchar(150) | Yes | Fund name |
| description | varchar(500) | No | Optional description |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Function Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links function to an enterprise |
| function_code | varchar(50) | Yes | Unique function code |
| function_name | varchar(150) | Yes | Function name |
| description | varchar(500) | No | Optional description |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Project Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links project to an enterprise |
| project_code | varchar(50) | Yes | Unique project code |
| project_name | varchar(200) | Yes | Project name |
| description | varchar(500) | No | Optional description |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Project Location Map Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links mapping to an enterprise |
| project_id | bigint or uuid | Yes | Linked project |
| location_id | bigint or uuid | Yes | Linked location |
| is_active | boolean | Yes | true = active, false = inactive mapping |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Financial Year Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links financial year to an enterprise |
| fy_code | varchar(20) | Yes | Example: 2025-2026 |
| fy_name | varchar(50) | Yes | Display name |
| start_date | date | Yes | Financial year start date |
| end_date | date | Yes | Financial year end date |
| fy_status | varchar(20) | Yes | Open, Lock, Close |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Grant Master Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links grant to an enterprise |
| grant_code | varchar(50) | Yes | Unique grant code |
| grant_name | varchar(200) | Yes | Grant name |
| grantor_name | varchar(200) | Yes | Name of grantor / donor |
| period_start | date | Yes | Grant start date |
| period_end | date | Yes | Grant end date |
| approved_grant_amount | decimal(18,2) | No | Approved grant amount |
| grant_received_till_date | decimal(18,2) | No | Amount received till date |
| balance_grant_receivable | decimal(18,2) | No | Balance receivable |
| fuc_frequency | varchar(30) | No | Monthly, Quarterly, Half-Yearly, Annual |
| project_report_frequency | varchar(30) | No | Reporting frequency |
| audited_fuc_required | boolean | No | true if audited FUC required |
| audited_fuc_date | date | No | Date of audited FUC |
| status | varchar(30) | Yes | Business status |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final TDS Rule Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links TDS rule to an enterprise |
| financial_year_id | bigint or uuid | Yes | Linked financial year |
| rule_type | varchar(150) | Yes | Nature of payment |
| section_code | varchar(30) | Yes | TDS section code, e.g. 194J |
| tds_rate | decimal(8,4) | Yes | TDS percentage |
| threshold_amount | decimal(18,2) | Yes | Threshold value |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Expense Mapping Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links mapping to an enterprise |
| mapping_code | varchar(50) | No | Optional mapping code |
| expense_type | varchar(100) | Yes | Travel, Rent, Consultant, IT, etc. |
| fund_id | bigint or uuid | No | Linked fund |
| grant_id | bigint or uuid | No | Linked grant |
| function_id | bigint or uuid | No | Linked function |
| project_id | bigint or uuid | No | Linked project |
| ledger_id | bigint or uuid | Yes | Linked COA ledger |
| tds_rule_id | bigint or uuid | No | Linked TDS rule |
| remarks | varchar(500) | No | Optional note |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final COA Master Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links COA master to an enterprise |
| master_name | varchar(50) | Yes | Assets, Liabilities, Income, Expenditure |
| display_order | int | No | UI display order |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final COA Group Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links COA group to an enterprise |
| coa_master_id | bigint or uuid | Yes | Linked COA master |
| group_code | varchar(50) | No | Optional group code |
| group_name | varchar(150) | Yes | Group name |
| display_order | int | No | UI display order |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final COA Ledger Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_id | bigint or uuid | Yes | Links COA ledger to an enterprise |
| coa_group_id | bigint or uuid | Yes | Linked COA group |
| ledger_code | varchar(50) | No | Optional ledger code |
| ledger_name | varchar(200) | Yes | Ledger name |
| is_party_account | boolean | Yes | true if party ledger |
| pan_no | varchar(20) | No | Party PAN |
| address | text | No | Party address |
| contact_no | varchar(30) | No | Party contact |
| gst_no | varchar(20) | No | Party GST |
| name_as_per_bank | varchar(200) | No | Bank account name |
| bank_details | text | No | Bank details |
| ifsc_code | varchar(20) | No | IFSC code |
| tds_code | varchar(50) | No | Related TDS code |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |

## Final Enterprise Table

| Column name | Data type | Required | Notes |
|---|---|---:|---|
| id | bigint or uuid | Yes | Primary key |
| enterprise_code | varchar(50) | Yes | Unique enterprise code |
| enterprise_name | varchar(200) | Yes | Legal or reporting name |
| enterprise_type | varchar(50) | No | Trust, NGO, Company, Section 8, etc. |
| pan | varchar(20) | No | PAN number |
| tan | varchar(20) | No | TAN number |
| gstin | varchar(20) | No | GST registration number |
| csr1_no | varchar(50) | No | CSR1 registration number |
| incorporation_no | varchar(100) | No | Registration number |
| registered_under | varchar(150) | No | Governing act or authority |
| eighty_g_no | varchar(100) | No | 80G number |
| eighty_g_valid_till | date | No | 80G validity date |
| twelve_a_no | varchar(100) | No | 12A number |
| twelve_a_valid_till | date | No | 12A validity date |
| fcra_no | varchar(100) | No | FCRA number |
| fcra_valid_till | date | No | FCRA validity date |
| darpan_id | varchar(100) | No | NGO Darpan ID |
| contact_no | varchar(30) | No | Contact number |
| email | varchar(150) | No | Official email |
| website | varchar(250) | No | Website URL |
| address | text | No | Registered address |
| is_active | boolean | Yes | true = active, false = inactive / soft deleted |
| created_at | timestamp | Yes | Record creation timestamp |
| created_by | bigint or uuid | Yes | User who created the record |
| updated_at | timestamp | Yes | Last update timestamp |
| updated_by | bigint or uuid | Yes | User who last updated the record |
| deleted_at | timestamp | No | Filled when soft delete happens |
| deleted_by | bigint or uuid | No | User who marked it inactive |
