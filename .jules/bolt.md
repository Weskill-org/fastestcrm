## 2024-05-22 - LeadsTable Render Optimization
**Learning:** LeadsTable render performance was degraded by inline columnDefinitions object creation and row mapping. Even with React.memo on rows, passing a fresh columnDefinitions object (containing render functions) breaks memoization.
**Action:** Always memoize complex configuration objects passed to memoized child components, especially those containing functions. Extract row components to isolate re-renders.
