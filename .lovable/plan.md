

# Performance Optimization: Super Fast Lead Loading

## Problem
Currently, leads are fetched as a single batch (25 per page). The entire table renders only after all data arrives, creating a perceived delay. There's no progressive rendering or caching optimization.

## Strategy: Three-Layer Speed Boost

### 1. Staggered Row Animation (Perceived Speed)
Add a CSS animation where each table row fades/slides in with a slight stagger delay (e.g., 30ms per row). This makes leads appear to load "one-by-one" even though they arrive together. This is the biggest perceived performance win.

**Changes:**
- `LeadsTable.tsx`: Add staggered `animation-delay` per row using inline styles + a fade-in CSS class
- `SaaSLeadsTable.tsx`, `TravelLeadsTable.tsx`, `InsuranceLeadsTable.tsx`, `HealthcareLeadsTable.tsx`, `RealEstateLeadsTable.tsx`: Same staggered animation
- `src/index.css`: Add `@keyframes fadeSlideIn` animation class

### 2. Aggressive React Query Caching & Prefetching
Optimize data fetching so navigating between pages and filters feels instant.

**Changes in all lead hooks (`useLeads.ts`, `useSaaSLeads.ts`, etc.):**
- Increase `staleTime` from 30s to 60s (data stays cached longer)
- Add `gcTime: 5 * 60 * 1000` (keep unused cache for 5 minutes)
- Prefetch next page on hover of pagination button

**Changes in page components (`GenericAllLeads.tsx`, `SaaSAllLeads.tsx`, etc.):**
- Add `queryClient.prefetchQuery` for next page when current page loads
- This means clicking "Next" shows data instantly from cache

### 3. Optimistic Skeleton → Real Data Transition
Instead of showing a loading skeleton that blocks the whole table, show the table structure immediately with skeleton rows that individually resolve to real data as it arrives.

**Changes:**
- `LeadsTable.tsx` and industry variants: When `loading` is true, render skeleton rows with the same staggered animation, then crossfade to real rows

## Implementation Order
1. Add `fadeSlideIn` keyframes to `index.css`
2. Update all 6 LeadsTable components with staggered row animation
3. Update all lead hooks with improved cache settings
4. Add next-page prefetching to all AllLeads page components

## Impact
- Leads appear to load one-by-one (stagger animation) -- instant perceived speed
- Page navigation feels instant (prefetched cache)
- No backend changes needed -- all frontend optimizations

