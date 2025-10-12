import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL } from "../config/api";
import { Loading } from "../components/Loading";
import { faSatellite } from "@fortawesome/free-solid-svg-icons";
import AppContainer from "../components/AppContainer";

// Color scheme
const SATELLITE_COLOR = "rgb(255, 255, 255)";
const SATELLITE_COLOR_SHADOW = "rgb(0, 0, 0)";

// Feature flags
const SHOW_RADIUS_CIRCLE = false; // Set to false to hide the radius circle

// Custom satellite icon function using Font Awesome satellite icon
const createSatelliteIcon = () => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${faSatellite.icon[0]} ${faSatellite.icon[1]}" width="24" height="24">
      <path fill="${SATELLITE_COLOR}" d="${faSatellite.icon[4]}"/>
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const MapWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;

  .leaflet-container {
    height: 100%;
    width: 100%;
    background: black;

    .leaflet-tile {
      filter: brightness(5) contrast(10) invert(1);
    }

    .leaflet-interactive {
      cursor: default;
    }
  }
`;

const InfoBox = styled.div`
  position: absolute;
  font-size: 0.75rem;
  font-weight: 500;
  pointer-events: none;
  z-index: 1000;
  min-width: 100px;
  line-height: 1;
  color: ${SATELLITE_COLOR};
  font-family: monospace;
  text-transform: uppercase;
  text-shadow: 0 0.5rem 2rem ${SATELLITE_COLOR_SHADOW};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`;

const InfoLine = styled.div`
  margin-bottom: 0.25rem;

  &:first-child {
    font-weight: bold;
    font-size: 0.875rem;
    margin-bottom: 0.375rem;
  }
`;

// Custom component to render the radius circle
const RangeCircle = ({ center, radius }) => {
  if (!SHOW_RADIUS_CIRCLE || !center || radius == null) return null;

  // Convert radius to number if it's a string
  const radiusNum = typeof radius === "string" ? parseFloat(radius) : radius;

  // Validate that we have a valid positive number
  if (isNaN(radiusNum) || radiusNum <= 0) return null;

  // Convert kilometers to meters
  const radiusInMeters = radiusNum * 1000;

  return (
    <Circle
      center={center}
      radius={radiusInMeters}
      pathOptions={{
        color: SATELLITE_COLOR,
        fillColor: SATELLITE_COLOR,
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.5
      }}
    />
  );
};

// Custom component to render satellite info boxes
const SatelliteInfoOverlay = ({
  satellites,
  formatAltitude,
  formatLaunchDate
}) => {
  const map = useMap();
  const [positions, setPositions] = useState({});

  useEffect(() => {
    const updatePositions = () => {
      // Check if map is loaded and ready
      if (!map || !map.getSize || !map.getSize().x) {
        return;
      }

      const newPositions = {};
      satellites.forEach((satellite, index) => {
        if (satellite.satlat && satellite.satlng) {
          try {
            const point = map.latLngToContainerPoint([
              satellite.satlat,
              satellite.satlng
            ]);
            newPositions[satellite.satid || index] = point;
          } catch (error) {
            // Map might not be ready yet, skip this update
            console.warn("Map not ready for position calculation:", error);
          }
        }
      });
      setPositions(newPositions);
    };

    // Wait for map to be ready before calculating positions
    const checkMapReady = () => {
      if (map && map.getSize && map.getSize().x > 0) {
        updatePositions();
      } else {
        setTimeout(checkMapReady, 100);
      }
    };

    checkMapReady();

    const handleMapEvents = () => {
      updatePositions();
    };

    map.on("zoom", handleMapEvents);
    map.on("move", handleMapEvents);
    map.on("resize", handleMapEvents);

    return () => {
      map.off("zoom", handleMapEvents);
      map.off("move", handleMapEvents);
      map.off("resize", handleMapEvents);
    };
  }, [map, satellites]);

  return (
    <>
      {satellites.map((satellite, index) => {
        const key = satellite.satid || index;
        const position = positions[key];

        if (!position) return null;

        return (
          <InfoBox
            key={key}
            style={{
              left: position.x + 20,
              top: position.y - 7
            }}
          >
            {satellite.satname && <InfoLine>{satellite.satname}</InfoLine>}
            {satellite.satalt && (
              <InfoLine>{formatAltitude(satellite.satalt)}</InfoLine>
            )}
            {satellite.launchDate && (
              <InfoLine>{formatLaunchDate(satellite.launchDate)}</InfoLine>
            )}
          </InfoBox>
        );
      })}
    </>
  );
};

const SatellitesOverhead = ({ fccApiKey }) => {
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(null);

  const fetchSatellites = useCallback(async () => {
    try {
      if (!fccApiKey) {
        console.error("Missing fccApiKey parameter");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/SatellitesOverhead/?fccApiKey=${fccApiKey}`
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch satellite data:",
          response.status,
          response.statusText
        );
        return;
      }

      const data = await response.json();
      setSatellites(data.satellites?.above || []);
      if (data.metadata && data.metadata.location) {
        setLocation([data.metadata.location.lat, data.metadata.location.lng]);
      }
      if (data.metadata && data.metadata.radius && data.metadata.radius.value) {
        setRadius(data.metadata.radius.value);
      }
    } catch (err) {
      console.error("Error fetching satellite data:", err);
    } finally {
      setLoading(false);
    }
  }, [fccApiKey]);

  useEffect(() => {
    fetchSatellites();
    const interval = setInterval(fetchSatellites, 10000); // Update every 10 seconds (satellites move slower than aircraft)
    return () => clearInterval(interval);
  }, [fetchSatellites]);

  const formatAltitude = (altitude) => {
    if (typeof altitude === "number") {
      if (altitude < 0) return null;
      return `${Math.round(altitude).toLocaleString()} km`;
    }
    return "Unknown";
  };

  const formatLaunchDate = (launchDate) => {
    if (typeof launchDate === "string") {
      const date = new Date(launchDate);
      return date.getFullYear().toString();
    }
    return "Unknown";
  };

  if (loading) {
    return (
      <AppContainer center>
        <Loading />
      </AppContainer>
    );
  }

  // If we don't have location data yet, use a default location
  const defaultLocation = location || [40.7128, -74.006]; // Default to NYC coordinates

  // Get satellites with coordinates for map markers
  const satellitesWithCoords = satellites.filter(
    (satellite) => satellite.satlat && satellite.satlng
  );

  return (
    <AppContainer>
      <MapWrapper>
        <MapContainer
          center={defaultLocation}
          zoom={8}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            opacity={0.1}
          />
          <RangeCircle center={defaultLocation} radius={radius} />
          {satellitesWithCoords.map((satellite, index) => (
            <Marker
              key={satellite.satid || index}
              position={[satellite.satlat, satellite.satlng]}
              icon={createSatelliteIcon()}
            />
          ))}
          <SatelliteInfoOverlay
            satellites={satellitesWithCoords}
            formatAltitude={formatAltitude}
            formatLaunchDate={formatLaunchDate}
          />
        </MapContainer>
      </MapWrapper>
    </AppContainer>
  );
};

export default SatellitesOverhead;
