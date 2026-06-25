import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    document.body.innerHTML = '<div style="color: red; padding: 20px;">❌ Root element not found</div>';
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(<App />);

} catch (error) {
  document.body.innerHTML = `
    <div style="padding: 20px; background: #ff4444; color: white; font-family: monospace;">
      <h1>❌ App Failed to Start</h1>
      <p>Error: ${error.message}</p>
      <details>
        <summary>Stack Trace</summary>
        <pre>${error.stack}</pre>
      </details>
    </div>
  `;
}