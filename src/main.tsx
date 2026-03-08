import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global safety net for unhandled promise rejections — prevents silent failures
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
