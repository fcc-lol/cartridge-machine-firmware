import React from "react";
import ExternalApp from "../components/ExternalApp";

function SunDashboard() {
  return (
    <ExternalApp
      src="https://space-dashboard.fcc.lol/sun"
      title="Sun Dashboard"
      errorMessage="Failed to load Sun Dashboard"
    />
  );
}

export default SunDashboard;
