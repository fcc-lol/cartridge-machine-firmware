import React from "react";
import ExternalApp from "../components/ExternalApp";

function HeadlinesBusStyle() {
  return (
    <ExternalApp
      src="https://headlines.leo.gd/nyc/mta/bus?scale=0.7"
      title="Headlines Bus Style"
      errorMessage="Failed to load Headlines Bus Style"
    />
  );
}

export default HeadlinesBusStyle;
