

# Healthcare Industry — Full End-to-End CRM Implementation

## Overview

Healthcare currently only has a `config.ts` file. We need to build the complete stack: database table, all UI components, hooks, routing, Kanban support, and Form Builder integration — mirroring the SaaS implementation.

---

## 1. Database: `leads_healthcare` Table

Create a new table with healthcare-specific columns, following the same pattern as `leads_saas` and `leads_real_estate`.

| Column | Type | Notes |
|---|---|---|
| Standard CRM columns | — | `id`, `name`, `email`, `phone`, `whatsapp`, `company_id`, `created_by_id`, `pre/sales/post_sales_owner_id`, `revenue_projected/received`, `reminder_at`, `last_notification_sent_at`, `payment_link`, `utm_*`, `lg_link_id`, `form_id`, `notes`, `lead_source`, `lead_history`, `status_metadata`, `lead_profile`, `created_at`, `updated_at` |
| `age` | integer | Patient age |
| `gender` | text | male/female/other |
| `condition` | text | Medical condition/concern |
| `symptoms` | text | Symptom description |
| `department` | text | General Medicine, Cardiology, etc. |
| `doctor_preference` | text | Preferred doctor |
| `appointment_date` | timestamptz | Scheduled appointment |
| `appointment_time` | text | Time slot |
| `referral_source` | text | Who referred |
| `insurance_provider` | text | Insurance company |
| `insurance_id` | text | Policy number |
| `treatment_type` | text | Type of treatment |
| `treatment_cost` | numeric | Treatment cost |
| `treatment_date` | date | When treatment happened |
| `follow_up_date` | date | Next follow-up |
| `status` | text NOT NULL DEFAULT 'new_enquiry' | |

RLS policies: Same pattern as `leads_saas` — company isolation, hierarchy-based visibility, admin-only delete.

---

## 2. Frontend Components (`src/industries/healthcare/`)

Create 8 files mirroring the SaaS structure:

| File | Purpose |
|---|---|
| `HealthcareAllLeads.tsx` | Main page with table/kanban toggle, department/gender filters |
| `hooks/useHealthcareLeads.ts` | Data hook querying `leads_healthcare` with healthcare filters |
| `components/HealthcareLeadsTable.tsx` | Table: Patient Name, Phone, Department, Condition, Doctor, Appointment Date, Treatment Cost, Status, Owner |
| `components/HealthcareAddLeadDialog.tsx` | Add form with patient details, department, condition, insurance |
| `components/HealthcareEditLeadDialog.tsx` | Edit form with all healthcare fields |
| `components/HealthcareLeadDetailsDialog.tsx` | Detail view: Patient Info, Medical Info, Appointment, Insurance, Treatment, Timeline |
| `components/HealthcareAssignLeadsDialog.tsx` | Bulk assign |
| `components/HealthcareUploadLeadsDialog.tsx` | CSV upload with healthcare column mapping |

---

## 3. Integration Updates (4 existing files)

1. **`src/pages/AllLeads.tsx`** — Add `if (company?.industry === 'healthcare') return <HealthcareAllLeads />;`

2. **`src/hooks/useLeadsTable.ts`** — Add healthcare mapping: `if (industry === 'healthcare') tableName = 'leads_healthcare';`

3. **`src/components/leads/LeadsKanbanBoard.tsx`** — Add `leads_healthcare` to the select query FK mapping and search fields (search by `condition`, `department`)

4. **`src/pages/FormBuilder.tsx`** — Import `HEALTHCARE_LEAD_COLUMNS` and add the healthcare branch for form field mapping

5. **`src/industries/healthcare/index.ts`** — Export all new components and hooks

---

## 4. Implementation Order

1. Migration: Create `leads_healthcare` table + RLS
2. Hook: `useHealthcareLeads.ts`
3. Components: Table, Add/Edit/Details/Upload/Assign dialogs
4. Page: `HealthcareAllLeads.tsx`
5. Routing: Update `AllLeads.tsx`, `useLeadsTable.ts`, `LeadsKanbanBoard.tsx`, `FormBuilder.tsx`
6. Exports: Update `healthcare/index.ts`

Total: ~8 new files, ~5 edited files, 1 migration.

