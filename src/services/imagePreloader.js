import { API_BASE_URL } from "../config/api";

// Global image cache that persists across component unmounts/remounts
const imageCache = new Map();
const MAX_CACHE_SIZE = 50; // Limit cache to prevent memory issues

// Global progress tracking with detailed information
let loadingProgress = {
  loaded: 0,
  total: 0,
  isLoading: false,
  events: [] // Array of loading events with status
};

// Callback function for progress updates
let progressCallback = null;

// Function to set progress callback
export const setProgressCallback = (callback) => {
  progressCallback = callback;
};

// Function to update progress
const updateProgress = (updates) => {
  loadingProgress = { ...loadingProgress, ...updates };
  if (progressCallback) {
    progressCallback(loadingProgress);
  }
};

// Function to manage cache size
const manageCacheSize = () => {
  if (imageCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (first 10 entries)
    const entriesToRemove = Array.from(imageCache.keys()).slice(0, 10);
    entriesToRemove.forEach((key) => imageCache.delete(key));
  }
};

// Function to preload a single image with timeout
const preloadSingleImage = (imageUrl, onSuccess, onError, onStartLoading) => {
  return new Promise((resolve, reject) => {
    const imageName = imageUrl.split("/").pop();

    // Check if image is already cached
    if (imageCache.has(imageUrl)) {
      if (onSuccess) onSuccess(imageUrl, imageName, "cached");
      resolve();
      return;
    }

    // Notify that loading is starting
    if (onStartLoading) onStartLoading(imageUrl, imageName);

    const image = new Image();

    // Set up timeout (20 seconds)
    const timeout = setTimeout(() => {
      if (onError) onError(imageUrl, imageName, "timeout");
      reject(new Error(`Timeout loading image: ${imageUrl}`));
    }, 20000);

    // Prevent double resolution/counting
    let hasResolved = false;

    const handleSuccess = () => {
      if (hasResolved) return;
      hasResolved = true;

      if (timeout) clearTimeout(timeout);
      // Cache the loaded image
      imageCache.set(imageUrl, image);
      manageCacheSize(); // Manage cache size after adding new image
      if (onSuccess) onSuccess(imageUrl, imageName, "loaded");
      resolve();
    };

    const handleError = (errorType) => {
      if (hasResolved) return;
      hasResolved = true;

      if (timeout) clearTimeout(timeout);
      if (onError) onError(imageUrl, imageName, errorType);
      reject(new Error(`${errorType} loading image: ${imageUrl}`));
    };

    image.onload = handleSuccess;
    image.onerror = () => handleError("Failed to load image");

    image.src = imageUrl;
  });
};

// Main function to preload satellite images
export const preloadSatelliteImages = async (fccApiKey) => {
  if (!fccApiKey) {
    updateProgress({
      loaded: 0,
      total: 0,
      isLoading: false,
      events: [{ status: "error", message: "No API key provided" }]
    });
    return;
  }

  try {
    // Fetch the list of available images
    const response = await fetch(
      `${API_BASE_URL}/WholeEarthSatelliteImage?fccApiKey=${fccApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      updateProgress({
        loaded: 0,
        total: 0,
        isLoading: false,
        events: [{ status: "error", message: "No images available" }]
      });
      return;
    }

    // Create image URLs for the first 25 images (to avoid overwhelming the system)
    const imagesToPreload = data.slice(0, 25).map((imageId) => ({
      id: imageId,
      imageUrl: `${API_BASE_URL}/WholeEarthSatelliteImage/image/${imageId}.png?fccApiKey=${fccApiKey}`
    }));

    // Initialize progress tracking
    let loadedCount = 0;
    const totalCount = imagesToPreload.length;
    const countedImages = new Set();

    updateProgress({
      loaded: 0,
      total: totalCount,
      isLoading: true,
      events: []
    });

    // Callbacks for image loading events
    const onImageSuccess = (imageUrl, imageName, status) => {
      if (!countedImages.has(imageUrl)) {
        countedImages.add(imageUrl);
        loadedCount++;

        updateProgress({
          loaded: loadedCount,
          events: [
            ...loadingProgress.events,
            {
              status: "success",
              message: `${imageName.split("?")[0]} (${status})`
            }
          ]
        });
      }
    };

    const onImageError = (imageUrl, imageName, errorType) => {
      updateProgress({
        events: [
          ...loadingProgress.events,
          {
            status: "error",
            message: `${imageName.split("?")[0]} (${errorType})`
          }
        ]
      });
    };

    const onStartLoading = (imageUrl, imageName) => {
      updateProgress({
        events: [
          ...loadingProgress.events,
          { status: "loading", message: imageName.split("?")[0] }
        ]
      });
    };

    // Load images in series - one at a time for better server behavior
    for (let i = 0; i < imagesToPreload.length; i++) {
      const img = imagesToPreload[i];
      try {
        await preloadSingleImage(
          img.imageUrl,
          onImageSuccess,
          onImageError,
          onStartLoading
        );
      } catch (error) {
        // Individual image errors are already handled by onImageError callback
        // Continue loading the next image
      }
    }

    updateProgress({
      isLoading: false
    });
  } catch (error) {
    updateProgress({
      loaded: 0,
      total: 0,
      isLoading: false,
      events: [{ status: "error", message: "Error: " + error.message }]
    });
  }
};

// Export the cache and progress tracking for use in components
export { imageCache, loadingProgress };
