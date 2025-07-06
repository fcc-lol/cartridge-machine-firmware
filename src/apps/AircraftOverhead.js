import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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
      filter: brightness(5) contrast(5) invert(1);
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

// Custom component to render airplane info boxes
const AircraftInfoOverlay = ({ aircraft, formatAltitude, formatSpeed }) => {
  const map = useMap();
  const [positions, setPositions] = useState({});

  useEffect(() => {
    const updatePositions = () => {
      const newPositions = {};
      aircraft.forEach((plane, index) => {
        if (plane.lat && plane.lon) {
          const point = map.latLngToContainerPoint([plane.lat, plane.lon]);
          newPositions[plane.hex || index] = point;
        }
      });
      setPositions(newPositions);
    };

    updatePositions();

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
        const key = plane.hex || index;
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
            {plane.flight && <InfoLine>{plane.flight.trim()}</InfoLine>}
            {plane.t && <InfoLine>{plane.t}</InfoLine>}
            {plane.alt_baro && (
              <InfoLine>{formatAltitude(plane.alt_baro)}</InfoLine>
            )}
            {plane.gs && <InfoLine>{formatSpeed(plane.gs)}</InfoLine>}
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
      setAircraft(data.ac || []);
      if (data.location) {
        setLocation([data.location.lat, data.location.lng]);
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

  if (loading && !location) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  // If we don't have location data yet, show loading
  if (!location) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  // Get aircraft with coordinates for map markers, excluding ground aircraft
  const aircraftWithCoords = aircraft.filter(
    (plane) =>
      plane.lat &&
      plane.lon &&
      plane.alt_baro !== "ground" &&
      plane.alt_baro > 0
  );

  return (
    <Container>
      <MapWrapper>
        <MapContainer
          center={location}
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
            opacity={0.15}
          />
          {aircraftWithCoords.map((plane, index) => (
            <Marker
              key={plane.hex || index}
              position={[plane.lat, plane.lon]}
              icon={createAircraftIcon(plane.track || 0)}
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
