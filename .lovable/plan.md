

# Insurance Industry — Full End-to-End CRM Implementation

## Overview

Build a complete Insurance CRM with a dedicated `leads_insurance` table, specialized UI, and insurance-specific features. Key differentiators from other industries:
- **"Insurance Plans" replace "Products"** — plans have contribution frequency (Monthly/Quarterly/Bi-Yearly/Yearly), duration, and premium details
- **Lead fields** tailored for insurance sales: age, gender, PAN number, occupation, annual income, nominee details
- **Lead Profiling** centered on insurance sales use cases (Life/Health/Motor → sub-categories → coverage tiers)

---

## 1. Database: `leads_insurance` Table

New table with insurance-specific columns, following the established pattern:

| Column | Type | Notes |
|---|---|---|
| Standard CRM columns | — | `id`, `name`, `email`, `phone`, `whatsapp`, `company_id`, `created_by_id`, `pre/sales/post_sales_owner_id`, `revenue_projected/received`, `reminder_at`, `last_notification_sent_at`, `payment_link`, `utm_*`, `lg_link_id`, `form_id`, `notes`, `lead_source`, `lead_history`, `status_metadata`, `lead_profile`, `created_at`, `updated_at` |
| `age` | integer | Customer age |
| `gender` | text | male/female/other |
| `pan_number` | text | PAN card number |
| `date_of_birth` | date | DOB for policy calculations |
| `occupation` | text | Customer occupation |
| `annual_income` | numeric | For plan eligibility |
| `insurance_type` | text | Life/Health/Motor/Home/Travel etc. |
| `plan_name` | text | Selected insurance plan |
| `sum_insured` | numeric | Coverage amount |
| `premium_amount` | numeric | Premium per frequency |
| `contribution_frequency` | text | Monthly/Quarterly/Bi-Yearly/Yearly |
| `policy_term` | integer | Duration in years |
| `existing_policies` | text | Existing coverage details |
| `nominee_name` | text | Nominee |
| `nominee_relation` | text | Relationship to nominee |
| `agent_name` | text | Selling agent |
| `policy_number` | text | Policy number once issued |
| `policy_start_date` | date | Policy start |
| `renewal_date` | date | Next renewal |
| `loss_reason` | text | Why lead was lost |
| `status` | text NOT NULL DEFAULT 'new' | |

RLS: Same pattern — company isolation, hierarchy-based visibility, admin-only delete.

---

## 2. Insurance Plans Page (replaces Products for insurance industry)

Create `src/pages/ManageInsurancePlans.tsx` — a dedicated page where insurance companies manage their plans:

- **Plan fields**: Plan Name, Insurance Type (Life/Health/Motor/etc.), Sum Insured, Premium Amount, Contribution Frequency (Monthly/Quarterly/Bi-Yearly/Yearly), Policy Term (years), Description
- Uses the existing `products` table but with insurance-specific UI labels and fields
- OR create an `insurance_plans` table if the `products` table schema is too limited

Since the existing `products` table has: `category`, `name`, `price`, `quantity_available` — this maps well:
- `category` → Insurance Type (Life, Health, Motor)
- `name` → Plan Name
- `price` → Premium Amount
- But we need additional fields (contribution_frequency, policy_term, sum_insured)

**Decision**: We'll use the existing `products` table and store insurance-specific metadata in a new `metadata` jsonb column, OR create a simple `ManageInsurancePlans.tsx` page that wraps ManageProducts with insurance-specific labels. Given the user wants contribution frequency and duration as first-class fields, we should add a `metadata` jsonb column to the `products` table to store `{ contribution_frequency, policy_term, sum_insured, description }`.

---

## 3. Frontend Components (`src/industries/insurance/`)

| File | Purpose |
|---|---|
| `InsuranceAllLeads.tsx` | Main page with table/kanban toggle, insurance type filter |
| `hooks/useInsuranceLeads.ts` | Data hook querying `leads_insurance` |
| `components/InsuranceLeadsTable.tsx` | Table: Name, Phone, Age, Gender, Insurance Type, Plan, Premium, Contribution Freq, Policy Term, Status, Owner |
| `components/InsuranceAddLeadDialog.tsx` | Add form: personal info + insurance details + plan selection |
| `components/InsuranceEditLeadDialog.tsx` | Edit all fields |
| `components/InsuranceLeadDetailsDialog.tsx` | Sections: Personal Info, Insurance Details, Policy Info, Financial, Timeline |
| `components/InsuranceAssignLeadsDialog.tsx` | Bulk assign |
| `components/InsuranceUploadLeadsDialog.tsx` | CSV upload with insurance column mapping |
| `ManageInsurancePlans.tsx` | Insurance plans management (replaces Products page) |
| `InsuranceLeadProfiling.tsx` | Lead profiling config for insurance (e.g., Life → Term/ULIP/Endowment → coverage tier) |

---

## 4. Lead Profiling for Insurance

Create `src/industries/insurance/InsuranceLeadProfiling.tsx` following the Real Estate pattern but with insurance-centric defaults:

```text
Life Insurance
  ├── Term Insurance
  │   ├── < 50 Lakh
  │   ├── 50L - 1 Cr
  │   └── 1 Cr+
  ├── ULIP
  │   ├── Short Term (5-10 yrs)
  │   └── Long Term (15+ yrs)
  └── Endowment
Health Insurance
  ├── Individual
  │   ├── < 5 Lakh
  │   ├── 5-10 Lakh
  │   └── 10 Lakh+
  ├── Family Floater
  └── Senior Citizen
Motor Insurance
  ├── Comprehensive
  └── Third Party
```

Uses the existing `lead_profiling_config` table with `industry: 'insurance'`.

---

## 5. Routing & Navigation Updates

1. **`src/pages/AllLeads.tsx`** — Add `if (company?.industry === 'insurance') return <InsuranceAllLeads />;`
2. **`src/hooks/useLeadsTable.ts`** — Add: `if (industry === 'insurance') tableName = 'leads_insurance';`
3. **`src/components/layout/AppLayout.tsx`** — Add nav items:
   - "Insurance Plans" (replaces Products, `industryOnly: 'insurance'`)
   - "Lead Profiling" (extend to include `insurance` industry)
4. **`src/components/leads/LeadsKanbanBoard.tsx`** — Add `leads_insurance` search support (by `plan_name`, `insurance_type`)
5. **`src/pages/FormBuilder.tsx`** — Add `INSURANCE_LEAD_COLUMNS` for form building
6. **`src/App.tsx`** — Add routes for insurance plans page and insurance lead profiling

---

## 6. Config Updates (`src/industries/insurance/config.ts`)

Add to existing config:
- `CONTRIBUTION_FREQUENCIES`: Monthly, Quarterly, Bi-Yearly, Yearly
- `LOSS_REASONS`: Too Expensive, Has Existing Coverage, Competitor Offer, Not Interested, Age Ineligible
- `NOMINEE_RELATIONS`: Spouse, Child, Parent, Sibling, Other
- Update `INSURANCE_LEAD_COLUMNS` to include new fields (PAN, DOB, contribution_frequency, nominee_relation)

---

## 7. Implementation Order

1. **Migration**: Create `leads_insurance` table + RLS policies + add `metadata` jsonb to `products` table
2. **Config**: Update `insurance/config.ts` with contribution frequencies, loss reasons, nominee relations
3. **Hook**: Create `useInsuranceLeads.ts`
4. **Components**: Build table, add/edit/details/upload/assign dialogs
5. **Insurance Plans page**: Create `ManageInsurancePlans.tsx`
6. **Lead Profiling**: Create `InsuranceLeadProfiling.tsx`
7. **Main page**: Build `InsuranceAllLeads.tsx` with table + kanban
8. **Routing**: Update `AllLeads.tsx`, `useLeadsTable.ts`, `AppLayout.tsx`, `LeadsKanbanBoard.tsx`, `FormBuilder.tsx`, `App.tsx`
9. **Exports**: Update `insurance/index.ts`

Total: ~12 new files, ~7 edited files, 1 migration.

