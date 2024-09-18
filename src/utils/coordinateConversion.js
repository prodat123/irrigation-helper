// utils/coordinateConversion.js

/**
 * Convert pixel coordinates to geographical coordinates.
 * @param {number} x - The x-coordinate (column) in pixels.
 * @param {number} y - The y-coordinate (row) in pixels.
 * @param {object} metadata - Metadata containing geographical information.
 * @returns {object} - An object with latitude and longitude.
 */
export const pixelToGeo = (x, y, metadata) => {
    const { topLeftLat, topLeftLon, pixelWidth, pixelHeight, imageWidth, imageHeight } = metadata;
  
    // Convert pixel coordinates to geographical coordinates
    const lon = topLeftLon + x * pixelWidth;
    const lat = topLeftLat - y * pixelHeight;
  
    return { lat, lon };
};
  