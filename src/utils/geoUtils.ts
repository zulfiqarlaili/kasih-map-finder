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
 * Detect if the app is running in an in-app browser
 */
export function detectInAppBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Common in-app browser patterns
  const inAppPatterns = [
    'fbav', // Facebook
    'instagram', // Instagram
    'line', // Line
    'wv', // WebView
    'micromessenger', // WeChat
    'snapchat', // Snapchat
    'tiktok', // TikTok
    'pinterest', // Pinterest
    'linkedin', // LinkedIn
    'twitter', // Twitter/X
    'whatsapp', // WhatsApp
    'telegram', // Telegram
    'discord', // Discord
    'slack', // Slack
    'zoom', // Zoom
    'teams', // Microsoft Teams
    'skype', // Skype
    'viber', // Viber
    'signal', // Signal
    'threema', // Threema
    'wire', // Wire
    'session', // Session
    'element', // Element/Matrix
    'riot', // Riot/Matrix
    'jitsi', // Jitsi
    'meet', // Google Meet
    'duo', // Google Duo
    'facetime', // FaceTime
    'imessage', // iMessage
    'hangouts', // Google Hangouts
    'skype', // Skype
    'viber', // Viber
    'wechat', // WeChat
    'qq', // QQ
    'kakao', // KakaoTalk
    'line', // Line
    'telegram', // Telegram
    'whatsapp', // WhatsApp
    'signal', // Signal
    'threema', // Threema
    'wire', // Wire
    'session', // Session
    'element', // Element/Matrix
    'riot', // Riot/Matrix
    'jitsi', // Jitsi
    'meet', // Google Meet
    'duo', // Google Duo
    'facetime', // FaceTime
    'imessage', // iMessage
    'hangouts', // Google Hangouts
  ];
  
  return inAppPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Get approximate location using IP address
 */
export async function getLocationFromIP(): Promise<{ lat: number; lng: number; accuracy: number }> {
  try {
    // Try multiple IP geolocation services for redundancy
    const services = [
      'https://ipapi.co/json/',
      'https://ipapi.com/json/',
      'https://ipinfo.io/json',
      'https://api.ipgeolocation.io/ipgeo?apiKey=free',
      'https://extreme-ip-lookup.com/json/'
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Extract coordinates from different service formats
          let lat: number | null = null;
          let lng: number | null = null;
          
          if (data.latitude && data.longitude) {
            lat = parseFloat(data.latitude);
            lng = parseFloat(data.longitude);
          } else if (data.lat && data.lon) {
            lat = parseFloat(data.lat);
            lng = parseFloat(data.lon);
          } else if (data.loc) {
            const [latStr, lngStr] = data.loc.split(',');
            lat = parseFloat(latStr);
            lng = parseFloat(lngStr);
          }
          
          if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            return {
              lat,
              lng,
              accuracy: 50000 // IP geolocation is typically accurate to ~50km
            };
          }
        }
      } catch (error) {
        console.warn(`IP geolocation service ${service} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All IP geolocation services failed');
  } catch (error) {
    console.error('IP geolocation failed:', error);
    throw new Error('Unable to determine location from IP address');
  }
}

/**
 * Get user's current position using multiple fallback strategies
 */
export async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise(async (resolve, reject) => {
    if (!navigator.geolocation) {
      // Fallback to IP-based geolocation
      try {
        const ipLocation = await getLocationFromIP();
        // Create a mock GeolocationPosition object
        const mockPosition: GeolocationPosition = {
          coords: {
            latitude: ipLocation.lat,
            longitude: ipLocation.lng,
            accuracy: ipLocation.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        };
        resolve(mockPosition);
        return;
      } catch (error) {
        reject(new Error('Geolocation is not supported and IP fallback failed.'));
        return;
      }
    }

    // Try standard geolocation first
    navigator.geolocation.getCurrentPosition(
      resolve,
      async (error) => {
        console.warn('Standard geolocation failed:', error);
        
        // If geolocation fails, try IP-based fallback
        try {
          const ipLocation = await getLocationFromIP();
          const mockPosition: GeolocationPosition = {
            coords: {
              latitude: ipLocation.lat,
              longitude: ipLocation.lng,
              accuracy: ipLocation.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          };
          resolve(mockPosition);
        } catch (ipError) {
          reject(error); // Return original error if IP fallback also fails
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  });
}

/**
 * Get location with comprehensive fallback strategy
 */
export async function getLocationWithFallback(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
  method: 'gps' | 'ip';
  isInAppBrowser: boolean;
}> {
  const isInAppBrowser = detectInAppBrowser();
  
  try {
    // Try GPS first
    const position = await getCurrentPosition();
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      method: 'gps',
      isInAppBrowser
    };
  } catch (error) {
    console.warn('GPS location failed, trying IP fallback:', error);
    
    try {
      // Fallback to IP-based location
      const ipLocation = await getLocationFromIP();
      return {
        lat: ipLocation.lat,
        lng: ipLocation.lng,
        accuracy: ipLocation.accuracy,
        method: 'ip',
        isInAppBrowser
      };
    } catch (ipError) {
      console.error('All location methods failed:', ipError);
      throw new Error('Unable to determine location. Please try refreshing or check your browser settings.');
    }
  }
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

/**
 * Parse address string to coordinates using geocoding
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  try {
    // Try OpenStreetMap Nominatim first (free, no API key required)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KasihMapFinder/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
    
    throw new Error('No results found');
  } catch (error) {
    console.error('Geocoding failed:', error);
    throw new Error('Unable to find coordinates for this address');
  }
}

/**
 * Get instructions for enabling location in different browsers
 */
export function getLocationInstructions(): string {
  const isInAppBrowser = detectInAppBrowser();
  
  if (isInAppBrowser) {
    return `You're using an in-app browser which blocks location access by default. To enable location:
    
1. Open this app in your device's default browser (Safari/Chrome)
2. Or copy the link and paste it in your browser
3. Or manually enter your location below`;
  }
  
  return `To enable location access:
1. Click "Allow" when prompted
2. Or check your browser's location settings
3. Or manually enter your location below`;
}