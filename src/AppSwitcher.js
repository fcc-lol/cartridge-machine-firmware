import React, { useState, useEffect } from "react";
import styled from "styled-components";
import CARTRIDGES from "./config/cartridges.json";
import { Instructions } from "./components/Instructions";

// Dynamically import all apps from the Apps directory
const importAll = (r) => {
  let apps = {};
  r.keys().forEach((item, index) => {
    const appName = item.replace("./", "").replace(".js", "");
    apps[appName] = r(item).default;
  });
  return apps;
};

const APPS = importAll(require.context("./apps", false, /\.js$/));

// Build the cartridge-to-app mapping using the config and imported apps
const CARTRIDGE_TO_APP_MAPPING = Object.keys(CARTRIDGES).reduce(
  (acc, cartridgeId) => {
    const appName = CARTRIDGES[cartridgeId].app;
    if (APPS[appName]) {
      acc[cartridgeId] = APPS[appName];
    }
    return acc;
  },
  {}
);

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  position: absolute;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  border-radius: 0;
  background: black;
`;

function App() {
  const [currentInput, setCurrentInput] = useState("");
  const [activeApp, setActiveApp] = useState(null);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Function to get URL parameters
  const getUrlParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  // Check for URL parameters on component mount and handle URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const appParam = getUrlParam("app");

      if (appParam && APPS[appParam]) {
        setActiveApp(`url_${appParam}`);
      } else {
        // If no valid app param, reset to default state
        setActiveApp(null);
      }
    };

    // Check initial URL
    handleUrlChange();

    // Listen for browser back/forward navigation
    window.addEventListener("popstate", handleUrlChange);

    // Ensure the window has focus for immediate keyboard input
    window.focus();

    // Cleanup listener
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event) => {
      const now = Date.now();

      // Reset input if more than 2 seconds since last key
      if (now - lastKeyTime > 2000) {
        setCurrentInput("");
      }

      setLastKeyTime(now);

      // Only handle number keys
      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();

        const newInput = currentInput + event.key;
        setCurrentInput(newInput);

        // Check if the input matches any app ID
        if (CARTRIDGE_TO_APP_MAPPING[newInput]) {
          setActiveApp(newInput);
          setCurrentInput(""); // Clear input after successful match

          // Update URL to reflect the app (find the corresponding URL param)
          const appComponent = CARTRIDGE_TO_APP_MAPPING[newInput];
          const urlParam = Object.keys(APPS).find(
            (key) => APPS[key] === appComponent
          );
          if (urlParam) {
            const newUrl = new URL(window.location);
            newUrl.searchParams.set("app", urlParam);
            window.history.pushState({}, "", newUrl);
          }
        }
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentInput, lastKeyTime, activeApp]);

  useEffect(() => {
    if (currentInput) {
      const timer = setTimeout(() => {
        setCurrentInput("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentInput]);

  // Render the active app
  if (activeApp) {
    let AppComponent = null;
    let appName = "";

    // Check if it's a URL parameter app
    if (activeApp.startsWith("url_")) {
      appName = activeApp.replace("url_", "");
      AppComponent = APPS[appName];
    } else {
      // Check if it's a cartridge ID app
      AppComponent = CARTRIDGE_TO_APP_MAPPING[activeApp];
      // Find the app name from the cartridge mapping
      appName = Object.keys(APPS).find((key) => APPS[key] === AppComponent);
    }

    if (AppComponent) {
      // Get fccApiKey from URL for apps that need it
      const fccApiKey = getUrlParam("fccApiKey");

      // List of apps that need the fccApiKey
      const appsNeedingApiKey = [
        "AircraftOverhead",
        "WholeEarthSatelliteImage"
      ];

      return (
        <AppContainer>
          {appsNeedingApiKey.includes(appName) ? (
            <AppComponent fccApiKey={fccApiKey} />
          ) : (
            <AppComponent />
          )}
        </AppContainer>
      );
    }
  }

  // Render the app selector
  return (
    <AppContainer>
      <Instructions>Insert a cartridge</Instructions>
    </AppContainer>
  );
}

export default App;
