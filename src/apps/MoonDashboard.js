import React from "react";
import ExternalApp from "../components/ExternalApp";

function MoonDashboard() {
  return (
    <ExternalApp
      src="https://space-dashboard.fcc.lol/moon"
      title="Moon Dashboard"
      errorMessage="Failed to load Moon Dashboard"
    />
  );
}

export default MoonDashboard;
