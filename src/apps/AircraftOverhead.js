import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL } from "../config/api";
import { Loading } from "../components/Loading";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

// Custom airplane icon function that accepts rotation
const createAircraftIcon = (heading = 0) => {
  return new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgb(47, 255, 54)" width="24" height="24">
        <g transform="rotate(${heading} 12 12)">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </g>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
`;

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
  color: rgb(47, 255, 54);
  font-family: monospace;
  text-transform: uppercase;
  text-shadow: 0 0.5rem 2rem rgba(47, 255, 54, 1);
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
  if (!center || radius == null) return null;

  // Convert radius to number if it's a string
  const radiusNum = typeof radius === "string" ? parseFloat(radius) : radius;

  // Validate that we have a valid positive number
  if (isNaN(radiusNum) || radiusNum <= 0) return null;

  // Convert nautical miles to meters (1 nm = 1852 meters)
  const radiusInMeters = radiusNum * 1852;

  return (
    <Circle
      center={center}
      radius={radiusInMeters}
      pathOptions={{
        color: "rgb(47, 255, 54)",
        fillColor: "rgb(47, 255, 54)",
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.5
      }}
    />
  );
};

// Custom component to render airplane info boxes
const AircraftInfoOverlay = ({ aircraft, formatAltitude, formatSpeed }) => {
  const map = useMap();
  const [positions, setPositions] = useState({});

  useEffect(() => {
    const updatePositions = () => {
      // Check if map is loaded and ready
      if (!map || !map.getSize || !map.getSize().x) {
        return;
      }

      const newPositions = {};
      aircraft.forEach((plane, index) => {
        if (plane.lat && plane.lon) {
          try {
            const point = map.latLngToContainerPoint([plane.lat, plane.lon]);
            newPositions[plane.id || index] = point;
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
  }, [map, aircraft]);

  return (
    <>
      {aircraft.map((plane, index) => {
        const key = plane.id || index;
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
            {plane.flight && <InfoLine>{plane.flight}</InfoLine>}
            {plane.type && <InfoLine>{plane.type}</InfoLine>}
            {plane.altitude && (
              <InfoLine>{formatAltitude(plane.altitude)}</InfoLine>
            )}
            {plane.speed && <InfoLine>{formatSpeed(plane.speed)}</InfoLine>}
          </InfoBox>
        );
      })}
    </>
  );
};

const AircraftOverhead = ({ fccApiKey }) => {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(null); // No default value - only show circle when API provides radius

  const fetchAircraft = useCallback(async () => {
    try {
      if (!fccApiKey) {
        console.error("Missing fccApiKey parameter");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/AircraftOverhead/?fccApiKey=${fccApiKey}`
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch aircraft data:",
          response.status,
          response.statusText
        );
        return;
      }

      const data = await response.json();
      setAircraft(data.aircraft || []);
      if (data.metadata && data.metadata.location) {
        setLocation([data.metadata.location.lat, data.metadata.location.lng]);
      }
      if (data.metadata && data.metadata.radius && data.metadata.radius.value) {
        setRadius(data.metadata.radius.value);
      }
    } catch (err) {
      console.error("Error fetching aircraft data:", err);
    } finally {
      setLoading(false);
    }
  }, [fccApiKey]);

  useEffect(() => {
    fetchAircraft();
    const interval = setInterval(fetchAircraft, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [fetchAircraft]);

  const formatAltitude = (altitude) => {
    if (typeof altitude === "number") {
      if (altitude < 0) return null;
      return `${altitude.toLocaleString()} ft`;
    }
    return "Unknown";
  };

  const formatSpeed = (speed) => {
    if (typeof speed === "number") return `${Math.round(speed)} kts`;
    return "Unknown";
  };

  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  // If we don't have location data yet, use a default location
  const defaultLocation = location || [40.7128, -74.006]; // Default to NYC coordinates

  // Get aircraft with coordinates for map markers
  const aircraftWithCoords = aircraft.filter((plane) => plane.lat && plane.lon);

  return (
    <Container>
      <MapWrapper>
        <MapContainer
          center={defaultLocation}
          zoom={11}
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
          {aircraftWithCoords.map((plane, index) => (
            <Marker
              key={plane.id || index}
              position={[plane.lat, plane.lon]}
              icon={createAircraftIcon(plane.heading || 0)}
            />
          ))}
          <AircraftInfoOverlay
            aircraft={aircraftWithCoords}
            formatAltitude={formatAltitude}
            formatSpeed={formatSpeed}
          />
        </MapContainer>
      </MapWrapper>
    </Container>
  );
};

export default AircraftOverhead;
