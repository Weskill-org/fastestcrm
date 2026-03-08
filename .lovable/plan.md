

# SaaS B2B Industry — Full CRM Configuration Plan

## Overview

Build a fully personalized CRM experience for SaaS B2B companies, mirroring the depth of the Real Estate implementation. This includes a dedicated database table (`leads_saas`), specialized UI components, and SaaS-specific features like deal pipeline tracking, license/seat-based pricing, demo management, and subscription lifecycle tracking.

---

## 1. Database: `leads_saas` Table

A new table with SaaS B2B-specific columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | Contact person name |
| `email` | text | Work email |
| `phone` | text | |
| `whatsapp` | text | |
| `company_name` | text | Prospect company |
| `company_size` | text | 1-10, 11-50, etc. |
| `company_website` | text | |
| `job_title` | text | Decision maker title |
| `product_interest` | text | Which product they're interested in |
| `use_case` | text | Description of need |
| `current_solution` | text | Competitor they use |
| `demo_date` | timestamptz | Scheduled demo |
| `trial_start_date` | date | |
| `trial_end_date` | date | |
| `plan_type` | text | Free/Starter/Pro/Enterprise |
| `seats` | integer | Number of licenses |
| `monthly_value` | numeric DEFAULT 0 | MRR |
| `annual_value` | numeric DEFAULT 0 | ARR |
| `contract_length` | integer | Months |
| `deal_stage` | text | Discovery/Evaluation/POC/Negotiation/Closed |
| `decision_maker` | text | Name of decision maker |
| `champion` | text | Internal champion |
| `competitors` | text | Competing vendors |
| `loss_reason` | text | Why deal was lost |
| `status` | text NOT NULL DEFAULT 'new' | |
| `notes` | text | |
| `lead_source` | text | |
| `lead_history` | jsonb DEFAULT '[]' | |
| `status_metadata` | jsonb DEFAULT '{}' | |
| `lead_profile` | jsonb DEFAULT '{}' | |
| Standard CRM columns | — | `company_id`, `created_by_id`, `pre_sales_owner_id`, `sales_owner_id`, `post_sales_owner_id`, `revenue_projected`, `revenue_received`, `reminder_at`, `last_notification_sent_at`, `payment_link`, `utm_source/medium/campaign`, `lg_link_id`, `form_id`, `created_at`, `updated_at` |

**RLS Policies**: Same pattern as `leads_real_estate` — company isolation via `is_same_company()`, visibility via owner IDs + `is_in_hierarchy()`, delete restricted to company admins.

---

## 2. Frontend Components (following Real Estate pattern)

### Files to create under `src/industries/saas/`:

| File | Purpose |
|---|---|
| `SaaSAllLeads.tsx` | Main leads page with table/kanban toggle, filters for company size, plan type, deal stage |
| `hooks/useSaaSLeads.ts` | Data hook querying `leads_saas` with SaaS-specific filters |
| `components/SaaSLeadsTable.tsx` | Table with columns: Contact, Company, Product Interest, Plan, Seats, MRR, ARR, Demo Date, Status, Owners |
| `components/SaaSAddLeadDialog.tsx` | Add form with company details, product interest, plan type, seats |
| `components/SaaSEditLeadDialog.tsx` | Edit form with all SaaS fields |
| `components/SaaSLeadDetailsDialog.tsx` | Detail view organized in sections: Contact Info, Company Info, Deal Info, Subscription Info, Timeline |
| `components/SaaSAssignLeadsDialog.tsx` | Bulk assign (mirrors real estate pattern) |
| `components/SaaSUploadLeadsDialog.tsx` | CSV upload with SaaS column mapping |

### Update `src/industries/saas/config.ts`:
- Add `DEAL_STAGES` array (Discovery, Qualification, Demo, POC, Proposal, Negotiation, Closed Won, Closed Lost)
- Add `LOSS_REASONS` array

### Update `src/industries/saas/index.ts`:
- Export all new components and hooks

---

## 3. Routing & Navigation Updates

**`src/pages/AllLeads.tsx`**: Add SaaS industry check:
```text
if (company?.industry === 'saas') return <SaaSAllLeads />;
if (company?.industry === 'real_estate') return <RealEstateAllLeads />;
return <GenericAllLeads />;
```

**`src/hooks/useLeadsTable.ts`**: Add SaaS mapping:
```text
if (!company?.custom_leads_table && company?.industry === 'saas') {
    tableName = 'leads_saas';
}
```

**`src/components/layout/AppLayout.tsx`**: Add SaaS-specific nav items (e.g., "Deal Pipeline" or "Products" with `industryOnly: 'saas'` if needed).

**`src/components/leads/LeadsKanbanBoard.tsx`**: Add `leads_saas` table handling for search fields (use `company_name` instead of `college`/`property_name`).

---

## 4. SaaS-Specific UX Decisions

- **Kanban columns** use company's custom statuses (same as other industries), but default SaaS statuses include: New → MQL → SQL → Demo Scheduled → Demo Done → Trial Active → Proposal Sent → Negotiation → Closed Won/Lost
- **Filters**: Company Size, Plan Type, Deal Stage (in addition to standard owner/status filters)
- **Table default columns**: Contact Name, Company, Product Interest, Plan Type, Seats, MRR, Status, Sales Owner, Demo Date
- **Lead Details**: Organized sections — Contact & Company, Deal Intelligence (current solution, competitors, champion), Subscription (plan, seats, MRR/ARR, contract), Timeline

---

## 5. Implementation Order

1. **Migration**: Create `leads_saas` table + RLS policies
2. **Config**: Update `saas/config.ts` with deal stages, loss reasons
3. **Hook**: Create `useSaaSLeads.ts`
4. **Components**: Build table, add/edit/details/upload/assign dialogs
5. **Page**: Build `SaaSAllLeads.tsx` with table + kanban
6. **Routing**: Update `AllLeads.tsx`, `useLeadsTable.ts`, `AppLayout.tsx`, `LeadsKanbanBoard.tsx`
7. **Index**: Update `saas/index.ts` exports

This creates ~8 new files and edits ~5 existing files.

