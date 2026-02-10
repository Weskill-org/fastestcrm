## 2024-05-22 - [Data Fetching Waterfall]
**Learning:** Found sequential Supabase queries in `GenericAllLeads` `queryFn`. This delays the UI rendering unnecessarily.
**Action:** Use `Promise.all` for independent queries to improve parallelism.
