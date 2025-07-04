import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

const EarthImageContainer = styled.div`
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
`;

const EarthImage = styled.img`
  width: 80%;
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

const DateDisplay = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
  font-family: "Courier New", Courier, monospace;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 107, 107, 0.3);
  z-index: 1;
`;

function WholeEarthSatelliteImage() {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get NASA API key from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const NASA_API_KEY = urlParams.get("nasaApiKey");

  const fetchEarthImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.nasa.gov/EPIC/api/natural/images?api_key=${NASA_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error("No images available");
      }

      // Add the full image URLs to each image object
      const imagesWithUrls = data.map((img) => {
        // Parse date from the image date string (e.g., "2025-07-02 00:13:03")
        const date = new Date(img.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return {
          ...img,
          imageUrl: `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${img.image}.png?api_key=${NASA_API_KEY}`
        };
      });

      setImages(imagesWithUrls);
      setCurrentImageIndex(0);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }, [NASA_API_KEY]);

  useEffect(() => {
    fetchEarthImages();
  }, [fetchEarthImages]);

  const currentImage = images[currentImageIndex];

  return (
    <EarthImageContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <>Loading...</>
      ) : currentImage ? (
        <EarthImage src={currentImage.imageUrl} alt="Earth from space" />
      ) : (
        <>Loading...</>
      )}

      {currentImage && (
        <InfoPanel>
          <DateDisplay>
            {new Date(currentImage.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </DateDisplay>
        </InfoPanel>
      )}
    </EarthImageContainer>
  );
}

export default WholeEarthSatelliteImage;
