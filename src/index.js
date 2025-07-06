import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppSwitcher from "./AppSwitcher";

// Check if onDevice=true URL parameter is present
const urlParams = new URLSearchParams(window.location.search);
const onDevice = urlParams.get("onDevice") === "true";

// Conditionally apply cursor: none style
if (onDevice) {
  document.body.style.cursor = "none";
  // Also apply to all elements for consistency
  const style = document.createElement("style");
  style.textContent = `
    * {
      cursor: none !important;
    }
  `;
  document.head.appendChild(style);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppSwitcher />);
