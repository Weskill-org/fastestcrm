## 2025-05-22 - Frontend Bundle Optimization
**Learning:** `src/App.tsx` imported all pages statically, causing a large initial bundle size. Lazy loading dashboard routes significantly improves initial load time.
**Action:** Always check `App.tsx` for static imports of large route components and implement code splitting using `React.lazy` and `Suspense` for non-critical paths.

## 2025-05-22 - Environment Limitations
**Learning:** The development environment has broken `node_modules` linkage, causing `pnpm lint`, `npm run build`, and `vite` to fail.
**Action:** Rely on manual code verification and reading files when standard lint/build/test commands fail due to environment issues.
