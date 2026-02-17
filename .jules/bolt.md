## 2024-05-23 - Unstable Hook Returns causing Re-renders
**Learning:** Custom hooks returning helper functions (like `getStatusColor`) without `useCallback` cause consumers to re-render unnecessarily, especially when used in large lists (e.g., `LeadsTable`).
**Action:** Always wrap helper functions returned from hooks in `useCallback` and memoize derived data (lookups) with `useMemo` to ensure stable references.
