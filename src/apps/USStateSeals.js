import React, { useState, useEffect } from "react";
import styled from "styled-components";
import AppContainer from "../components/AppContainer";

const SealImage = styled.img`
  position: absolute;
  width: 60%;
  max-width: 600px;
  height: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 2s ease-in-out;
  object-fit: contain;
`;

const USStateSeals = () => {
  const states = [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fadeInterval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // After fade out, change image and fade back in
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % states.length);
        setIsVisible(true);
      }, 2000); // Match the CSS transition duration
    }, 6000); // Show each seal for 6 seconds total (4s visible + 2s transition)

    return () => clearInterval(fadeInterval);
  }, [states.length]);

  const currentState = states[currentIndex];
  const imageUrl = `https://static.fcc.lol/us-state-seals/png/512/${currentState.code}.png`;

  return (
    <AppContainer center>
      <SealImage
        src={imageUrl}
        alt={`${currentState.name} State Seal`}
        style={{ opacity: isVisible ? 1 : 0 }}
      />
    </AppContainer>
  );
};

export default USStateSeals;
