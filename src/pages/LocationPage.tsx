import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Map from '@/components/Map';
import MerchantList from '@/components/MerchantList';
import LocationStatus from '@/components/LocationStatus';
import { Merchant, MerchantWithDistance } from '@/types/merchant';
import { getLocationWithFallback, detectInAppBrowser } from '@/utils/geoUtils';
import { toast } from '@/hooks/use-toast';
import merchantsData from '@/data/merchants.json';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, Users, Store, Clock, Navigation } from 'lucide-react';

// Klang Valley location data
const klangValleyLocations = {
  'kuala-lumpur': {
    name: 'Kuala Lumpur',
    center: { lat: 3.1390, lng: 101.6869 },
    description: 'Ibu kota Malaysia dengan banyak kedai MyKasih di pusat bandar dan kawasan perumahan',
    keywords: ['Kuala Lumpur', 'KL', 'Bandaraya', 'Pusat Bandar']
  },
  'petaling-jaya': {
    name: 'Petaling Jaya',
    center: { lat: 3.1073, lng: 101.6085 },
    description: 'Bandar satelit utama dengan kedai MyKasih di kawasan perumahan dan komersial',
    keywords: ['Petaling Jaya', 'PJ', 'SS', 'Seksyen']
  },
  'shah-alam': {
    name: 'Shah Alam',
    center: { lat: 3.0733, lng: 101.5185 },
    description: 'Ibu negeri Selangor dengan kedai MyKasih di kawasan perumahan dan industri',
    keywords: ['Shah Alam', 'Seksyen', 'Kawasan Perindustrian']
  },
  'klang': {
    name: 'Klang',
    center: { lat: 3.0333, lng: 101.4500 },
    description: 'Bandar diraja dengan kedai MyKasih di kawasan bersejarah dan perumahan',
    keywords: ['Klang', 'Bandar Diraja', 'Teluk Pulai', 'Pandamaran']
  },
  'subang-jaya': {
    name: 'Subang Jaya',
    center: { lat: 3.0438, lng: 101.5806 },
    description: 'Bandar maju dengan kedai MyKasih di kawasan perumahan dan komersial',
    keywords: ['Subang Jaya', 'USJ', 'SS', 'Puchong']
  },
  'cheras': {
    name: 'Cheras',
    center: { lat: 3.0833, lng: 101.7500 },
    description: 'Kawasan perumahan utama dengan banyak kedai MyKasih untuk keluarga',
    keywords: ['Cheras', 'Taman', 'Perumahan', 'Bandar Mahkota']
  },
  'ampang': {
    name: 'Ampang',
    center: { lat: 3.1500, lng: 101.7500 },
    description: 'Kawasan bersejarah dengan kedai MyKasih di kawasan perumahan',
    keywords: ['Ampang', 'Taman', 'Perumahan', 'Kawasan Bersejarah']
  },
  'kepong': {
    name: 'Kepong',
    center: { lat: 3.2167, lng: 101.6333 },
    description: 'Kawasan perumahan dengan kedai MyKasih untuk komuniti setempat',
    keywords: ['Kepong', 'Taman', 'Perumahan', 'Bandar Menjalara']
  }
};

const LocationPage = () => {
  const { location } = useParams<{ location: string }>();
  const [merchants, setMerchants] = useState<(Merchant | MerchantWithDistance)[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number; method: 'gps' | 'ip' } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentRadius, setCurrentRadius] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreStores, setHasMoreStores] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isInAppBrowser] = useState(detectInAppBrowser());

  const locationData = location ? klangValleyLocations[location as keyof typeof klangValleyLocations] : null;

  // Load stores within current radius
  const loadStoresInRadius = useCallback((lat: number, lng: number, radius: number) => {
    const storesInRadius = sortMerchantsByDistance(merchantsData, lat, lng, radius);
    setMerchants(storesInRadius);
    setCurrentRadius(radius);
    
    // Check if there are more stores available beyond current radius
    const nextRadiusStores = sortMerchantsByDistance(merchantsData, lat, lng, radius + 5);
    setHasMoreStores(nextRadiusStores.length > storesInRadius.length);
    
    return storesInRadius;
  }, []);

  const handleFindNearMe = useCallback(async () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileSheetOpen(false);
      setIsSidebarOpen(false);
    }

    setIsLoadingLocation(true);

    try {
      const location = await getLocationWithFallback();
      
      setUserLocation({
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        method: location.method
      });
      
      let initialRadius = 5;
      if (location.accuracy > 10000) {
        initialRadius = 10;
      } else if (location.accuracy > 1000) {
        initialRadius = 7;
      }
      
      const nearbyStores = loadStoresInRadius(location.lat, location.lng, initialRadius);
      
    } catch (error) {
      console.error('Error getting location:', error);
      
      if (isInAppBrowser) {
        toast({
          title: "Location access blocked",
          description: "In-app browsers block location access. Try opening in your device's browser.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Location access denied",
          description: "Please enable location access in your browser settings.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoadingLocation(false);
    }
  }, [loadStoresInRadius, isInAppBrowser]);

  // Auto load stores for the specific location
  useEffect(() => {
    if (locationData) {
      const nearbyStores = loadStoresInRadius(locationData.center.lat, locationData.center.lng, 10);
      setUserLocation({
        lat: locationData.center.lat,
        lng: locationData.center.lng,
        accuracy: 1000,
        method: 'gps'
      });
    }
  }, [locationData, loadStoresInRadius]);

  const getLocationButtonProps = useCallback(() => {
    if (!userLocation) {
      return {
        text: "Find My Location",
        action: handleFindNearMe,
        icon: <MapPin className="w-4 h-4" />
      };
    }
    
    if (userLocation.method === 'gps') {
      return {
        text: "Refresh GPS Location",
        action: handleFindNearMe,
        icon: <Navigation className="w-4 h-4" />
      };
    }
    
    return {
      text: "Refresh IP Location",
      action: handleFindNearMe,
      icon: <MapPin className="w-4 h-4" />
    };
  }, [userLocation, handleFindNearMe]);

  const handleLoadMoreStores = useCallback(async () => {
    if (!userLocation || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const newRadius = currentRadius + 5;
      const moreStores = loadStoresInRadius(userLocation.lat, userLocation.lng, newRadius);
      
      toast({
        title: "More stores loaded",
        description: `Now showing ${moreStores.length} stores within ${newRadius}km.`,
      });
      
    } catch (error) {
      console.error('Error loading more stores:', error);
      toast({
        title: "Error loading stores",
        description: "Failed to load more stores. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [userLocation, isLoadingMore, currentRadius, loadStoresInRadius]);

  const handleMerchantSelect = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
      setIsMobileSheetOpen(false);
    }
  };

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!locationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Location Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              The requested location is not available.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Location Header */}
      <div className="bg-card/95 backdrop-blur-xl border-b border-border/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Kedai MyKasih di {locationData.name}
              </h1>
            </div>
          </div>
          <div className="flex gap-1">
            <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-1">
              <Store className="w-3 h-3" />
              {merchants.length}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1">
              <MapPin className="w-3 h-3" />
              {locationData.name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:block md:relative z-20 w-80 h-full bg-card/95 backdrop-blur-xl overflow-y-auto overscroll-contain border-r border-border/50 shadow-elegant">
          <LocationStatus
            location={userLocation}
            onRefreshLocation={handleFindNearMe}
            isLoadingLocation={isLoadingLocation}
            getLocationButtonProps={getLocationButtonProps}
          />
          
          <MerchantList
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onMerchantSelect={handleMerchantSelect}
            onFindNearMe={handleFindNearMe}
            onLoadMore={handleLoadMoreStores}
            isLoadingLocation={isLoadingLocation}
            isLoadingMore={isLoadingMore}
            hasMoreStores={hasMoreStores}
            userLocation={userLocation}
            currentRadius={currentRadius}
          />
        </aside>

        {/* Map Container */}
        <main className="flex-1 relative h-full overflow-hidden">
          <Map
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onMerchantSelect={handleMerchantSelect}
            userLocation={userLocation}
            onFindNearMe={handleFindNearMe}
          />

          {/* Mobile Floating Buttons */}
          <div className="md:hidden fixed bottom-4 right-4 z-30 flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleFindNearMe}
              className="rounded-full shadow-elegant"
            >
              <MapPin className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsMobileSheetOpen(true)}
              className="rounded-full shadow-elegant"
            >
              <Store className="w-4 h-4" />
            </Button>
          </div>
        </main>

        {/* Mobile Full-screen Sheet */}
        <div className="md:hidden">
          {/* Mobile sheet content would go here - same as Index.tsx */}
        </div>
      </div>
    </div>
  );
};

// Helper functions (same as Index.tsx)
function sortMerchantsByDistance(
  merchants: Merchant[], 
  userLat: number, 
  userLon: number,
  maxRadius: number = 10
): MerchantWithDistance[] {
  return merchants
    .map(merchant => ({
      ...merchant,
      distance: calculateDistance(userLat, userLon, merchant.latitude, merchant.longitude)
    }))
    .filter(merchant => merchant.distance <= maxRadius)
    .sort((a, b) => a.distance - b.distance);
}

function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100;
}

export default LocationPage;
