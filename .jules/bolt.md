## 2025-05-22 - Route-based Code Splitting UX

**Learning:** When using `React.lazy` for a layout component (like `AppLayout`) and its child routes, the top-level `Suspense` boundary will be triggered on every route transition within the layout, causing the entire layout (sidebar, header) to disappear and show the fallback spinner. This creates a jarring user experience compared to a persistent layout.

**Action:** In future optimizations, consider keeping the layout component in the main bundle (or shared chunk) and placing `Suspense` boundaries *inside* the layout (wrapping `<Outlet />`) to ensure the layout remains visible while child routes load. This balances initial load performance with navigation UX.
