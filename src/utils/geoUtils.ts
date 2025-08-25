import { Merchant, MerchantWithDistance } from '@/types/merchant';

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Sort merchants by distance from a given point and filter within radius
 */
export function sortMerchantsByDistance(
  merchants: Merchant[], 
  userLat: number, 
  userLon: number,
  maxRadius: number = 10 // Default 10km radius
): MerchantWithDistance[] {
  return merchants
    .map(merchant => ({
      ...merchant,
      distance: calculateDistance(userLat, userLon, merchant.latitude, merchant.longitude)
    }))
    .filter(merchant => merchant.distance <= maxRadius)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get user's current position using the Geolocation API
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  });
}

/**
 * Generate Google Maps URL for directions
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Format full address string
 */
export function formatAddress(merchant: Merchant): string {
  const parts = [
    merchant.address1,
    merchant.address2,
    merchant.address3,
    `${merchant.postalCode} ${merchant.city}`,
    merchant.state,
    merchant.country
  ].filter(part => part && part.trim() !== '');
  
  return parts.join(' ').replace(/,\s*$/, ''); // Remove trailing comma
}