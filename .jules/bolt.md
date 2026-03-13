## 2024-05-24 - Frontend Query Optimization
**Learning:** Supabase/PostgREST queries in React hooks should support an optional `select` parameter to fetch only necessary columns. This significantly reduces payload size, especially when fetching large datasets for client-side aggregation (e.g., dashboard stats).
**Action:** When creating or modifying data fetching hooks (like `useLeads`), always include a `select` option in the query key and function arguments to allow consumers to optimize their data requirements.
