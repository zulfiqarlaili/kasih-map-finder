import React, { useState, useEffect, useCallback } from 'react';
import Map from '@/components/Map';
import MerchantList from '@/components/MerchantList';
import LocationStatus from '@/components/LocationStatus';
import { Merchant, MerchantWithDistance } from '@/types/merchant';
import { getLocationWithFallback, detectInAppBrowser } from '@/utils/geoUtils';
import { toast } from '@/hooks/use-toast';
import merchantsData from '@/data/merchants.json';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu, X, MapPin, Loader2, List, Globe, Smartphone } from 'lucide-react';

const Index = () => {
  const [merchants, setMerchants] = useState<(Merchant | MerchantWithDistance)[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number; method: 'gps' | 'ip' } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentRadius, setCurrentRadius] = useState(5); // Start with 5km radius
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreStores, setHasMoreStores] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isInAppBrowser] = useState(detectInAppBrowser());

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
    // On mobile, immediately close the merchant list to reveal the map
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
      
      // Adjust initial radius based on accuracy
      let initialRadius = 5;
      if (location.accuracy > 10000) {
        initialRadius = 10; // Larger radius for low accuracy locations
      } else if (location.accuracy > 1000) {
        initialRadius = 7; // Medium radius for medium accuracy
      }
      
      const nearbyStores = loadStoresInRadius(location.lat, location.lng, initialRadius);
      
      // Show appropriate message based on location method
      // if (location.method === 'ip') {
      //   toast({
      //     title: "Location found (IP-based)",
      //     description: `Found ${nearbyStores.length} stores within ${initialRadius}km. Accuracy: ~50km.`,
      //   });
      // } else if (location.method === 'gps') {
      //   toast({
      //     title: "Location found (GPS)",
      //     description: `Found ${nearbyStores.length} stores within ${initialRadius}km.`,
      //   });
      // }
      
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

  // Auto check nearby on initial load (only if not in in-app browser)
  useEffect(() => {
    if (!isInAppBrowser) {
      handleFindNearMe();
    }
  }, [handleFindNearMe, isInAppBrowser]);

  // Function to get the appropriate location button text and action
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
        icon: <Smartphone className="w-4 h-4" />
      };
    }
    
    // For IP location, show option to refresh
    return {
      text: "Refresh IP Location",
      action: handleFindNearMe,
      icon: <Globe className="w-4 h-4" />
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
    // Close sidebar on mobile when merchant is selected
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

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">

      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0 overflow-hidden">
        {/* Sidebar (hidden on mobile, visible on md+) */}
        <aside 
          className={`
            hidden md:block md:relative z-20 w-80 h-full bg-card/95 backdrop-blur-xl overflow-y-auto overscroll-contain
            border-r border-border/50 shadow-elegant
          `}
        >
          {/* Location Status */}
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
        <main 
          className={`
            flex-1 relative h-full overflow-hidden
            ${isSidebarOpen ? 'md:ml-0' : ''}
          `}
        >
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
              <List className="w-4 h-4" />
            </Button>
          </div>
        </main>

        {/* Mobile Full-screen Sheet for Merchant List */}
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="bottom" className="p-0 h-[100dvh] md:hidden">
            <SheetHeader className="p-4 border-b border-border/30">
              <SheetTitle>Stores</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100dvh-61px)] overflow-hidden">
              {/* Location Status for Mobile */}
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

// Helper function to sort merchants by distance (moved from geoUtils for this component)
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

// Helper function to calculate distance (moved from geoUtils for this component)
function calculateDistance(
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

export default Index;
