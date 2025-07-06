import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";

const WeatherContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
`;

const WeatherImage = styled.img`
  height: 100%;
  object-fit: contain;
`;

const InfoPanel = styled.div`
  position: absolute;
  top: 2rem;
  left: 2rem;
  width: calc(100% - 6rem);
  color: white;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const RefreshInfo = styled.div`
  font-size: 0.75rem;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
`;

function USWeatherMap() {
  const [imageUrl, setImageUrl] = useState("");
  const [, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

  const getWeatherImageUrl = useCallback(() => {
    const timestamp = Date.now();
    return `https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?${timestamp}`;
  }, []);

  const refreshImage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newUrl = getWeatherImageUrl();
      setImageUrl(newUrl);
      setLastRefresh(new Date());

      // Calculate next refresh time
      const next = new Date(Date.now() + REFRESH_INTERVAL);
      setNextRefresh(next);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }, [getWeatherImageUrl, REFRESH_INTERVAL]);

  // Initial load
  useEffect(() => {
    refreshImage();
  }, [refreshImage]);

  // Set up automatic refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshImage();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshImage, REFRESH_INTERVAL]);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNextRefresh = (date) => {
    if (!date) return "";
    const diff = Math.max(0, Math.floor((date - currentTime) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <WeatherContainer>
      {error && <Error message={error} />}

      {loading ? (
        <Loading />
      ) : imageUrl ? (
        <WeatherImage
          src={imageUrl}
          alt="NOAA Weather Map"
          onError={() => setError("Failed to load weather image")}
        />
      ) : (
        <Loading />
      )}

      <InfoPanel>
        <RefreshInfo>{formatNextRefresh(nextRefresh)}</RefreshInfo>
      </InfoPanel>
    </WeatherContainer>
  );
}

export default USWeatherMap;
