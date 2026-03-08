

# Travel & Hospitality — Full End-to-End CRM Implementation

## Overview

Travel currently only has `config.ts` and `index.ts`. We need the complete stack: database table, all UI components, hooks, routing, Kanban support, and Form Builder integration — following the same pattern as SaaS/Healthcare/Insurance.

---

## 1. Database: `leads_travel` Table

Migration to create the table with travel-specific columns alongside standard CRM columns:

| Column | Type | Notes |
|---|---|---|
| Standard CRM columns | — | `id`, `name`, `email`, `phone`, `whatsapp`, `company_id`, `created_by_id`, `pre/sales/post_sales_owner_id`, `revenue_projected/received`, `reminder_at`, `last_notification_sent_at`, `payment_link`, `utm_*`, `lg_link_id`, `form_id`, `notes`, `lead_source`, `lead_history`, `status_metadata`, `lead_profile`, `created_at`, `updated_at` |
| `destination` | text | Where they want to go |
| `travel_date` | date | Departure date |
| `return_date` | date | Return date |
| `travelers_count` | integer | Number of travelers |
| `trip_type` | text | Domestic/International/Honeymoon/Family/Corporate/Adventure/Pilgrimage |
| `package_type` | text | Budget/Standard/Premium/Luxury |
| `budget` | numeric | Customer budget |
| `special_requests` | text | Special requirements |
| `hotel_name` | text | Hotel booked |
| `flight_details` | text | Flight info |
| `package_cost` | numeric | Total package cost |
| `advance_paid` | numeric | Advance received |
| `balance_due` | numeric | Remaining balance |
| `booking_id` | text | Internal booking reference |
| `status` | text NOT NULL DEFAULT 'new' | |

RLS: Same pattern as other industries — company isolation, hierarchy-based visibility, admin-only delete.

---

## 2. Frontend Components (`src/industries/travel/`)

Create 8 files mirroring the SaaS/Insurance structure:

| File | Purpose |
|---|---|
| `TravelAllLeads.tsx` | Main page with table/kanban toggle, trip type filter |
| `hooks/useTravelLeads.ts` | Data hook querying `leads_travel` with travel-specific filters |
| `components/TravelLeadsTable.tsx` | Table: Guest Name, Phone, Destination, Travel Date, Trip Type, Package Cost, Advance Paid, Balance, Status, Owner |
| `components/TravelAddLeadDialog.tsx` | Add form: guest details + destination + trip type + budget |
| `components/TravelEditLeadDialog.tsx` | Edit all fields |
| `components/TravelLeadDetailsDialog.tsx` | Sections: Guest Info, Trip Details, Booking Info, Financial, Timeline |
| `components/TravelAssignLeadsDialog.tsx` | Bulk assign |
| `components/TravelUploadLeadsDialog.tsx` | CSV upload with travel column mapping |

---

## 3. Integration Updates (6 existing files)

1. **`src/pages/AllLeads.tsx`** — Add `if (company?.industry === 'travel') return <TravelAllLeads />;`
2. **`src/hooks/useLeadsTable.ts`** — Add travel mapping: `if (industry === 'travel') tableName = 'leads_travel';`
3. **`src/components/leads/LeadsKanbanBoard.tsx`** — Add `leads_travel` FK mapping and search by `destination`, `hotel_name`
4. **`src/pages/FormBuilder.tsx`** — Import `TRAVEL_LEAD_COLUMNS` and add travel branch
5. **`src/industries/travel/index.ts`** — Export all new components and hooks
6. **`src/industries/travel/config.ts`** — Add `PACKAGE_TYPES` array

---

## 4. Implementation Order

1. Migration: Create `leads_travel` table + RLS
2. Config: Update `travel/config.ts` with package types
3. Hook: `useTravelLeads.ts`
4. Components: Table, Add/Edit/Details/Upload/Assign dialogs
5. Page: `TravelAllLeads.tsx`
6. Routing: Update `AllLeads.tsx`, `useLeadsTable.ts`, `LeadsKanbanBoard.tsx`, `FormBuilder.tsx`
7. Exports: Update `travel/index.ts`

Total: ~8 new files, ~6 edited files, 1 migration.

