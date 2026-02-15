## 2025-05-15 - Route-Based Code Splitting
**Learning:** Implemented route-based code splitting using `React.lazy` and `Suspense` in `App.tsx`. This significantly reduced the initial bundle size by splitting page components into separate chunks. The build process (Vite) handled the chunk generation automatically once `lazy` imports were used.
**Action:** Always consider lazy loading for route components in large SPAs to improve initial load time. Ensure a loading fallback (like `LoadingSpinner`) is provided to handle the suspense state.
