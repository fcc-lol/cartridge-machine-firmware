import React, { useState, useEffect } from "react";
import styled from "styled-components";
import CARTRIDGES from "./config/cartridges.json";
import { Instructions } from "./components/Instructions";
import {
  preloadSatelliteImages,
  setProgressCallback
} from "./services/imagePreloader";

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
    const cartridge = CARTRIDGES[cartridgeId];
    if (cartridge.action === "open_app" && APPS[cartridge.app]) {
      acc[cartridgeId] = APPS[cartridge.app];
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

const DebugSection = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  font-family: monospace;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  border: 2px solid #333;
  overflow-y: auto;
`;

const DebugLine = styled.div`
  margin: 0.25rem 0;
  color: #fff;
`;

const DebugTitle = styled.div`
  color: #fff;
  font-weight: bold;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #444;
  padding-bottom: 0.5rem;
`;

const LoadingList = styled.div`
  color: #ffa500;
  margin: 0.5rem 0;
`;

const SuccessList = styled.div`
  color: #90ee90;
  margin: 0.5rem 0;
`;

const ErrorList = styled.div`
  color: #ff6b6b;
  margin: 0.5rem 0;
`;

const MainContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

function App() {
  const [currentInput, setCurrentInput] = useState("");
  const [activeApp, setActiveApp] = useState(null);
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [imageLoadingProgress, setImageLoadingProgress] = useState({
    loaded: 0,
    total: 0,
    isLoading: false,
    events: []
  });

  // Hardcoded variable to control DebugSection visibility
  const SHOW_DEBUG_SECTION = false;

  // Function to get URL parameters
  const getUrlParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  // Check for URL parameters and hash on component mount and handle URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const appParam = getUrlParam("app");
      const hashApp = window.location.hash.replace("#", "");

      if (appParam && APPS[appParam]) {
        setActiveApp(`url_${appParam}`);
      } else if (hashApp && APPS[hashApp]) {
        setActiveApp(`url_${hashApp}`);
      } else {
        // If no valid app param or hash, reset to default state
        setActiveApp(null);
      }
    };

    // Check initial URL
    handleUrlChange();

    // Listen for browser back/forward navigation
    window.addEventListener("popstate", handleUrlChange);

    // Listen for hash changes
    window.addEventListener("hashchange", handleUrlChange);

    // Ensure the window has focus for immediate keyboard input
    window.focus();

    // Cleanup listeners
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
    };
  }, []);

  // Set up progress callback and preload satellite images when app starts
  useEffect(() => {
    // Set up progress callback
    setProgressCallback((progress) => {
      setImageLoadingProgress(progress);
    });

    const fccApiKey = getUrlParam("fccApiKey");
    if (fccApiKey) {
      // Start preloading in the background
      preloadSatelliteImages(fccApiKey);
    }
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

      // Handle number keys only
      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();

        const key = event.key;
        const newInput = currentInput + key;
        setCurrentInput(newInput);

        // Check if the input matches any cartridge ID
        if (CARTRIDGES[newInput]) {
          const cartridge = CARTRIDGES[newInput];

          // Handle different action types
          if (cartridge.action === "refresh") {
            window.location.reload();
            return;
          } else if (cartridge.action === "open_app") {
            setActiveApp(newInput);
            setCurrentInput(""); // Clear input after successful match
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
      <MainContent>
        <Instructions>Insert a cartridge</Instructions>
      </MainContent>
      {SHOW_DEBUG_SECTION && (
        <DebugSection>
          <DebugTitle>Image Preloader Debug</DebugTitle>

          <DebugLine>
            Progress: {imageLoadingProgress.loaded} /{" "}
            {imageLoadingProgress.total} loaded
            {imageLoadingProgress.isLoading && " (loading...)"}
            {!imageLoadingProgress.isLoading &&
              imageLoadingProgress.total > 0 &&
              " (complete)"}
          </DebugLine>

          {(imageLoadingProgress.events || []).map((event, index) => (
            <DebugLine key={index}>
              {event.status === "loading" && (
                <LoadingList>🔄 Loading {event.message}</LoadingList>
              )}
              {event.status === "success" && (
                <SuccessList>✅ Loaded {event.message}</SuccessList>
              )}
              {event.status === "error" && (
                <ErrorList>❌ Failed to load {event.message}</ErrorList>
              )}
            </DebugLine>
          ))}
        </DebugSection>
      )}
    </AppContainer>
  );
}

export default App;
