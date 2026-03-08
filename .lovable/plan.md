

# Email Integration — Outlook OAuth + Alias Management + Email Dashboard

## Overview

Build a full organizational email system: Admin connects Outlook via Microsoft Graph API OAuth, activates email for the org, team members get real Microsoft 365 aliases, and everyone accesses their email through an in-app Email Dashboard.

---

## 1. Database Schema (1 migration)

### `email_integrations` table (company-level Outlook connection)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK companies | unique |
| provider | text | 'outlook' |
| access_token | text | Encrypted OAuth token |
| refresh_token | text | For token refresh |
| token_expires_at | timestamptz | Expiry |
| admin_email | text | Connected admin email |
| is_active | boolean DEFAULT false | Admin toggle for org |
| email_dashboard_enabled | boolean DEFAULT false | Activates Email Dashboard nav item |
| created_at / updated_at | timestamptz | |

### `email_aliases` table (per-user aliases)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK companies | |
| user_id | uuid FK profiles | |
| alias_email | text | The alias address |
| display_name | text | From name |
| is_active | boolean DEFAULT true | |
| created_at | timestamptz | |

RLS: Company isolation, users can read own alias, admins can manage all.

---

## 2. Edge Functions (3 new)

### `outlook-oauth` — Handles OAuth flow
- **GET** with `?action=authorize`: Returns Microsoft OAuth URL (redirect to Microsoft login)
- **GET** with `?action=callback&code=...`: Exchanges auth code for tokens, stores in `email_integrations`
- Uses `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` secrets
- Scopes: `Mail.Read Mail.Send Mail.ReadWrite User.Read User.ReadWrite.All offline_access`

### `manage-email-aliases` — CRUD for aliases
- **POST**: Admin creates alias for a user via Microsoft Graph API (`POST /users/{userId}/mailboxSettings` or distribution approach)
- **DELETE**: Remove alias
- **GET**: List aliases for company
- Validates admin role server-side

### `email-proxy` — Read/send emails through aliases
- **GET**: Fetch inbox for a user's alias (Graph API `messages` endpoint filtered by alias)
- **POST**: Send email from alias (Graph API `sendMail` with `from` set to alias)
- Refreshes tokens automatically when expired

---

## 3. Frontend Components

### `EmailIntegrationDialog.tsx` (replaces current Gmail card behavior)
- Shows 2 options: Gmail (coming soon) and Outlook (Connect button)
- Outlook: Initiates OAuth by calling `outlook-oauth?action=authorize`
- After connection: Shows connected status, toggle to enable Email Dashboard for org

### `EmailDashboard.tsx` — New page at `/dashboard/email`
- Inbox view showing emails for the logged-in user's alias
- Compose/Reply functionality
- Simple email list with sender, subject, date, preview
- Read/unread status

### `ManageEmailAliases.tsx` — Admin page at `/dashboard/email-settings`
- List all team members
- Create alias for each member (input: desired alias prefix + domain from connected account)
- Toggle aliases on/off
- Only visible to company admins

---

## 4. Routing & Navigation Updates

- **`App.tsx`**: Add routes `/dashboard/email` and `/dashboard/email-settings`
- **`AppLayout.tsx`**: Add "Email" nav item (visible only when `email_dashboard_enabled` is true for the company), "Email Settings" (admin only, visible when Outlook connected)
- **`Integrations.tsx`**: Make Gmail/Outlook card open `EmailIntegrationDialog` instead of the generic API key dialog

---

## 5. Secrets Required

Two secrets must be added to Supabase before the OAuth flow works:
- `MICROSOFT_CLIENT_ID` — From Azure AD app registration
- `MICROSOFT_CLIENT_SECRET` — From Azure AD app registration

The user needs to create an Azure AD app at https://portal.azure.com with:
- Redirect URI: `https://uykdyqdeyilpulaqlqip.supabase.co/functions/v1/outlook-oauth?action=callback`
- API permissions: `Mail.Read`, `Mail.Send`, `Mail.ReadWrite`, `User.Read`, `User.ReadWrite.All`, `offline_access`

---

## 6. Implementation Order

1. Migration: Create `email_integrations` + `email_aliases` tables with RLS
2. Secrets: Request `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`
3. Edge function: `outlook-oauth` (OAuth authorize + callback)
4. Edge function: `manage-email-aliases` (CRUD)
5. Edge function: `email-proxy` (read/send)
6. UI: `EmailIntegrationDialog` (Gmail/Outlook chooser + OAuth trigger)
7. UI: `EmailDashboard` (inbox + compose)
8. UI: `ManageEmailAliases` (admin alias management)
9. Routing: Update `App.tsx`, `AppLayout.tsx`, `Integrations.tsx`

Total: ~3 edge functions, ~3 new pages/components, 1 migration, ~3 edited files.

