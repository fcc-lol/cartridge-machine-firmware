import React from "react";
import ExternalApp from "../components/ExternalApp";

function FCCMomentsSlideshow() {
  return (
    <ExternalApp
      src="https://moments.fcc.lol/slideshow"
      title="Moments"
      errorMessage="Failed to load Moments slideshow"
    />
  );
}

export default FCCMomentsSlideshow;
