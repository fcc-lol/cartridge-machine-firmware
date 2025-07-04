import React, { useState, useEffect } from "react";
import styled from "styled-components";

const ColorContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: background-color 0.1s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ColorInfo = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: "Arial", sans-serif;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
  opacity: 0.8;
  pointer-events: none;
`;

const ColorCycle = () => {
  const [hue, setHue] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHue((prevHue) => (prevHue + 1) % 360);
    }, 50); // Change color every 50ms for smooth animation

    return () => clearInterval(interval);
  }, []);

  // Toggle info display when clicked
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  // Convert HSL to RGB for display
  const hslToRgb = (h, s, l) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r, g, b;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  const rgb = hslToRgb(hue, 1, 0.5);
  const backgroundColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <ColorContainer style={{ backgroundColor }} onClick={toggleInfo}>
      {showInfo && (
        <ColorInfo>
          <div>Hue: {hue}°</div>
          <div>
            RGB: {rgb.r}, {rgb.g}, {rgb.b}
          </div>
          <div>HSL: {hue}, 100%, 50%</div>
          <div style={{ fontSize: "1rem", marginTop: "1rem" }}>
            Click to hide info
          </div>
        </ColorInfo>
      )}
    </ColorContainer>
  );
};

export default ColorCycle;
