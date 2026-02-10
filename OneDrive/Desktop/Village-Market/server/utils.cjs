/**
 * Distance & Location Utilities
 * Production-ready utilities for accurate location handling and distance calculations
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers with high precision
 * 
 * @param {number} lat1 - User latitude
 * @param {number} lon1 - User longitude
 * @param {number} lat2 - Shop latitude
 * @param {number} lon2 - Shop longitude
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Validate inputs
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    throw new Error('Invalid coordinates: all coordinates must be valid numbers');
  }

  // Validate coordinate ranges
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }

  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.asin(Math.sqrt(a));
  const distance = R * c;

  // Return distance rounded to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Validate GPS coordinates
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {object} { isValid: boolean, error: string|null }
 */
function validateCoordinates(latitude, longitude) {
  // Check if null or undefined
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return { isValid: false, error: 'Coordinates cannot be null or undefined' };
  }

  // Parse to float
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  // Check if valid numbers
  if (isNaN(lat) || isNaN(lon)) {
    return { isValid: false, error: 'Coordinates must be valid numbers' };
  }

  // Check latitude range
  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  // Check longitude range
  if (lon < -180 || lon > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  // Check for impossible coordinates (0, 0)
  if (lat === 0 && lon === 0) {
    return { isValid: false, error: 'Coordinates cannot be (0, 0) - likely default/mock coordinates' };
  }

  return { isValid: true, error: null };
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

module.exports = {
  calculateDistance,
  validateCoordinates,
  formatDistance
};
