import React from "react";
import ExternalApp from "../components/ExternalApp";

function CoffeeCompass() {
  return (
    <ExternalApp
      src="https://coffee.nearby.land/?lat=40.725802&lng=-73.979429"
      title="Coffee Compass"
      errorMessage="Failed to load Coffee Compass"
    />
  );
}

export default CoffeeCompass;
