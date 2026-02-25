## 2024-05-24 - Optimized Dashboard Data Fetching
**Learning:** The `useLeads` hook was fetching all columns (`*`) by default, including potentially heavy JSON columns and joins. This caused performance issues on the Dashboard which loads all leads for stats calculation.
**Action:** Added an optional `select` parameter to `useLeads` to allow fetching only necessary columns. Implemented this in `Dashboard.tsx` to reduce payload size. When optimizing data fetching, always check if the hook supports column selection and add it if missing.
