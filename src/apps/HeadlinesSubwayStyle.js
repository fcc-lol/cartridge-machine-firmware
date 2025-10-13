import React from "react";
import ExternalApp from "../components/ExternalApp";

function HeadlinesSubwayStyle() {
  return (
    <ExternalApp
      src="https://headlines.leo.gd/nyc/mta/subway/r46?scale=0.6"
      title="Headlines Subway Style"
      errorMessage="Failed to load Headlines Subway Style"
    />
  );
}

export default HeadlinesSubwayStyle;
