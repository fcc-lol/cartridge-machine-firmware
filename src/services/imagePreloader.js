import { API_BASE_URL } from "../config/api";

// Global image cache that persists across component unmounts/remounts
const imageCache = new Map();
const MAX_CACHE_SIZE = 50; // Limit cache to prevent memory issues

// Function to manage cache size
const manageCacheSize = () => {
  if (imageCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (first 10 entries)
    const entriesToRemove = Array.from(imageCache.keys()).slice(0, 10);
    entriesToRemove.forEach((key) => imageCache.delete(key));
  }
};

// Function to preload a single image
const preloadSingleImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    // Check if image is already cached
    if (imageCache.has(imageUrl)) {
      console.log(`Image already cached: ${imageUrl.split("/").pop()}`);
      resolve();
      return;
    }

    console.log(`Loading image: ${imageUrl.split("/").pop()}`);
    const image = new Image();
    image.onload = () => {
      // Cache the loaded image
      imageCache.set(imageUrl, image);
      manageCacheSize(); // Manage cache size after adding new image
      console.log(`✓ Loaded image: ${imageUrl.split("/").pop()}`);
      resolve();
    };
    image.onerror = () => {
      console.error(`✗ Failed to load image: ${imageUrl.split("/").pop()}`);
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    image.src = imageUrl;
  });
};

// Main function to preload satellite images
export const preloadSatelliteImages = async (fccApiKey) => {
  if (!fccApiKey) {
    console.log("No FCC API key provided, skipping satellite image preload");
    return;
  }

  try {
    console.log("Starting satellite image preload...");

    // Fetch the list of available images
    const response = await fetch(
      `${API_BASE_URL}/WholeEarthSatelliteImage?fccApiKey=${fccApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      console.log("No satellite images available for preloading");
      return;
    }

    // Create image URLs for the first 25 images (to avoid overwhelming the system)
    const imagesToPreload = data.slice(0, 25).map((imageId) => ({
      id: imageId,
      imageUrl: `${API_BASE_URL}/WholeEarthSatelliteImage/image/${imageId}.png?fccApiKey=${fccApiKey}`
    }));

    console.log(`Preloading ${imagesToPreload.length} satellite images...`);

    // Preload images in parallel with a concurrency limit
    const concurrencyLimit = 3; // Load 3 images at a time
    const chunks = [];

    for (let i = 0; i < imagesToPreload.length; i += concurrencyLimit) {
      chunks.push(imagesToPreload.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map((img) => preloadSingleImage(img.imageUrl)));
    }

    console.log(
      `Successfully preloaded ${imagesToPreload.length} satellite images`
    );
  } catch (error) {
    console.error("Error preloading satellite images:", error);
  }
};

// Export the cache for use in components
export { imageCache };
