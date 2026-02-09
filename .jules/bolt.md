# Bolt's Journal

## 2025-02-18 - Code Splitting
**Learning:** Found a React application (`App.tsx`) eagerly importing 30+ page components, causing a bloated initial bundle.
**Action:** Always check `App.tsx` for static imports of route components. Implementing `React.lazy` and `Suspense` is a high-impact, low-risk optimization that significantly improves Time to Interactive (TTI) and First Contentful Paint (FCP).
