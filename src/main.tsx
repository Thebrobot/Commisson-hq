import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

// Clear any placeholder content so React has a clean slate
root.innerHTML = "";

try {
  createRoot(root).render(<App />);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : "";
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;padding:24px;background:#fef2f2">
      <div style="max-width:512px;background:#fff;border:2px solid #dc2626;border-radius:12px;padding:24px">
        <h1 style="font-size:18px;font-weight:bold;color:#dc2626;margin-bottom:8px">Failed to load app</h1>
        <p style="font-size:14px;color:#1f2937;margin-bottom:12px">${msg}</p>
        ${stack ? `<pre style="font-size:11px;overflow:auto;background:#f3f4f6;padding:16px;border-radius:8px;color:#374151;max-height:200px">${stack}</pre>` : ""}
      </div>
    </div>
  `;
  console.error("App failed to load:", err);
}
