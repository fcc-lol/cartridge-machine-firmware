import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { API_BASE_URL } from "../config/api";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";
import { imageCache } from "../services/imagePreloader";

// Function to manage cache size
const manageCacheSize = () => {
  if (imageCache.size > 50) {
    // MAX_CACHE_SIZE = 50
    // Remove oldest entries (first 10 entries)
    const entriesToRemove = Array.from(imageCache.keys()).slice(0, 10);
    entriesToRemove.forEach((key) => imageCache.delete(key));
  }
};

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
  opacity: ${(props) => (props.loaded ? 1 : 0)};
  transition: opacity 0.5s ease-in-out;
`;

const InfoPanel = styled.div`
  position: absolute;
  top: 2rem;
  left: 2rem;
  width: calc(100% - 4rem);
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

const TimeDisplay = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
  font-family: "Courier New", Courier, monospace;
`;

function WholeEarthSatelliteImage({ fccApiKey }) {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0
  });
  const [error, setError] = useState(null);

  // Use the API key from props
  const FCC_API_KEY = fccApiKey;

  const preloadImages = useCallback(async (imageList) => {
    setLoadingProgress({ loaded: 0, total: imageList.length });
    let loadedCount = 0;

    const loadPromises = imageList.map((img) => {
      return new Promise((resolve, reject) => {
        // Check if image is already cached
        if (imageCache.has(img.imageUrl)) {
          loadedCount++;
          setLoadingProgress({ loaded: loadedCount, total: imageList.length });
          resolve();
          return;
        }

        const image = new Image();
        image.crossOrigin = "anonymous"; // Enable CORS for potential future canvas use
        image.onload = () => {
          // Cache the loaded image
          imageCache.set(img.imageUrl, image);
          manageCacheSize(); // Manage cache size after adding new image
          loadedCount++;
          setLoadingProgress({ loaded: loadedCount, total: imageList.length });
          resolve();
        };
        image.onerror = () =>
          reject(new Error(`Failed to load image: ${img.imageUrl}`));
        image.src = img.imageUrl;
      });
    });

    try {
      await Promise.all(loadPromises);
      setImagesLoaded(true);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchEarthImages = useCallback(async () => {
    // First check if we already have cached images for this API key
    const cachedEntries = Array.from(imageCache.keys());
    const relevantCache = cachedEntries.filter((url) =>
      url.includes(`fccApiKey=${FCC_API_KEY}`)
    );

    if (relevantCache.length > 0) {
      // Extract image IDs from cached URLs and reconstruct image objects
      const cachedImages = relevantCache
        .map((url) => {
          const imageIdMatch = url.match(/\/image\/([^.]+)\.png/);
          if (imageIdMatch) {
            const imageId = imageIdMatch[1];

            // Parse date from the image identifier
            const dateMatch = imageId.match(/(\d{8})(\d{6})$/);
            let date = new Date();

            if (dateMatch) {
              const [, dateStr, timeStr] = dateMatch;
              const year = parseInt(dateStr.substring(0, 4));
              const month = parseInt(dateStr.substring(4, 6)) - 1;
              const day = parseInt(dateStr.substring(6, 8));
              const hour = parseInt(timeStr.substring(0, 2));
              const minute = parseInt(timeStr.substring(2, 4));
              const second = parseInt(timeStr.substring(4, 6));

              date = new Date(year, month, day, hour, minute, second);
            }

            return {
              id: imageId,
              date: date.toISOString(),
              imageUrl: url
            };
          }
          return null;
        })
        .filter(Boolean);

      if (cachedImages.length > 0) {
        // Use cached images, skip loading

        setImages(cachedImages);
        setCurrentImageIndex(0);
        setImagesLoaded(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setImagesLoaded(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/WholeEarthSatelliteImage?fccApiKey=${FCC_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error("No images available");
      }

      // Process the image identifiers and create image objects
      const imagesWithUrls = data.map((imageId) => {
        // Parse date from the image identifier (e.g., "epic_1b_20250703000830")
        const dateMatch = imageId.match(/(\d{8})(\d{6})$/);
        let date = new Date();

        if (dateMatch) {
          const [, dateStr, timeStr] = dateMatch;
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1; // months are 0-indexed
          const day = parseInt(dateStr.substring(6, 8));
          const hour = parseInt(timeStr.substring(0, 2));
          const minute = parseInt(timeStr.substring(2, 4));
          const second = parseInt(timeStr.substring(4, 6));

          date = new Date(year, month, day, hour, minute, second);
        }

        return {
          id: imageId,
          date: date.toISOString(),
          imageUrl: `${API_BASE_URL}/WholeEarthSatelliteImage/image/${imageId}.png?fccApiKey=${FCC_API_KEY}`
        };
      });

      setImages(imagesWithUrls);
      setCurrentImageIndex(0);

      // Preload all images
      await preloadImages(imagesWithUrls);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }, [FCC_API_KEY, preloadImages]);

  useEffect(() => {
    fetchEarthImages();
  }, [fetchEarthImages]);

  // Auto-cycle through images every 2 seconds - only start after all images are loaded
  useEffect(() => {
    if (images.length > 1 && imagesLoaded) {
      let interval;

      // Start with a delay to ensure the first image is shown for the full duration
      const timeout = setTimeout(() => {
        interval = setInterval(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 2000); // 2 seconds
      }, 2000); // Wait 2 seconds before starting the cycle

      return () => {
        clearTimeout(timeout);
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [images.length, imagesLoaded]);

  const currentImage = images[currentImageIndex];

  return (
    <>
      {loading && loadingProgress.total > 0 && <Loading />}

      <EarthImageContainer>
        {error && <Error message={error} />}

        {currentImage && (
          <EarthImage
            src={currentImage.imageUrl}
            alt="Earth from space"
            loaded={imagesLoaded}
            onLoad={(e) => {
              // Ensure the image is cached if it wasn't already
              if (!imageCache.has(currentImage.imageUrl)) {
                imageCache.set(currentImage.imageUrl, e.target);
                manageCacheSize(); // Manage cache size after adding new image
              }
            }}
          />
        )}

        {currentImage && imagesLoaded && (
          <InfoPanel>
            <DateDisplay>
              {new Date(currentImage.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </DateDisplay>
            <TimeDisplay>
              {new Date(currentImage.date).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </TimeDisplay>
          </InfoPanel>
        )}
      </EarthImageContainer>
    </>
  );
}

export default WholeEarthSatelliteImage;
